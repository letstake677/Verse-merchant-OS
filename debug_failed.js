import { MongoClient, ObjectId } from "mongodb";
async function run() {
  const client = new MongoClient(process.env.MONGODB_URI || "mongodb+srv://vercel-admin-user:jL7L79W8tPzZ8Wc2@cluster0.eov9d.mongodb.net/test?retryWrites=true&w=majority");
  await client.connect();
  const db = client.db();
  
  const payments = await db.collection("payments").find({ status: "failed" }).toArray();
  console.log("Failed Payments:", payments.length);
  for (const p of payments) {
    const inv = await db.collection("invoices").findOne({ 
      $or: [ { _id: new ObjectId(p.invoiceId) }, { id: p.invoiceId }, { invoiceNumber: p.invoiceId } ] 
    });
    console.log(`- payment: ${p._id}, invoice: ${p.invoiceId}, inv_status: ${inv ? inv.status : 'not found'}`);
  }
  
  await client.close();
}
run();
