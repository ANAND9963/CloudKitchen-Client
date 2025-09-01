import type { Metadata } from 'next'
import { Toaster } from 'react-hot-toast'
import './globals.css'

export const metadata: Metadata = {
  title: 'CloudKitchen',
  description: 'CloudKitchen app'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en">
        <body className="min-h-dvh antialiased bg-neutral-50 text-neutral-900">
        {children}
        <Toaster/>
        </body>
        </html>
    )
  }


