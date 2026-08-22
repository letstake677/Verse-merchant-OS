/**
 * Reusable formatting and presentation utilities for Web3 wallet addresses.
 */

/**
 * Formats a 0x-prefixed Ethereum / EVM address to a standard truncated display string.
 * Example: 0x1234567890abcdef1234567890abcdef12345678 -> 0x1234...5678
 * 
 * Never truncates the underlying stored or transmitted value.
 */
export function formatWalletAddress(
  address: string | null | undefined,
  options?: {
    prefixLen?: number
    suffixLen?: number
  }
): string {
  if (!address || typeof address !== "string") {
    return "—"
  }

  const clean = address.trim()
  if (clean.length < 10) {
    return clean
  }

  const prefixLen = options?.prefixLen ?? 6
  const suffixLen = options?.suffixLen ?? 4

  // Ensure prefix contains "0x"
  const start = clean.slice(0, prefixLen)
  const end = clean.slice(-suffixLen)

  return `${start}...${end}`
}

/**
 * Checks if a string matches a basic 42-character hexadecimal Ethereum address format.
 */
export function isValidEthereumAddress(address: string | null | undefined): boolean {
  if (!address || typeof address !== "string") return false
  return /^0x[a-fA-F0-9]{40}$/.test(address.trim())
}

/**
 * Safe clipboard copy utility with fallback for iframe sandboxes or older browsers.
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  if (!text) return false

  // 1. Try modern navigator.clipboard API
  if (typeof navigator !== "undefined" && navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
    try {
      await navigator.clipboard.writeText(text)
      return true
    } catch {
      // Fallback to execCommand if clipboard API permissions fail in iframe
    }
  }

  // 2. Fallback using temporary textarea
  try {
    const textArea = document.createElement("textarea")
    textArea.value = text
    textArea.style.position = "fixed"
    textArea.style.top = "-9999px"
    textArea.style.left = "-9999px"
    textArea.setAttribute("readonly", "")
    textArea.style.opacity = "0"
    document.body.appendChild(textArea)
    textArea.focus()
    textArea.select()
    const successful = document.execCommand("copy")
    document.body.removeChild(textArea)
    return successful
  } catch {
    return false
  }
}
