import { MongoClient, ObjectId } from "mongodb";
async function run() {
  const client = new MongoClient(process.env.MONGODB_URI || "mongodb+srv://vercel-admin-user:jL7L79W8tPzZ8Wc2@cluster0.eov9d.mongodb.net/test?retryWrites=true&w=majority");
  await client.connect();
  const db = client.db();
  
  // Find recent payments globally to see if a payment was created recently (within last hour)
  const payments = await db.collection("payments").find().sort({ _id: -1 }).limit(10).toArray();
  console.log("Recent Payments:");
  payments.forEach(p => console.log(`- _id: ${p._id}, invoiceId: ${p.invoiceId}, status: ${p.status}, tx: ${p.transactionHash}, createdAt: ${p.createdAt}`));
  
  await client.close();
}
run();
