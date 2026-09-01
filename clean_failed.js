import { MongoClient, ObjectId } from "mongodb";
async function run() {
  const client = new MongoClient(process.env.MONGODB_URI || "mongodb+srv://vercel-admin-user:jL7L79W8tPzZ8Wc2@cluster0.eov9d.mongodb.net/test?retryWrites=true&w=majority");
  await client.connect();
  const db = client.db();
  
  const payments = await db.collection("payments").find({ status: "failed" }).toArray();
  for (const p of payments) {
    const inv = await db.collection("invoices").findOne({ 
      $or: [ { _id: new ObjectId(p.invoiceId) }, { id: p.invoiceId }, { invoiceNumber: p.invoiceId } ] 
    });
    
    if (inv && (inv.status === "paid" || inv.status === "cancelled" || inv.status === "void")) {
      await db.collection("payments").updateOne({ _id: p._id }, { $set: { status: "cancelled", updatedAt: new Date() }});
      console.log(`Updated failed payment ${p._id} to cancelled because invoice is ${inv.status}`);
    }
  }
  
  await client.close();
}
run();
