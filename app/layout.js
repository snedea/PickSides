import './globals.css'

export const metadata = {
  title: 'PickSides - AI Debate App',
  description: 'Phase 2: Static Debate Display',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}