import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'AIDEN Landing Page Generator',
  description: 'AI-powered landing page copy generator with live preview',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
