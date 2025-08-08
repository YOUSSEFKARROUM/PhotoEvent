const express = require('express');
const router = express.Router();
const { upload, uploadPhoto, searchBySelfie, getStats } = require('../controllers/uploadController');

// Upload d'une photo
router.post('/photo', upload, uploadPhoto);

// Recherche par selfie
router.post('/search', upload, searchBySelfie);

// Statistiques
router.get('/stats', getStats);

module.exports = router; 