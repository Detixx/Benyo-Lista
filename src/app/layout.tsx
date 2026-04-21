import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Benyo-Lista',
  description: 'Souls-like és akciójátékok backlog trackere',
  viewport: 'width=device-width, initial-scale=1',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="hu">
      <head>
        <link
          href="https://api.fontshare.com/v2/css?f[]=general-sans@400,500,600,700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  )
}
