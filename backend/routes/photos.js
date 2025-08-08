import express from 'express';
import { body, validationResult } from 'express-validator';
import { MongoClient, ObjectId } from 'mongodb';
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

// Routes pour les photos
router.get('/', async (req, res) => {
  try {
    const Photo = (await import('../models/Photo.js')).default;
    const photos = await Photo.find().sort({ uploadDate: -1 });
    res.json(photos);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération des photos' });
  }
});

router.get('/event/:eventId', async (req, res) => {
  try {
    const Photo = (await import('../models/Photo.js')).default;
    const photos = await Photo.find({ eventId: req.params.eventId }).sort({ uploadDate: -1 });
    res.json(photos);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération des photos de l\'événement' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const Photo = (await import('../models/Photo.js')).default;
    const photo = await Photo.findById(req.params.id);
    if (!photo) {
      return res.status(404).json({ message: 'Photo non trouvée' });
    }
    res.json(photo);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération de la photo' });
  }
});

router.delete('/:id', authenticateTokenMiddleware, async (req, res) => {
  try {
    const Photo = (await import('../models/Photo.js')).default;
    const fs = await import('fs');
    const path = await import('path');
    const { MongoClient } = await import('mongodb');
    
    const photo = await Photo.findById(req.params.id);
    if (!photo) {
      return res.status(404).json({ message: 'Photo non trouvée' });
    }

    // Supprimer le fichier physique
    if (photo.path && fs.existsSync(photo.path)) {
      fs.unlinkSync(photo.path);
    }

    await Photo.findByIdAndDelete(req.params.id);
    res.json({ message: 'Photo supprimée' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la suppression de la photo' });
  }
});

export default router; 