'use server'

import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { db } from '@/lib/db'
import { createSession, verifyPassword } from '@/lib/auth'
import { checkLoginRate, clearLoginAttempts, recordFailedLogin } from '@/lib/rate-limit'
import { logActivity } from '@/lib/activity'

const schema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(1, 'Enter your password'),
  next: z.string().optional(),
})

export type LoginState = { error?: string }

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = schema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
    next: formData.get('next'),
  })
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const { email, password, next } = parsed.data
  const headerList = await headers()
  const ip = headerList.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown'

  const rate = await checkLoginRate(email, ip)
  if (!rate.allowed) {
    return { error: 'Too many attempts. Wait 15 minutes and try again.' }
  }

  const user = await db.user.findUnique({ where: { email } })

  /* Compare against a dummy hash when the user does not exist so the response
     time does not reveal which emails are registered. */
  const hash = user?.passwordHash ?? '$2a$12$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvalidin'
  const ok = await verifyPassword(password, hash)

  if (!user || !ok) {
    await recordFailedLogin(email, ip)
    return { error: 'Email or password is incorrect.' }
  }

  await clearLoginAttempts(email)
  await createSession(user.id)
  await db.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } })
  await logActivity({
    userId: user.id,
    action: 'LOGIN',
    entityType: 'auth',
    summary: `Signed in as ${user.email}`,
  })

  // Only same-origin paths, so `next` cannot be used as an open redirect.
  redirect(next?.startsWith('/admin') ? next : '/admin')
}
