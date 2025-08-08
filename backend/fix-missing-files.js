const fs = require('fs');
const path = require('path');
const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config();

const fixMissingFiles = async () => {
  const uri = process.env.MONGODB_URI;
  const client = new MongoClient(uri);
  const dbName = uri.split('/').pop();
  await client.connect();
  const db = client.db(dbName);
  const uploadsDir = path.join(__dirname, 'uploads', 'photos');

  // Vérifiez que le dossier existe
  if (!fs.existsSync(uploadsDir)) {
    console.log('Création du dossier uploads/photos...');
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  // Récupérez toutes les photos de la DB
  const photos = await db.collection('photos').find({}).toArray();
  const missingFiles = [];
  const existingFiles = [];

  console.log(`Vérification de ${photos.length} photos...`);

  for (const photo of photos) {
    const filename = photo.filename || photo.url;
    if (!filename) continue;
    const filePath = path.join(uploadsDir, filename);
    if (!fs.existsSync(filePath)) {
      missingFiles.push({
        id: photo._id,
        filename: filename,
        eventId: photo.eventId || photo.eventsId
      });
    } else {
      existingFiles.push(filename);
    }
  }

  console.log(`Fichiers existants: ${existingFiles.length}`);
  console.log(`Fichiers manquants: ${missingFiles.length}`);

  // Supprimez les références aux fichiers manquants de la DB
  if (missingFiles.length > 0) {
    console.log('Suppression des références aux fichiers manquants...');
    const missingIds = missingFiles.map(f => (typeof f.id === 'string' ? new ObjectId(f.id) : f.id));
    const result = await db.collection('photos').deleteMany({
      _id: { $in: missingIds }
    });
    console.log(`${result.deletedCount} références supprimées de la base de données`);
  }

  await client.close();
  return { existingFiles: existingFiles.length, removedReferences: missingFiles.length };
};

fixMissingFiles().then(result => {
  console.log('Nettoyage terminé:', result);
}).catch(err => {
  console.error('Erreur lors du nettoyage:', err);
}); 