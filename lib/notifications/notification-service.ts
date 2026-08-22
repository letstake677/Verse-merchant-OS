import { PaymentEventRepository } from "@/lib/repositories/payment-event-repository"

export interface PaymentConfirmedEvent {
  paymentId: string
  merchantId: string
  invoiceId: string
  invoiceNumber: string
  amount: string
  currency: string
  tokenSymbol: string
  payerAddress: string
  recipientAddress: string
  transactionHash: string
  blockNumber?: number
  confirmedAt: string
  customerName?: string
  customerEmail?: string
}

export interface INotificationChannel {
  channelName: string
  sendPaymentConfirmed(event: PaymentConfirmedEvent): Promise<void>
}

/**
 * Console log notification channel for local auditing and debugging.
 */
export class ConsoleNotificationChannel implements INotificationChannel {
  channelName = "ConsoleLog"

  async sendPaymentConfirmed(event: PaymentConfirmedEvent): Promise<void> {
    console.log(`[NotificationEngine:Console] Payment Confirmed Event:
      - Payment ID: ${event.paymentId}
      - Invoice: ${event.invoiceNumber} (${event.invoiceId})
      - Amount: ${event.amount} ${event.tokenSymbol}
      - Tx Hash: ${event.transactionHash}
      - Merchant: ${event.merchantId}
      - Confirmed At: ${event.confirmedAt}
    `)
  }
}

/**
 * Audit Trail notification channel for recording settlement in DB event log.
 */
export class AuditTrailNotificationChannel implements INotificationChannel {
  channelName = "AuditTrail"

  async sendPaymentConfirmed(event: PaymentConfirmedEvent): Promise<void> {
    await PaymentEventRepository.recordEvent({
      paymentId: event.paymentId,
      merchantId: event.merchantId,
      invoiceId: event.invoiceId,
      eventType: "payment_confirmed",
      status: "confirmed",
      transactionHash: event.transactionHash,
      blockNumber: event.blockNumber,
      actor: "system:polygon_verifier",
      metadata: {
        invoiceNumber: event.invoiceNumber,
        amount: event.amount,
        currency: event.currency,
        tokenSymbol: event.tokenSymbol,
        payerAddress: event.payerAddress,
        recipientAddress: event.recipientAddress,
        customerName: event.customerName,
        customerEmail: event.customerEmail,
      },
    })
  }
}

/**
 * Provider-Independent Notification Service.
 *
 * Dispatches payment events asynchronously to all registered channels.
 * Guarantees that notification delivery failures never block or affect payment settlement.
 */
export class NotificationService {
  private static channels: INotificationChannel[] = [
    new ConsoleNotificationChannel(),
    new AuditTrailNotificationChannel(),
  ]

  /**
   * Dispatches payment confirmed event to all channels safely.
   */
  static async dispatchPaymentConfirmed(event: PaymentConfirmedEvent): Promise<void> {
    // Execute asynchronously across all channels without throwing
    const promises = this.channels.map((channel) =>
      channel.sendPaymentConfirmed(event).catch((err) => {
        console.error(`[NotificationService] Channel '${channel.channelName}' failed:`, err)
      })
    )

    await Promise.all(promises)
  }
}
