"use client"

import * as React from "react"
import { Copy, Check } from "lucide-react"
import { copyToClipboard } from "@/lib/utils/wallet"
import { useToast } from "@/components/ui/toast"
import { cn } from "@/lib/utils"

interface CopyAddressButtonProps {
  address: string | null | undefined
  label?: string
  successMessage?: string
  className?: string
  iconSize?: number
  showText?: boolean
  buttonText?: string
}

export function CopyAddressButton({
  address,
  label = "Copy wallet address",
  successMessage = "Wallet address copied",
  className,
  iconSize = 14,
  showText = false,
  buttonText = "Copy",
}: CopyAddressButtonProps) {
  const [copied, setCopied] = React.useState(false)
  const { toast } = useToast()

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!address) return

    const success = await copyToClipboard(address)
    if (success) {
      setCopied(true)
      toast({
        title: successMessage,
        description: `${address.slice(0, 8)}...${address.slice(-6)} copied to clipboard.`,
        type: "success",
      })
      setTimeout(() => setCopied(false), 2000)
    } else {
      toast({
        title: "Unable to Copy",
        description: "Clipboard access was unavailable. Please select and copy manually.",
        type: "error",
      })
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      disabled={!address}
      className={cn(
        "inline-flex items-center justify-center gap-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-40 disabled:pointer-events-none cursor-pointer p-1.5",
        className
      )}
      title={address ? `Full address: ${address}` : "No address available"}
      aria-label={label}
    >
      {copied ? (
        <Check className="text-emerald-600 transition-transform scale-110" style={{ width: iconSize, height: iconSize }} />
      ) : (
        <Copy style={{ width: iconSize, height: iconSize }} />
      )}
      {showText && (
        <span className="text-xs font-medium text-slate-600">
          {copied ? "Copied" : buttonText}
        </span>
      )}
    </button>
  )
}
