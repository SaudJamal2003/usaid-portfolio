import { NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { mediaPayload } from '@/lib/media'

/* Admin-only: the picker reads the whole library, drafts included. */
export async function GET(request: Request) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const ids = new URL(request.url).searchParams.get('ids')
  const media = await db.media.findMany({
    where: ids ? { id: { in: ids.split(',').filter(Boolean) } } : undefined,
    orderBy: { createdAt: 'desc' },
    take: ids ? undefined : 200,
  })

  return NextResponse.json({ media: media.map(mediaPayload) })
}
