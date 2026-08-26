"use client"

import * as React from "react"
import { Web3Provider } from "@/components/providers/web3-provider"
import { ToastProvider } from "@/components/ui/toast"
import { MerchantAuthProvider } from "@/components/providers/merchant-auth-provider"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Web3Provider>
      <ToastProvider>
        <MerchantAuthProvider>
          {children}
        </MerchantAuthProvider>
      </ToastProvider>
    </Web3Provider>
  )
}


