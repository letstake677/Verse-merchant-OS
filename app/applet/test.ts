import { getDb } from "./lib/db/mongodb";
import { InvoiceRepository } from "./lib/repositories/invoice-repository";
import { PaymentRepository } from "./lib/repositories/payment-repository";

async function run() {
  const invoice = await InvoiceRepository.findById("67c130386e8e89f81ce517f8");
  console.log("Invoice:", invoice);
  process.exit(0);
}
run();
