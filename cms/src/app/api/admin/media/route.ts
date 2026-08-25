import { NextResponse } from 'next/server'
import type { Prisma } from '@prisma/client'
import { getSessionUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { mediaDetail } from '@/lib/media'

/* Admin-only browse endpoint. Backs both the library screen and the picker, so
   filtering and paging live here rather than being duplicated in each. */
export async function GET(request: Request) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const params = new URL(request.url).searchParams
  const ids = params.get('ids')

  // Resolving specific ids: used by pickers to render a preview of the current
  // selection, which must work even if that item has since been archived.
  if (ids) {
    const media = await db.media.findMany({ where: { id: { in: ids.split(',').filter(Boolean) } } })
    return NextResponse.json({ media: media.map(mediaDetail), total: media.length })
  }

  const query = params.get('q')?.trim() ?? ''
  const kind = params.get('kind') ?? ''
  const sort = params.get('sort') ?? 'newest'
  const includeArchived = params.get('archived') === 'true'
  const page = Math.max(1, Number(params.get('page')) || 1)
  const perPage = Math.min(60, Math.max(1, Number(params.get('perPage')) || 24))

  const mimePrefix =
    kind === 'image' ? 'image/' : kind === 'video' ? 'video/' : kind === 'document' ? 'application/' : ''

  const where: Prisma.MediaWhereInput = {
    ...(includeArchived ? {} : { archivedAt: null }),
    ...(mimePrefix && { mimeType: { startsWith: mimePrefix } }),
    ...(query && {
      OR: [
        { originalFilename: { contains: query, mode: 'insensitive' } },
        { displayName: { contains: query, mode: 'insensitive' } },
        { altText: { contains: query, mode: 'insensitive' } },
        { caption: { contains: query, mode: 'insensitive' } },
      ],
    }),
  }

  const orderBy: Prisma.MediaOrderByWithRelationInput =
    sort === 'oldest' ? { createdAt: 'asc' }
    : sort === 'largest' ? { size: 'desc' }
    : sort === 'name' ? { originalFilename: 'asc' }
    : { createdAt: 'desc' }

  const [media, total] = await Promise.all([
    db.media.findMany({ where, orderBy, skip: (page - 1) * perPage, take: perPage }),
    db.media.count({ where }),
  ])

  return NextResponse.json({
    media: media.map(mediaDetail),
    total,
    page,
    perPage,
    pages: Math.max(1, Math.ceil(total / perPage)),
  })
}
