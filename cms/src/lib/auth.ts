import 'server-only'
import bcrypt from 'bcryptjs'
import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { cache } from 'react'
import { db } from './db'
import { env } from './env'

const COOKIE = 'cms_session'
const secret = new TextEncoder().encode(env.SESSION_SECRET)

export type SessionUser = {
  id: string
  email: string
  name: string | null
  role: 'OWNER' | 'ADMIN' | 'EDITOR'
}

export function hashPassword(plain: string) {
  return bcrypt.hash(plain, 12)
}

export function verifyPassword(plain: string, hash: string) {
  return bcrypt.compare(plain, hash)
}

/* The cookie carries a session row id, not the user itself. A signed JWT alone
   cannot be revoked; keeping the row means logout and expiry are real. */
export async function createSession(userId: string) {
  const expiresAt = new Date(Date.now() + env.SESSION_TTL_HOURS * 3600 * 1000)
  const session = await db.session.create({ data: { userId, expiresAt } })

  const token = await new SignJWT({ sid: session.id })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expiresAt)
    .sign(secret)

  const jar = await cookies()
  jar.set(COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    expires: expiresAt,
  })
}

export async function destroySession() {
  const jar = await cookies()
  const token = jar.get(COOKIE)?.value
  if (token) {
    try {
      const { payload } = await jwtVerify(token, secret)
      await db.session.deleteMany({ where: { id: payload.sid as string } })
    } catch {
      /* already invalid — clearing the cookie is enough */
    }
  }
  jar.delete(COOKIE)
}

/* Deduped per request: the layout, the page and any server action in the same
   render all resolve the user with one query. */
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  const jar = await cookies()
  const token = jar.get(COOKIE)?.value
  if (!token) return null

  try {
    const { payload } = await jwtVerify(token, secret)
    const session = await db.session.findUnique({
      where: { id: payload.sid as string },
      include: { user: true },
    })
    if (!session || session.expiresAt < new Date()) return null
    const { id, email, name, role } = session.user
    return { id, email, name, role }
  } catch {
    return null
  }
})

/** Use in every admin server action. Throws rather than returning null so a
 *  forgotten check fails closed. */
export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser()
  if (!user) throw new Error('UNAUTHORIZED')
  return user
}
