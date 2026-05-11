import type { Metadata } from 'next'
import { Geist, Geist_Mono, Source_Serif_4 } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const geistSans = Geist({
  subsets: ['latin'],
  variable: '--font-geist-sans',
})
const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-geist-mono',
})
const sourceSerif = Source_Serif_4({
  subsets: ['latin'],
  variable: '--font-source-serif',
})

const BASE_URL = 'https://www.taxfiley.com';

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: 'Taxfiley – Smart Tax Filing & Client Portal',
    template: '%s | Taxfiley',
  },
  description:
    'Taxfiley is a professional tax filing and client management platform. Streamline tax return workflows, collaborate with clients, and deliver filings faster.',
  keywords: [
    'tax filing software',
    'tax return management',
    'tax client portal',
    'tax preparation CRM',
    'online tax organizer',
    'tax workflow automation',
    'CPA software',
    'accounting client portal',
    'tax preparer software',
    'Taxfiley',
  ],
  authors: [{ name: 'Taxfiley', url: BASE_URL }],
  creator: 'Taxfiley',
  publisher: 'Taxfiley',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-snippet': -1,
      'max-image-preview': 'large',
      'max-video-preview': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: BASE_URL,
    siteName: 'Taxfiley',
    title: 'Taxfiley – Smart Tax Filing & Client Portal',
    description:
      'Professional tax filing and client management platform. Streamline workflows, collaborate with clients, and deliver filings faster.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Taxfiley – Smart Tax Filing & Client Portal',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Taxfiley – Smart Tax Filing & Client Portal',
    description:
      'Professional tax filing and client management platform for tax preparers and their clients.',
    images: ['/og-image.png'],
    creator: '@taxfiley',
  },
  icons: {
    icon: [{ url: '/icon.svg', type: 'image/svg+xml' }],
    apple: '/apple-icon.png',
  },
  alternates: {
    canonical: BASE_URL,
  },
  category: 'technology',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${sourceSerif.variable} font-sans antialiased`}
      >
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
