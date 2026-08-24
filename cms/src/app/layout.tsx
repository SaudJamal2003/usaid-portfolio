import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'USAID UX CMS',
  description: 'Content management for the Usaid Ahmed portfolio',
  robots: { index: false, follow: false },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
