const { MongoClient } = require('mongodb');
const FaceRecognitionService = require('./services/faceRecognitionService');
const faceService = new FaceRecognitionService();

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/photoevents';
const dbName = uri.split('/').pop() || 'photoevents';

function generateFakeEncoding() {
  return Array.from({ length: 128 }, () => Math.random() * 2 - 1);
}

async function fixFaceEncodings() {
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db(dbName);
  const photos = db.collection('photos');
  const allPhotos = await photos.find({}).toArray();
  let updated = 0;
  const dryRun = process.env.DRY_RUN === 'true';
  for (const photo of allPhotos) {
    // Migration : si faceEncoding existe et face_encodings absent ou vide, on migre
    if (photo.faceEncoding && (!photo.face_encodings || !Array.isArray(photo.face_encodings) || photo.face_encodings.length === 0)) {
      if (!dryRun) {
        await photos.updateOne(
          { _id: photo._id },
          { $set: { face_encodings: [photo.faceEncoding] } }
        );
      }
      console.log(`[MIGRATION] faceEncoding -> face_encodings pour la photo ${photo._id}`);
      updated++;
      continue;
    }
    // Ajout encodage réel si aucun encodage
    if ((!photo.face_encodings || !Array.isArray(photo.face_encodings) || photo.face_encodings.length === 0) && (!photo.faceEncoding || photo.faceEncoding.length === 0)) {
      // Appel réel au pipeline d'encodage
      let encodingResult = null;
      try {
        encodingResult = await faceService.processUploadedImage(photo.path);
      } catch (err) {
        console.error(`[ERREUR] Encodage facial échoué pour la photo ${photo._id}:`, err);
      }
      if (encodingResult && encodingResult.success && Array.isArray(encodingResult.faceEncoding) && encodingResult.faceEncoding.length > 0) {
        if (!dryRun) {
          await photos.updateOne(
            { _id: photo._id },
            { $set: { face_encodings: [encodingResult.faceEncoding], faceEncoding: encodingResult.faceEncoding, faceModel: encodingResult.model, facesDetected: encodingResult.facesDetected } }
          );
        }
        console.log(`[ENCODAGE] Ajout encodage réel à la photo ${photo._id}`);
        updated++;
      } else {
        console.warn(`[WARN] Aucun visage détecté pour la photo ${photo._id}, aucun encodage ajouté.`);
      }
    }
  }
  console.log(`Terminé. ${updated} photos mises à jour. Mode dry-run: ${dryRun}`);
  await client.close();
}

fixFaceEncodings(); 