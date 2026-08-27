import { Providers } from "@/components/providers"

export default function PortalLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return <Providers>{children}</Providers>
}
