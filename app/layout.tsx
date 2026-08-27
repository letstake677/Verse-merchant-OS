import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "Verse Merchant OS | Web3 Merchant Invoicing & Checkout",
  description: "Next-gen Web3 invoicing with automated real-time POL, VERSE, and USDC conversion on Polygon.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <script
          defer
          data-domain="verse-merchant-os.vercel.app"
          src="https://analytics.vgdh.io/js/script.js"
        />
      </head>
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased selection:bg-purple-500 selection:text-white">
        {children}
      </body>
    </html>
  )
}
