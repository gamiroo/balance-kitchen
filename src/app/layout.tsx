import './globals.css'      // Tailwind base+components+utilities
import { League_Spartan, Inter } from 'next/font/google'
import { ZohoSalesIQ } from '../components/ZohoSalesIQ'

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
    <html lang="en">
      <body className={`${inter.className} ${leagueSpartan.className}`}>
        {children}
        <ZohoSalesIQ enabled={true} />
      </body>
    </html>
  )
}