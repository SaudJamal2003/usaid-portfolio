import 'server-only'
import { db } from './db'

const WINDOW_MINUTES = 15
const MAX_ATTEMPTS = 8

/* Login throttling (§8). Backed by Postgres rather than memory so it survives
   a restart and works if the CMS is ever run with more than one worker. */
export async function checkLoginRate(email: string, ip: string) {
  const since = new Date(Date.now() - WINDOW_MINUTES * 60_000)
  const attempts = await db.loginAttempt.count({
    where: { createdAt: { gte: since }, OR: [{ email }, { ip }] },
  })
  return { allowed: attempts < MAX_ATTEMPTS, remaining: Math.max(0, MAX_ATTEMPTS - attempts) }
}

export async function recordFailedLogin(email: string, ip: string) {
  await db.loginAttempt.create({ data: { email, ip } })
}

export async function clearLoginAttempts(email: string) {
  await db.loginAttempt.deleteMany({ where: { email } })
}
