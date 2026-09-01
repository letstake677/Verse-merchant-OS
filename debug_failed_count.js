import { MongoClient } from "mongodb";
async function run() {
  const client = new MongoClient(process.env.MONGODB_URI || "mongodb+srv://vercel-admin-user:jL7L79W8tPzZ8Wc2@cluster0.eov9d.mongodb.net/test?retryWrites=true&w=majority");
  await client.connect();
  const db = client.db();
  
  const failed = await db.collection("payments").countDocuments({ status: "failed" });
  console.log("Remaining failed payments in DB:", failed);
  
  await client.close();
}
run();
