import { NextResponse, type NextRequest } from 'next/server'

/* Coarse gate only. The cookie is not verified here -- middleware runs on the
   edge runtime where the Prisma session lookup is not available, so a forged
   cookie still reaches the page. Every admin page and server action calls
   requireUser(), which is the real check; this just spares unauthenticated
   visitors a redirect chain. */
export function middleware(request: NextRequest) {
  const hasCookie = request.cookies.has('cms_session')
  const { pathname } = request.nextUrl

  if (pathname.startsWith('/admin') && !hasCookie) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('next', pathname)
    return NextResponse.redirect(url)
  }

  if (pathname === '/login' && hasCookie) {
    const url = request.nextUrl.clone()
    url.pathname = '/admin'
    url.search = ''
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = { matcher: ['/admin/:path*', '/login'] }
