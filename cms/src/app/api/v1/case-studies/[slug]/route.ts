import { NextResponse } from 'next/server'
import { getCaseStudy } from '@/lib/public-content'
import { corsHeaders } from '@/lib/cors'

export const dynamic = 'force-dynamic'

export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const origin = request.headers.get('origin')
  const { slug } = await params

  // No includeDrafts here, ever. Drafts are reachable only through /preview.
  const caseStudy = await getCaseStudy(slug)
  if (!caseStudy) {
    return NextResponse.json({ error: 'Not found' }, { status: 404, headers: corsHeaders(origin) })
  }

  return NextResponse.json(caseStudy, {
    headers: { ...corsHeaders(origin), 'Cache-Control': 'public, max-age=30, stale-while-revalidate=300' },
  })
}
