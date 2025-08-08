const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/photoevents';
const dbName = uri.split('/').pop() || 'photoevents';

async function listPhotoUrls() {
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db(dbName);
  const photos = db.collection('photos');
  const all = await photos.find({}).toArray();
  all.forEach(photo => {
    console.log(photo.url);
  });
  await client.close();
}

listPhotoUrls(); 