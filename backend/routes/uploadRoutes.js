import express from 'express';
import { upload, UploadController } from '../controllers/uploadController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
import roleMiddleware from '../middleware/roleMiddleware.js';

const router = express.Router();
const uploadController = new UploadController();

// Initialiser le contrôleur
uploadController.initialize();

/**
 * @route POST /api/upload/photo
 * @desc Upload d'une photo avec reconnaissance faciale
 * @access Private
 */
router.post('/photo', 
  authenticateToken,
  upload.single('photo'),
  uploadController.uploadPhoto
);

/**
 * @route POST /api/upload/search
 * @desc Recherche par selfie
 * @access Private
 */
router.post('/search',
  authenticateToken,
  upload.single('selfie'),
  uploadController.searchBySelfie
);

/**
 * @route POST /api/upload/search-by-selfie
 * @desc Recherche par selfie (alias pour compatibilité)
 * @access Private
 */
router.post('/search-by-selfie',
  authenticateToken,
  upload.single('photo'),
  uploadController.searchBySelfie
);

/**
 * @route GET /api/upload/stats
 * @desc Statistiques d'upload
 * @access Admin
 */
router.get('/stats',
  authenticateToken,
  roleMiddleware(['ADMIN']),
  uploadController.getStats
);

export default router; 