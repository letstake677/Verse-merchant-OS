import { MongoClient, ObjectId } from "mongodb";
async function run() {
  const client = new MongoClient(process.env.MONGODB_URI || "mongodb+srv://vercel-admin-user:jL7L79W8tPzZ8Wc2@cluster0.eov9d.mongodb.net/test?retryWrites=true&w=majority");
  await client.connect();
  const db = client.db();
  
  const id = "6a941ab97b1ba9cd02f540c1";
  const invoices = await db.collection("invoices").find({
    $or: [
      { _id: new ObjectId(id) },
      { id: id },
      { invoiceNumber: "INV-0013" }
    ]
  }).toArray();
  
  console.log("Invoices found for user:", invoices.length);
  invoices.forEach(i => console.log(`- _id: ${i._id}, id: ${i.id}, invNum: ${i.invoiceNumber}, status: ${i.status}`));
  
  const payments = await db.collection("payments").find({
    $or: [
      { invoiceId: id },
      { invoiceId: "INV-0013" },
      { reference: "INV-0013" }
    ]
  }).toArray();
  console.log("Payments found:", payments.length);
  payments.forEach(p => console.log(`- _id: ${p._id}, status: ${p.status}, tx: ${p.transactionHash}`));
  
  await client.close();
}
run();
