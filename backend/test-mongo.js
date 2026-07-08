const { MongoClient } = require('mongodb');
const uri = "mongodb://avinash:anitha@ac-wzn5guz-shard-00-00.gznlyfi.mongodb.net:27017,ac-wzn5guz-shard-00-01.gznlyfi.mongodb.net:27017,ac-wzn5guz-shard-00-02.gznlyfi.mongodb.net:27017/platform-blueprint?ssl=true&replicaSet=atlas-wzn5guz-shard-0&authSource=admin&retryWrites=true&w=majority";

async function run() {
  console.log("Testing SRV without family specified...");
  try {
    const client = new MongoClient(uri, { serverSelectionTimeoutMS: 5000, family: 4 });
    await client.connect();
    console.log("✅ SRV Connected successfully!");
    await client.close();
    return;
  } catch (e) {
    console.error("❌ SRV Failed:", e.message);
  }
}
run();
