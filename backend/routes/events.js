const express = require('express');
const { body, validationResult } = require('express-validator');
const { MongoClient, ObjectId } = require('mongodb');
const { authenticateToken } = require('./auth');

const router = express.Router();
const uri = process.env.DATABASE_URL;
const client = new MongoClient(uri);
const dbName = uri.split('/').pop();

// Validation pour la création/modification d'événement
const validateevents = [
  body('name').trim().isLength({ min: 1 }).withMessage('Le nom est requis'),
  body('date').isISO8601().withMessage('Date invalide'),
  body('photographerEmail').isEmail().withMessage('Email photographe invalide')
];

// Obtenir tous les événements
router.get('/', async (req, res) => {
  try {
    const { status, search } = req.query;
    
    let where = {};
    
    if (status) {
      where.status = status.toLowerCase();
    }
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { location: { contains: search, mode: 'insensitive' } }
      ];
    }

    let eventss = await client.db(dbName).collection('events').find(where).toArray();

    // Adapter les champs pour le frontend
    eventss = eventss.map(events => ({
      ...events,
      id: events._id,
      cover_image_url: events.coverImageUrl,
      photographer_email: events.photographerEmail,
      status: events.status ? events.status.toLowerCase() : 'upcoming'
    }));

    res.json(eventss);

  } catch (error) {
    console.error('Erreur lors de la récupération des événements:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des événements' });
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
    const { name, description, date, location, photographerEmail, coverImageUrl, status } = req.body;

    // Vérifier si l'événement existe
    const existingevents = await client.db(dbName).collection('events').findOne({ _id: new ObjectId(id) });

    if (!existingevents) {
      return res.status(404).json({ error: 'Événement non trouvé' });
    }

    // Vérifier si le photographe existe (si modifié)
    if (photographerEmail && photographerEmail !== existingevents.photographerEmail) {
      const photographer = await client.db(dbName).collection('users').findOne({ email: photographerEmail });

      if (!photographer) {
        return res.status(400).json({ error: 'Photographe non trouvé' });
      }
    }

    const updateFields = {
      name,
      description,
      date: date ? new Date(date) : existingevents.date,
      location,
      photographerEmail,
      updatedAt: new Date()
    };
    if (typeof coverImageUrl !== 'undefined') updateFields.coverImageUrl = coverImageUrl;
    if (typeof status !== 'undefined') updateFields.status = status.toLowerCase();

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