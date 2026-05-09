import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'SchemaLens | XML Schema (XSD) Navigator',
  description: 'High-performance XML Schema Definition navigation and visualization tool.',
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
