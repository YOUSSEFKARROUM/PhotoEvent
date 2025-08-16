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

// Routes pour les utilisateurs
router.get('/', authenticateTokenMiddleware, async (req, res) => {
  try {
    const User = (await import('../models/User.js')).default;
    const users = await User.find({ deletedAt: null }).select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération des utilisateurs' });
  }
});

// Route pour récupérer le profil de l'utilisateur connecté
router.get('/me', authenticateTokenMiddleware, async (req, res) => {
  try {
    const User = (await import('../models/User.js')).default;
    const user = await User.findById(req.user.userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }
    res.json({ user });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération du profil' });
  }
});

// Route pour mettre à jour le profil de l'utilisateur connecté
router.put('/me', authenticateTokenMiddleware, async (req, res) => {
  try {
    const User = (await import('../models/User.js')).default;
    const { consentFacialRecognition, consentFacialRecognitionDate, ...otherFields } = req.body;
    
    const updateFields = {};
    if (typeof consentFacialRecognition !== 'undefined') {
      updateFields.consentFacialRecognition = consentFacialRecognition;
    }
    if (consentFacialRecognitionDate) {
      updateFields.consentFacialRecognitionDate = new Date(consentFacialRecognitionDate);
    }
    if (Object.keys(otherFields).length > 0) {
      Object.assign(updateFields, otherFields);
    }
    updateFields.updatedAt = new Date();

    const user = await User.findByIdAndUpdate(
      req.user.userId,
      { $set: updateFields },
      { new: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }
    
    res.json({
      message: 'Profil utilisateur modifié avec succès',
      user
    });
  } catch (error) {
    console.error('Erreur dans PUT /api/users/me:', error);
    res.status(400).json({ message: 'Erreur lors de la mise à jour de l\'utilisateur' });
  }
});

router.get('/:id', authenticateTokenMiddleware, async (req, res) => {
  try {
    const User = (await import('../models/User.js')).default;
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération de l\'utilisateur' });
  }
});

router.put('/:id', authenticateTokenMiddleware, async (req, res) => {
  try {
    const User = (await import('../models/User.js')).default;
    const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true }).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }
    res.json(user);
  } catch (error) {
    res.status(400).json({ message: 'Erreur lors de la mise à jour de l\'utilisateur' });
  }
});

router.delete('/:id', authenticateTokenMiddleware, async (req, res) => {
  try {
    const User = (await import('../models/User.js')).default;
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }
    res.json({ message: 'Utilisateur supprimé' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la suppression de l\'utilisateur' });
  }
});

export default router;
