import { getDb } from "./lib/db/mongodb.ts";
import { InvoiceRepository } from "./lib/repositories/invoice-repository.ts";
import { PaymentRepository } from "./lib/repositories/payment-repository.ts";

async function run() {
  const invoice = await InvoiceRepository.findById("67c130386e8e89f81ce517f8");
  console.log("Invoice:", invoice);
  process.exit(0);
}
run();
