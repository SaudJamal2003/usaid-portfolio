import { env } from './env'

/* Explicit allow-list; the portfolio origin(s) only. Reflecting the request
   origin unconditionally would let any site read the payload. */
export function corsHeaders(origin: string | null) {
  const headers: Record<string, string> = { Vary: 'Origin' }
  if (origin && env.PUBLIC_CORS_ORIGINS.includes(origin)) {
    headers['Access-Control-Allow-Origin'] = origin
  }
  return headers
}
