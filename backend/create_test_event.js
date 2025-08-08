// backend/create_test_event.js
const { MongoClient } = require('mongodb');
require('dotenv').config();

async function main() {
  const uri = process.env.DATABASE_URL;
  const client = new MongoClient(uri);
  const dbName = uri.split('/').pop();
  await client.connect();
  const db = client.db(dbName);
  const eventss = db.collection('eventss');

  const event = {
    name: 'Test Event',
    description: 'Événement de test pour upload',
    date: new Date(),
    location: 'Test City',
    photographerEmail: 'test@photoevents.com',
    coverImageUrl: '',
    status: 'ACTIVE',
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const result = await eventss.insertOne(event);
  console.log('Événement de test créé avec l\'ID :', result.insertedId.toString());
  await client.close();
}

main().catch(console.error); 