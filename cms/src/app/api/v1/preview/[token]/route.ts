import { NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import { db } from '@/lib/db'
import { getCaseStudy } from '@/lib/public-content'
import { corsHeaders } from '@/lib/cors'
import { env } from '@/lib/env'

export const dynamic = 'force-dynamic'

/* The only route that can return a draft, and it needs a signed, 30-minute
   token minted by an authenticated editor. Never cached (§32). */
export async function GET(request: Request, { params }: { params: Promise<{ token: string }> }) {
  const origin = request.headers.get('origin')
  const { token } = await params

  try {
    const secret = new TextEncoder().encode(env.SESSION_SECRET)
    const { payload } = await jwtVerify(token, secret)
    if (payload.kind !== 'preview' || typeof payload.caseStudyId !== 'string') {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401, headers: corsHeaders(origin) })
    }

    const record = await db.caseStudy.findUnique({
      where: { id: payload.caseStudyId },
      select: { slug: true },
    })
    if (!record) {
      return NextResponse.json({ error: 'Not found' }, { status: 404, headers: corsHeaders(origin) })
    }

    const caseStudy = await getCaseStudy(record.slug, { includeDrafts: true })
    return NextResponse.json(
      { preview: true, caseStudy },
      { headers: { ...corsHeaders(origin), 'Cache-Control': 'no-store' } },
    )
  } catch {
    return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401, headers: corsHeaders(origin) })
  }
}
