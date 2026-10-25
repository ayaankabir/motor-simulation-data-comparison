import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import './globals.css'

// No external font dependencies - use system fonts directly
// CSS variables defined in globals.css

export const metadata: Metadata = {
  title: 'Induction Motor Condition Monitoring',
  description:
    'A software-only, physics-based reduced-order simulation dashboard for induction motor condition monitoring. Simulation only; literature-example parameters; no experimental validation.',
  generator: 'v0.app',
}

export const viewport: Viewport = {
  colorScheme: 'dark',
  themeColor: '#101826',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased font-sans">
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
