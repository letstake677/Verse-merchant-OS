import { PaymentRepository } from "./lib/repositories/payment-repository.js";

async function run() {
  const merchantId = "6a8d27044b012d64d00239c1";
  try {
    const summary = await PaymentRepository.getMerchantPaymentSummary(merchantId);
    console.log("CALCULATED SUMMARY METRICS:", JSON.stringify(summary, null, 2));
  } catch (error) {
    console.error("Error calculating summary:", error);
  }
}

run();
