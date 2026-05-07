
import './globals.css'
import Providers from './providers'
import { Metadata } from 'next'

export const metadata :Metadata = {
  title: 'Meta Node Stake',
  description: 'My Meta Node Stake',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}