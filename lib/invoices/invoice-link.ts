import { Invoice, InvoiceItem } from "./types"

/**
 * Encodes an invoice into a URL-safe compact string for resilient cross-device sharing.
 * This guarantees that even across serverless cold starts or multi-region deployments,
 * invoice links shared via WhatsApp, Telegram, email, or QR code can always be opened and paid.
 */
export function encodeInvoiceToUrlParam(invoice: Partial<Invoice>): string {
  try {
    const compact = {
      id: invoice.id,
      inv: invoice.invoiceNumber,
      mid: invoice.merchantId,
      cn: invoice.customerName,
      ce: invoice.customerEmail,
      tot: invoice.total,
      sub: invoice.subtotal,
      tax: invoice.tax,
      cur: invoice.currency || "USD",
      due: invoice.dueDate,
      adr: invoice.paymentAddress || (invoice.merchantId?.startsWith("0x") ? invoice.merchantId : ""),
      st: invoice.status || "pending",
      it: (invoice.items || []).map((i) => ({
        id: i.id,
        d: i.description,
        q: i.quantity,
        p: i.unitPrice,
        a: i.amount,
      })),
    }

    const json = JSON.stringify(compact)
    if (typeof window !== "undefined") {
      return encodeURIComponent(btoa(unescape(encodeURIComponent(json))))
    } else {
      return encodeURIComponent(Buffer.from(json).toString("base64"))
    }
  } catch (err) {
    console.warn("Failed to encode invoice for URL:", err)
    return ""
  }
}

/**
 * Decodes an invoice from a compact URL parameter string.
 */
export function decodeInvoiceFromUrlParam(param: string): Invoice | null {
  if (!param) return null

  try {
    const raw = decodeURIComponent(param)
    let json = ""

    if (typeof window !== "undefined") {
      try {
        json = decodeURIComponent(escape(atob(raw)))
      } catch {
        json = atob(raw)
      }
    } else {
      json = Buffer.from(raw, "base64").toString("utf-8")
    }

    const c = JSON.parse(json)
    const items: InvoiceItem[] = Array.isArray(c.it)
      ? c.it.map((item: any, idx: number) => ({
          id: item.id || String(idx + 1),
          description: item.d || "Line Item",
          quantity: Number(item.q) || 1,
          unitPrice: String(item.p || "0"),
          amount: String(item.a || item.p || "0"),
        }))
      : []

    return {
      id: c.id || c.inv || "INV-0001",
      invoiceNumber: c.inv || c.id || "INV-0001",
      customerName: c.cn || "Valued Customer",
      customerEmail: c.ce || "",
      total: String(c.tot || "0"),
      subtotal: String(c.sub || c.tot || "0"),
      tax: String(c.tax || "0"),
      currency: c.cur || "USD",
      dueDate: c.due || new Date().toISOString().split("T")[0],
      paymentAddress: c.adr || "",
      paymentNetwork: "Polygon",
      chainId: 137,
      status: c.st || "pending",
      createdAt: new Date().toISOString(),
      items:
        items.length > 0
          ? items
          : [
              {
                id: "1",
                description: "Payment Service",
                quantity: 1,
                unitPrice: String(c.tot || "0"),
                amount: String(c.tot || "0"),
              },
            ],
    }
  } catch (err) {
    console.warn("Failed to decode invoice from URL param:", err)
    return null
  }
}

/**
 * Generates a complete, resilient public checkout URL with embedded snapshot data.
 */
export function generatePayUrl(invoice: Partial<Invoice>, customOrigin?: string): string {
  const targetId = invoice.id || invoice.invoiceNumber || "INV-0001"
  const origin =
    customOrigin ||
    (typeof window !== "undefined" && window.location.origin
      ? window.location.origin
      : "https://verse-merchant-os.vercel.app")

  const encoded = encodeInvoiceToUrlParam(invoice)
  if (encoded) {
    return `${origin}/pay/${encodeURIComponent(targetId)}?d=${encoded}`
  }
  return `${origin}/pay/${encodeURIComponent(targetId)}`
}
