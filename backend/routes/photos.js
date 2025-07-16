const express = require('express');
const { body, validationResult } = require('express-validator');
const { MongoClient, ObjectId } = require('mongodb');
const { authenticateToken } = require('./auth');

const router = express.Router();
const uri = process.env.DATABASE_URL;
const client = new MongoClient(uri);
const dbName = uri.split('/').pop();

// Middleware de validation
const validatePhoto = [
  body('eventsId').isMongoId(),
  body('url').isURL(),
  body('description').optional().trim().isLength({ max: 500 })
];

// Obtenir toutes les photos (avec filtres optionnels)
router.get('/', async (req, res) => {
  try {
    const { eventsId, userId, limit = 20, offset = 0 } = req.query;

    const where = {};
    if (eventsId) where.eventsId = eventsId;
    if (userId) where.userId = userId;

    const photos = await client.db(dbName).collection('photos').find(where).toArray();

    res.json(photos);

  } catch (error) {
    console.error('Erreur lors de la récupération des photos:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des photos' });
  }
});

// Obtenir une photo par ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const photo = await client.db(dbName).collection('photos').findOne({ _id: new ObjectId(id) });

    if (!photo) {
      return res.status(404).json({ error: 'Photo non trouvée' });
    }

    res.json(photo);

  } catch (error) {
    console.error('Erreur lors de la récupération de la photo:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération de la photo' });
  }
});

// Créer une nouvelle photo (utilisateur connecté)
router.post('/', authenticateToken, validatePhoto, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { eventsId, url, description } = req.body;
    const userId = req.user.userId;

    // Vérifier si l'événement existe
    const events = await client.db(dbName).collection('eventss').findOne({ _id: new ObjectId(eventsId) });

    if (!events) {
      return res.status(404).json({ error: 'Événement non trouvé' });
    }

    // Vérifier si l'événement est actif
    if (events.status !== 'ACTIVE') {
      return res.status(400).json({ error: 'Cet événement n\'accepte plus de photos' });
    }

    const photo = await client.db(dbName).collection('photos').insertOne({
      url,
      description,
      eventsId,
      userId,
      uploadedAt: new Date()
    });

    res.status(201).json({
      message: 'Photo uploadée avec succès',
      photo: photo.ops[0]
    });

  } catch (error) {
    console.error('Erreur lors de l\'upload de la photo:', error);
    res.status(500).json({ error: 'Erreur lors de l\'upload de la photo' });
  }
});

// Modifier une photo (propriétaire ou admin)
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { description } = req.body;

    // Vérifier si la photo existe
    const existingPhoto = await client.db(dbName).collection('photos').findOne({ _id: new ObjectId(id) });

    if (!existingPhoto) {
      return res.status(404).json({ error: 'Photo non trouvée' });
    }

    // Vérifier les permissions (propriétaire ou admin)
    if (existingPhoto.userId !== req.user.userId && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Accès refusé' });
    }

    const photo = await client.db(dbName).collection('photos').findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: { description } },
      { returnDocument: 'after' }
    );

    res.json({
      message: 'Photo modifiée avec succès',
      photo: photo.value
    });

  } catch (error) {
    console.error('Erreur lors de la modification de la photo:', error);
    res.status(500).json({ error: 'Erreur lors de la modification de la photo' });
  }
});

// Supprimer une photo (propriétaire ou admin)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Vérifier si la photo existe
    const existingPhoto = await client.db(dbName).collection('photos').findOne({ _id: new ObjectId(id) });

    if (!existingPhoto) {
      return res.status(404).json({ error: 'Photo non trouvée' });
    }

    // Vérifier les permissions (propriétaire ou admin)
    if (existingPhoto.userId !== req.user.userId && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Accès refusé' });
    }

    await client.db(dbName).collection('photos').deleteOne({ _id: new ObjectId(id) });

    res.json({ message: 'Photo supprimée avec succès' });

  } catch (error) {
    console.error('Erreur lors de la suppression de la photo:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression de la photo' });
  }
});

module.exports = router; 