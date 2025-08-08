const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/photoevents';
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

async function fixCoverImageUrls() {
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db(dbName);
  const eventss = db.collection('eventss');
  const events = await eventss.find({}).toArray();

  for (const event of events) {
    if (event.coverImageUrl && !event.coverImageUrl.startsWith('/uploads/')) {
      const newPath = `/uploads/photos/${event.coverImageUrl}`;
      await eventss.updateOne({ _id: event._id }, { $set: { coverImageUrl: newPath } });
      console.log(`Fixed event ${event.name}: ${event.coverImageUrl} -> ${newPath}`);
    }
  }

  // Check if the referenced file exists
  for (const event of await eventss.find({}).toArray()) {
    if (event.coverImageUrl) {
      const filePath = path.join(__dirname, 'uploads', 'photos', path.basename(event.coverImageUrl));
      if (!fs.existsSync(filePath)) {
        console.log(`Missing file for event ${event.name}: ${filePath}`);
      }
    }
  }

  await client.close();
}

// Run the migration
fixCoverImageUrls().then(() => console.log('Cover image URL fix complete.'));

activateAlleventss(); 