const { MongoClient } = require('mongodb');

const uri = process.env.DATABASE_URL || 'mongodb://localhost:27017/photoevents';
const dbName = uri.split('/').pop() || 'photoevents';

async function activateAlleventss() {
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db(dbName);
  const eventss = db.collection('eventss');
  const res = await eventss.updateMany({}, { $set: { status: 'ACTIVE' } });
  console.log(`✅ ${res.modifiedCount} événements mis à jour en ACTIVE`);
  await client.close();
}

activateAlleventss(); 