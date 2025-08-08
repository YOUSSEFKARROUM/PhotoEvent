import express from 'express';
import authController from '../controllers/authController.js';
import roleMiddleware from '../middleware/roleMiddleware.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// Routes publiques
router.post('/register', authController.register);
router.post('/login', authController.login);

// Routes protégées
router.get('/me', authenticateToken, authController.getCurrentUser);
router.post('/logout', authenticateToken, authController.logout);

// Routes admin
router.get('/users', authenticateToken, roleMiddleware(['ADMIN']), async (req, res) => {
  try {
    const User = (await import('../models/User.js')).default;
    const users = await User.find({ deletedAt: null }).select('-password');
    res.json({
      success: true,
      users
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des utilisateurs'
    });
  }
});

export default router; 