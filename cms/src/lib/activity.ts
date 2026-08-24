import 'server-only'
import { db } from './db'

/* Important mutations only -- never per keystroke (§47). */
export async function logActivity(input: {
  userId?: string
  action: string
  entityType: string
  entityId?: string
  summary: string
}) {
  await db.activityLog.create({ data: input })
}
