import React from "react"
import type { Metadata, Viewport } from "next"
import { JetBrains_Mono, Inter } from "next/font/google"

import "./globals.css"

const _inter = Inter({ subsets: ["latin"] })
const _jetbrainsMono = JetBrains_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "OpenVerb Chess - AI vs AI Chess Engine",
  description:
    "Watch AI agents play chess through the OpenVerb protocol. Every move is a logged, validated, replayable verb action.",
}

export const viewport: Viewport = {
  themeColor: "#111318",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">{children}</body>
    </html>
  )
}
