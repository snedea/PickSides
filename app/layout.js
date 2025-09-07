import './globals.css'
import { LanguageProvider } from '../contexts/LanguageContext'

export const metadata = {
  title: 'PickSides - AI Debate App',
  description: 'Multi-language TikTok-style debate app with heart-button voting',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <LanguageProvider>
          {children}
        </LanguageProvider>
      </body>
    </html>
  )
}