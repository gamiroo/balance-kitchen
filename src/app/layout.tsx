import './globals.css'      // Tailwind base+components+utilities
import { League_Spartan, Inter } from 'next/font/google'
import { ZohoSalesIQ } from '../components/zoho/ZohoSalesIQ'
import { SessionWrapper } from '../components/SessionWrapper'
import { ThemeProvider } from '../components/providers/ThemeProvider'

const inter = Inter({ subsets: ['latin'] })
const leagueSpartan = League_Spartan({ subsets: ['latin'], weight: ['400', '500', '600', '700', '800', '900'] })

export const metadata = {
  title: 'Balance Kitchen – Healthy Meals Delivered Fast',
  description: 'Save time, stay fit, taste the difference with our rotating menu of fresh, nutritious meals.',
  icons: '/favicon.ico',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} ${leagueSpartan.className}`}>
        <SessionWrapper>
          <ThemeProvider>{children}</ThemeProvider>
        </SessionWrapper>
        <ZohoSalesIQ enabled={true} />
      </body>
    </html>
  )
}