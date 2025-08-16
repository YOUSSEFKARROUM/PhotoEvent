import express from 'express';
import jwt from 'jsonwebtoken';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// Middleware pour vérifier le token JWT
const authenticateTokenMiddleware = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Token manquant' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Token invalide' });
    }
    req.user = user;
    next();
  });
};

// Routes pour les événements
router.get('/', async (req, res) => {
  try {
    const Event = (await import('../models/Event.js')).default;
    const events = await Event.find().sort({ date: -1 }).lean();
    // Map backend fields to frontend expectations
    const mapped = events.map(ev => ({
      id: ev._id,
      _id: ev._id,
      name: ev.title, // frontend expects name
      description: ev.description,
      date: ev.date,
      location: ev.location,
      cover_image_url: ev.coverImageUrl || ev.cover_image_url || '',
      photographer_email: ev.photographerEmail || ev.photographer_email || '',
      status: ev.status || 'upcoming'
    }));
    res.json(mapped);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération des événements' });
  }
});

router.post('/', authenticateTokenMiddleware, async (req, res) => {
  try {
    const Event = (await import('../models/Event.js')).default;
    // Accept both name/title, coverImageUrl/cover_image_url, photographerEmail/photographer_email
    const payload = {
      title: req.body.name || req.body.title,
      description: req.body.description,
      date: req.body.date,
      location: req.body.location,
      photographerEmail: req.body.photographerEmail || req.body.photographer_email,
      coverImageUrl: req.body.coverImageUrl || req.body.cover_image_url,
      status: req.body.status || 'upcoming'
    };
    const event = new Event(payload);
    await event.save();
    res.status(201).json({
      id: event._id,
      _id: event._id,
      name: event.title,
      description: event.description,
      date: event.date,
      location: event.location,
      cover_image_url: event.coverImageUrl,
      photographer_email: event.photographerEmail,
      status: event.status
    });
  } catch (error) {
    res.status(400).json({ message: 'Erreur lors de la création de l\'événement' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const Event = (await import('../models/Event.js')).default;
    const ev = await Event.findById(req.params.id).lean();
    if (!ev) {
      return res.status(404).json({ message: 'Événement non trouvé' });
    }
    res.json({
      id: ev._id,
      _id: ev._id,
      name: ev.title,
      description: ev.description,
      date: ev.date,
      location: ev.location,
      cover_image_url: ev.coverImageUrl,
      photographer_email: ev.photographerEmail,
      status: ev.status
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération de l\'événement' });
  }
});

router.put('/:id', authenticateTokenMiddleware, async (req, res) => {
  try {
    const Event = (await import('../models/Event.js')).default;
    const updates = {
      ...(req.body.name ? { title: req.body.name } : {}),
      ...(req.body.title ? { title: req.body.title } : {}),
      ...(req.body.description ? { description: req.body.description } : {}),
      ...(req.body.date ? { date: req.body.date } : {}),
      ...(req.body.location ? { location: req.body.location } : {}),
      ...(req.body.photographerEmail || req.body.photographer_email ? { photographerEmail: req.body.photographerEmail || req.body.photographer_email } : {}),
      ...(req.body.coverImageUrl || req.body.cover_image_url ? { coverImageUrl: req.body.coverImageUrl || req.body.cover_image_url } : {}),
      ...(req.body.status ? { status: req.body.status } : {}),
    };
    const ev = await Event.findByIdAndUpdate(req.params.id, updates, { new: true }).lean();
    if (!ev) {
      return res.status(404).json({ message: 'Événement non trouvé' });
    }
    res.json({
      id: ev._id,
      _id: ev._id,
      name: ev.title,
      description: ev.description,
      date: ev.date,
      location: ev.location,
      cover_image_url: ev.coverImageUrl,
      photographer_email: ev.photographerEmail,
      status: ev.status
    });
  } catch (error) {
    res.status(400).json({ message: 'Erreur lors de la mise à jour de l\'événement' });
  }
});

router.delete('/:id', authenticateTokenMiddleware, async (req, res) => {
  try {
    const Event = (await import('../models/Event.js')).default;
    const event = await Event.findByIdAndDelete(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Événement non trouvé' });
    }
    res.json({ message: 'Événement supprimé' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la suppression de l\'événement' });
  }
});

export default router; 