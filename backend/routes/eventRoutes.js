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
    const events = await Event.find().sort({ date: -1 });
    res.json(events);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération des événements' });
  }
});

router.post('/', authenticateTokenMiddleware, async (req, res) => {
  try {
    const Event = (await import('../models/Event.js')).default;
    const event = new Event(req.body);
    await event.save();
    res.status(201).json(event);
  } catch (error) {
    res.status(400).json({ message: 'Erreur lors de la création de l\'événement' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const Event = (await import('../models/Event.js')).default;
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Événement non trouvé' });
    }
    res.json(event);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération de l\'événement' });
  }
});

router.put('/:id', authenticateTokenMiddleware, async (req, res) => {
  try {
    const Event = (await import('../models/Event.js')).default;
    const event = await Event.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!event) {
      return res.status(404).json({ message: 'Événement non trouvé' });
    }
    res.json(event);
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