import { NextResponse } from 'next/server'
import { buildPublicContent } from '@/lib/public-content'
import { corsHeaders } from '@/lib/cors'

export const dynamic = 'force-dynamic'

/* One request, whole site. The portfolio fetches this inside the
   SignatureLoader window, so N round-trips would blow the budget (§16). */
export async function GET(request: Request) {
  const origin = request.headers.get('origin')
  try {
    const content = await buildPublicContent()
    return NextResponse.json(content, {
      headers: {
        ...corsHeaders(origin),
        // Short cache with SWR: publishing is visible quickly without every
        // visitor hitting Postgres (§33).
        'Cache-Control': 'public, max-age=30, stale-while-revalidate=300',
      },
    })
  } catch (error) {
    // The portfolio falls back to bundled content on a 503, so this would
    // otherwise fail silently and invisibly.
    console.error('[api/v1/content] failed to build payload:', error)
    return NextResponse.json({ error: 'Content unavailable' }, { status: 503, headers: corsHeaders(origin) })
  }
}

export async function OPTIONS(request: Request) {
  return new Response(null, {
    status: 204,
    headers: { ...corsHeaders(request.headers.get('origin')), 'Access-Control-Allow-Methods': 'GET, OPTIONS' },
  })
}
