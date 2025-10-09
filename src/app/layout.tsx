import './globals.css'      // Tailwind base+components+utilities
import { League_Spartan, Inter } from 'next/font/google'
import MessengerChatWrapper from '../components/messenger/FacebookMessengerWrapper';

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
        <MessengerChatWrapper 
          pageId="121076650930805"
          themeColor="#0084ff"
          loggedInGreeting="Hi! How can we help you today?"
          loggedOutGreeting="Log in to chat with our team"
        />
      </body>
    </html>
  )
}
