import type { NextConfig } from 'next'

const config: NextConfig = {
  // The CMS is an internal tool; no need to ship source maps publicly.
  productionBrowserSourceMaps: false,
  serverExternalPackages: ['@prisma/client', 'bcryptjs', 'sharp'],
}

export default config
