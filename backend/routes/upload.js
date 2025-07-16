const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const { v4: uuidv4 } = require('uuid');
const { MongoClient, ObjectId } = require('mongodb');
const { authenticateToken } = require('./auth');
const path = require('path');
const fs = require('fs');

const router = express.Router();

const uri = process.env.DATABASE_URL;
const client = new MongoClient(uri);
const dbName = uri.split('/').pop();

// Configuration de multer pour l'upload temporaire
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max
  },
  fileFilter: (req, file, cb) => {
    // Vérifier le type de fichier
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Seuls les fichiers image sont autorisés'), false);
    }
  }
});

// Ajoute ce middleware avant chaque upload :
function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Accès réservé à l\'administrateur' });
  }
  next();
}

// Upload d'une photo
router.post('/photo', authenticateToken, upload.single('photo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Aucun fichier fourni' });
    }

    const { eventsId, description } = req.body;
    const userId = req.user.userId;

    await client.connect();
    const db = client.db(dbName);
    const eventss = db.collection('eventss');
    const photos = db.collection('photos');

    // Vérifier si l'événement existe
    const events = await eventss.findOne({ _id: new ObjectId(eventsId) });
    if (!events) {
      return res.status(404).json({ error: 'Événement non trouvé' });
    }

    // Vérifier si l'événement est actif
    if (events.status !== 'ACTIVE') {
      return res.status(400).json({ error: 'Cet événement n\'accepte plus de photos' });
    }

    // Traitement de l'image avec Sharp
    const processedImageBuffer = await sharp(req.file.buffer)
      .resize(1920, 1080, { 
        fit: 'inside', 
        withoutEnlargement: true 
      })
      .jpeg({ quality: 85 })
      .toBuffer();

    // Générer un nom de fichier unique
    const fileName = `${uuidv4()}.jpg`;
    // Ici, vous pouvez intégrer avec Cloudinary ou un autre service de stockage
    // Pour l'instant, on simule l'upload avec une URL fictive
    const imageUrl = `/uploads/photos/${fileName}`;

    // Sauvegarder la photo en base de données
    const photoDoc = {
      url: imageUrl,
      description: description || '',
      eventsId,
      userId,
      uploadedAt: new Date()
    };
    const result = await photos.insertOne(photoDoc);

    res.status(201).json({
      message: 'Photo uploadée avec succès',
      photo: {
        id: result.insertedId,
        ...photoDoc
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de l\'upload de la photo' });
  } finally {
    await client.close();
  }
});

// Upload multiple photos
router.post('/photos', authenticateToken, requireAdmin, upload.array('photos', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'Aucun fichier fourni' });
    }

    const { eventsId } = req.body;
    const userId = req.user.userId;

    await client.connect();
    const db = client.db(dbName);
    const eventss = db.collection('eventss');
    const photos = db.collection('photos');

    // Vérifier si l'événement existe
    const events = await eventss.findOne({ _id: new ObjectId(eventsId) });
    if (!events) {
      return res.status(404).json({ error: 'Événement non trouvé' });
    }

    // Vérifier si l'événement est actif
    if (events.status !== 'ACTIVE') {
      return res.status(400).json({ error: 'Cet événement n\'accepte plus de photos' });
    }

    const uploadedPhotos = [];
    for (const file of req.files) {
      try {
        // Traitement de l'image avec Sharp
        const processedImageBuffer = await sharp(file.buffer)
          .resize(1920, 1080, { 
            fit: 'inside', 
            withoutEnlargement: true 
          })
          .jpeg({ quality: 85 })
          .toBuffer();

        // Générer un nom de fichier unique
        const fileName = `${uuidv4()}.jpg`;
        // Ici, vous pouvez intégrer avec Cloudinary ou un autre service de stockage
        const imageUrl = `/uploads/photos/${fileName}`;

        // Sauvegarder la photo en base de données
        const photoDoc = {
          url: imageUrl,
          description: '',
          eventsId,
          userId,
          uploadedAt: new Date()
        };
        const result = await photos.insertOne(photoDoc);
        uploadedPhotos.push({ id: result.insertedId, ...photoDoc });
      } catch (fileError) {
        console.error('Erreur lors du traitement d\'un fichier:', fileError);
        // Continuer avec les autres fichiers
      }
    }

    res.status(201).json({
      message: `${uploadedPhotos.length} photos uploadées avec succès`,
      photos: uploadedPhotos
    });
  } catch (error) {
    console.error('Erreur lors de l\'upload multiple de photos:', error);
    res.status(500).json({ error: 'Erreur lors de l\'upload des photos' });
  } finally {
    await client.close();
  }
});

// Upload direct d'une image avec nom UUID fourni (pour l'admin ou debug)
const uploadDirect = multer({ dest: path.join(__dirname, '../uploads/photos') });
router.post('/upload', authenticateToken, requireAdmin, uploadDirect.single('file'), (req, res) => {
  const uuid = req.body.uuid;
  if (!uuid || !req.file) {
    return res.status(400).send('UUID et fichier requis');
  }
  const destPath = path.join(req.file.destination, uuid);
  fs.rename(req.file.path, destPath, (err) => {
    if (err) return res.status(500).send('Erreur lors du renommage');
    res.send('Image uploadée et renommée avec succès !');
  });
});

// Expose le dossier uploads/photos en statique
router.use('/uploads/photos', express.static(path.join(__dirname, '../uploads/photos')));

// Gestion des erreurs multer
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'Fichier trop volumineux (max 10MB)' });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ error: 'Trop de fichiers (max 10)' });
    }
  }
  next(error);
});

module.exports = router; 