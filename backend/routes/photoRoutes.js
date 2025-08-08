const express = require('express');
const router = express.Router();
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

// Routes pour les photos
router.get('/', authenticateToken, async (req, res) => {
  try {
    const Photo = require('../models/Photo');
    const photos = await Photo.find().populate('userId', 'name email');
    res.json({
      success: true,
      photos
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des photos'
    });
  }
});

module.exports = router; 