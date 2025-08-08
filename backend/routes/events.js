const express = require('express');
const { body, validationResult } = require('express-validator');
const { MongoClient, ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken');

// Middleware d'authentification JWT
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return res.status(401).json({ 
      success: false,
      message: 'Token manquant' 
    });
  }
  
  const token = authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ 
      success: false,
      message: 'Format de token invalide' 
    });
  }
  
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      let errorMessage = 'Token invalide';
      if (err.name === 'TokenExpiredError') {
        errorMessage = 'Token expiré';
      } else if (err.name === 'JsonWebTokenError') {
        errorMessage = 'Token malformé';
      }
      
      return res.status(401).json({ 
        success: false,
        message: errorMessage, 
        details: err.message,
        code: err.name 
      });
    }
    
    req.user = user;
    next();
  });
};

const router = express.Router();

// Helper function to get database connection
const getDatabaseConnection = () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI environment variable is not set');
  }
  const dbName = uri.split('/').pop();
  return { uri, dbName };
};

const connectToDatabase = async () => {
  const { uri, dbName } = getDatabaseConnection();
  const client = new MongoClient(uri);
  await client.connect();
  return { client, db: client.db(dbName) };
};

// Validation pour la création/modification d'événement
const validateevents = [
  body('name').trim().isLength({ min: 1 }).withMessage('Le nom est requis'),
  body('date').isISO8601().withMessage('Date invalide'),
  body('photographerEmail').isEmail().withMessage('Email photographe invalide')
];

// Routes pour les événements
router.get('/', async (req, res) => {
  try {
    const Event = require('../models/Event');
    const events = await Event.find().sort({ createdAt: -1 });
    res.json({
      success: true,
      events
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des événements'
    });
  }
});

// Obtenir un événement par ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    let events = await client.db(dbName).collection('events').findOne({ _id: new ObjectId(id) });

    if (!events) {
      return res.status(404).json({ error: 'Événement non trouvé' });
    }

    // Adapter les champs pour le frontend
    events = {
      ...events,
      id: events._id,
      cover_image_url: events.coverImageUrl,
      photographer_email: events.photographerEmail,
      status: events.status ? events.status.toLowerCase() : 'upcoming'
    };

    res.json(events);

  } catch (error) {
    console.error('Erreur lors de la récupération de l\'événement:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération de l\'événement' });
  }
});

// Créer un nouvel événement (admin seulement)
router.post('/', authenticateToken, validateevents, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, description, date, location, photographerEmail, coverImageUrl, status } = req.body;

    // Par défaut, status = 'upcoming' si non fourni
    const eventsStatus = status ? status.toLowerCase() : 'upcoming';

    const eventsInsert = await client.db(dbName).collection('events').insertOne({
      name,
      description,
      date: new Date(date),
      location,
      photographerEmail,
      coverImageUrl,
      status: eventsStatus,
      createdAt: new Date()
    });

    let createdevents = await client.db(dbName).collection('events').findOne({ _id: eventsInsert.insertedId });

    // Adapter les champs pour le frontend
    createdevents = {
      ...createdevents,
      id: createdevents._id,
      cover_image_url: createdevents.coverImageUrl,
      photographer_email: createdevents.photographerEmail
    };

    res.status(201).json({
      message: 'Événement créé avec succès',
      events: createdevents
    });

  } catch (error) {
    console.error('Erreur lors de la création de l\'événement:', error);
    res.status(500).json({ error: 'Erreur lors de la création de l\'événement' });
  }
});

// Modifier un événement (admin seulement)
router.put('/:id', authenticateToken, validateevents, async (req, res) => {
  try {
    // Vérifier si l'utilisateur est admin
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Accès refusé' });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    // Remove _id from the update data
    const { _id, ...updateData } = req.body;

    // Vérifier si l'événement existe
    const existingevents = await client.db(dbName).collection('events').findOne({ _id: new ObjectId(id) });

    if (!existingevents) {
      return res.status(404).json({ error: 'Événement non trouvé' });
    }

    // Vérifier si le photographe existe (si modifié)
    if (updateData.photographerEmail && updateData.photographerEmail !== existingevents.photographerEmail) {
      const photographer = await client.db(dbName).collection('users').findOne({ email: updateData.photographerEmail });
      if (!photographer) {
        return res.status(400).json({ error: 'Photographe non trouvé' });
      }
    }

    const updateFields = {
      ...updateData,
      date: updateData.date ? new Date(updateData.date) : existingevents.date,
      updatedAt: new Date()
    };
    if (typeof updateData.coverImageUrl !== 'undefined') updateFields.coverImageUrl = updateData.coverImageUrl;
    if (typeof updateData.status !== 'undefined') updateFields.status = updateData.status.toLowerCase();

    const events = await client.db(dbName).collection('events').findOneAndUpdate(
      { _id: new ObjectId(id) },
      {
        $set: updateFields
      },
      { returnDocument: 'after' }
    );

    res.json({
      message: 'Événement modifié avec succès',
      events: events.value ? {
        ...events.value,
        id: events.value._id,
        cover_image_url: events.value.coverImageUrl,
        photographer_email: events.value.photographerEmail,
        status: events.value.status ? events.value.status.toLowerCase() : 'upcoming'
      } : null
    });

  } catch (error) {
    console.error('Erreur lors de la modification de l\'événement:', error);
    res.status(500).json({ error: 'Erreur lors de la modification de l\'événement' });
  }
});

// Supprimer un événement (admin seulement)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    // Vérifier si l'utilisateur est admin
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Accès refusé' });
    }

    const { id } = req.params;

    // Vérifier si l'événement existe
    const existingevents = await client.db(dbName).collection('events').findOne({ _id: new ObjectId(id) });

    if (!existingevents) {
      return res.status(404).json({ error: 'Événement non trouvé' });
    }

    await client.db(dbName).collection('events').deleteOne({ _id: new ObjectId(id) });

    res.json({ message: 'Événement supprimé avec succès' });

  } catch (error) {
    console.error('Erreur lors de la suppression de l\'événement:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression de l\'événement' });
  }
});

module.exports = router; 