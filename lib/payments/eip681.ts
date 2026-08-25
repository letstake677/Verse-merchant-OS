import { parseUnits } from "viem"
import { PaymentToken } from "@/types/payment"

export interface BuildEip681Params {
  recipientAddress: string
  chainId: number
  token: PaymentToken
  amount: number | string
}

/**
 * Converts a decimal amount (e.g. 10.5) to integer base units based on token decimals
 */
export function formatAmountToBaseUnits(amount: number | string, decimals: number = 18): string {
  try {
    const rawStr = typeof amount === "number" ? amount.toFixed(decimals) : amount.trim()
    // Trim trailing zeros after decimal point for cleaner parseUnits
    const cleanStr = parseFloat(rawStr).toString()
    const parsed = parseUnits(cleanStr, decimals)
    return parsed.toString()
  } catch (err) {
    console.warn("[EIP681] formatAmountToBaseUnits fallback:", err)
    // Fallback: standard calculation
    const num = typeof amount === "number" ? amount : parseFloat(amount) || 0
    const factor = BigInt(10) ** BigInt(decimals)
    const intPart = Math.floor(num)
    const fracPart = num - intPart
    const base = BigInt(intPart) * factor + BigInt(Math.round(fracPart * Number(factor)))
    return base.toString()
  }
}

/**
 * Builds standard EIP-681 Web3 URI for scanning directly with crypto wallets
 * (MetaMask, Trust Wallet, Coinbase Wallet, Rainbow, Phantom, etc.)
 *
 * Formats:
 * 1. Native Token (POL on Polygon Mainnet chain 137):
 *    ethereum:<recipientAddress>@<chainId>?value=<valueInWei>
 *
 * 2. ERC-20 Token (USDC / VERSE on Polygon Mainnet chain 137):
 *    ethereum:<contractAddress>@<chainId>/transfer?address=<recipientAddress>&uint256=<valueInBaseUnits>
 */
export function buildEip681Uri({
  recipientAddress,
  chainId,
  token,
  amount,
}: BuildEip681Params): string {
  if (!recipientAddress || !recipientAddress.startsWith("0x")) {
    return ""
  }

  const cleanRecipient = recipientAddress.trim()
  const baseUnits = formatAmountToBaseUnits(amount, token.decimals || 18)

  if (token.isNative) {
    // Native POL / MATIC payment
    return `ethereum:${cleanRecipient}@${chainId}?value=${baseUnits}`
  }

  // ERC-20 Token (USDC, VERSE) payment via transfer method
  const tokenContract = token.address?.trim()
  if (!tokenContract || !tokenContract.startsWith("0x")) {
    return `ethereum:${cleanRecipient}@${chainId}`
  }

  return `ethereum:${tokenContract}@${chainId}/transfer?address=${cleanRecipient}&uint256=${baseUnits}`
}

/**
 * Builds wallet-specific deep links when needed
 */
export function buildWalletDeepLinks(eip681Uri: string, webCheckoutUrl: string) {
  const encodedCheckoutUrl = encodeURIComponent(webCheckoutUrl)
  const encodedEip681 = encodeURIComponent(eip681Uri)

  return {
    metaMaskDapp: `https://metamask.app.link/dapp/${webCheckoutUrl.replace(/^https?:\/\//, "")}`,
    trustWallet: `https://link.trustwallet.com/open_url?coin_id=60&url=${encodedCheckoutUrl}`,
    rainbow: `https://rnbwapp.com/wc?uri=${encodedEip681}`,
    rawEip681: eip681Uri,
  }
}
