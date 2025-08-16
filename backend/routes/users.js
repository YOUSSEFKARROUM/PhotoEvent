const express = require('express');
const bcrypt = require('bcryptjs');
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
const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);
const dbName = uri.split('/').pop();

const uploadDir = 'uploads/reference/';
if (!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir, { recursive: true });
}
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});
const uploadReference = multer({ storage: storage });

const referencePhotoStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads/reference-photos/';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueName = `ref-${req.user.userId}-${Date.now()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});
const uploadReferencePhoto = multer({
  storage: referencePhotoStorage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Seules les images sont acceptées'), false);
    }
  },
  limits: { fileSize: 5 * 1024 * 1024 }
});

async function generateFaceEncodingPython(imagePath) {
  return new Promise((resolve, reject) => {
    const python = spawn('python3', ['backend/scripts/deepface_encode.py', imagePath]);
    let result = '';
    let error = '';
    python.stdout.on('data', (data) => { result += data.toString(); });
    python.stderr.on('data', (data) => { error += data.toString(); });
    python.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Script Python failed: ${error}`));
        return;
      }
      try {
        const jsonResult = JSON.parse(result.trim());
        resolve(jsonResult);
      } catch (parseError) {
        reject(new Error(`Erreur parsing JSON: ${parseError.message}`));
      }
    });
    setTimeout(() => {
      python.kill();
      reject(new Error('Timeout lors de la génération de l\'encodage'));
    }, 30000);
  });
}

// Middleware de validation
const validateUserUpdate = [
  body('name').optional().trim().isLength({ min: 2 }),
  body('email').optional().isEmail().normalizeEmail(),
  body('role').optional().isIn(['USER', 'ADMIN', 'PHOTOGRAPHER'])
];

// Routes pour les utilisateurs
router.get('/', authenticateToken, async (req, res) => {
  try {
    const User = require('../models/User');
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

// Modifier son propre profil (utilisateur connecté)
router.put('/me', authenticateToken, async (req, res) => {
  console.log('--- [PUT /api/users/me] ---');
  console.log('Authorization header:', req.headers['authorization']);
  console.log('Body:', req.body);
  console.log('req.user:', req.user);
  try {
    console.log('userId utilisé pour la requête MongoDB:', req.user.userId);
    const { name, email, reference_face_data, consentFacialRecognition, consentFacialRecognitionDate } = req.body;
    await client.connect();
    const db = client.db(dbName);
    const usersCollection = db.collection('users');

    // Mise à jour sans aucun contrôle d'ID
    const updateFields = {};
    if (name) updateFields.name = name;
    if (email) updateFields.email = email;
    if (reference_face_data) updateFields.reference_face_data = reference_face_data;
    if (typeof consentFacialRecognition !== 'undefined') updateFields.consentFacialRecognition = consentFacialRecognition;
    if (consentFacialRecognitionDate) updateFields.consentFacialRecognitionDate = new Date(consentFacialRecognitionDate);
    updateFields.updatedAt = new Date();

    const user = await usersCollection.findOneAndUpdate(
      { _id: new ObjectId(req.user.userId) },
      { $set: updateFields },
      { returnDocument: 'after' }
    );
    console.log('Résultat de findOneAndUpdate:', user);
    if (!user.value) {
      console.warn('Aucun utilisateur trouvé pour cet ID');
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }
    res.json({
      message: 'Profil utilisateur modifié avec succès',
      user: user.value
    });
  } catch (error) {
    console.error('Erreur dans PUT /api/users/me:', error);
    res.status(500).json({ error: 'Erreur lors de la modification du profil utilisateur', details: error.message });
  } finally {
    console.log('Fermeture de la connexion MongoDB');
    await client.close();
  }
});

// Remplacer l'ancienne route PUT /me/reference-photo par POST /me/upload-reference-photo
router.post('/me/upload-reference-photo', authenticateToken, uploadReferencePhoto.single('referencePhoto'), async (req, res) => {
  const startTime = Date.now();
  console.log('🤳 Début upload selfie référence');
  const performanceLog = {
    userId: req.user?.userId,
    fileName: req.file?.originalname,
    fileSize: req.file?.size,
    steps: {}
  };
  try {
    if (!req.file) {
      performanceLog.error = 'Aucun fichier image reçu.';
      performanceLog.total = Date.now() - startTime;
      return res.status(400).json({ success: false, message: 'Aucun fichier image reçu.', performanceLog });
    }
    const t1 = Date.now();
    const imagePath = req.file.path;
    // Optimisation selfie
    let optimizedPath = imagePath;
    try {
      // Si tu as un service d'optimisation, utilise-le ici
      // optimizedPath = await uploadService.optimizeReferenceImage(imagePath);
      // Pour l'instant, on suppose que l'image est déjà optimisée
    } catch (err) {
      performanceLog.steps.optimization = Date.now() - t1;
      performanceLog.error = err.message;
      performanceLog.total = Date.now() - startTime;
      return res.status(500).json({ success: false, message: 'Erreur optimisation selfie', performanceLog });
    }
    performanceLog.steps.optimization = Date.now() - t1;
    console.log('📐 Optimisation selfie:', performanceLog.steps.optimization, 'ms');
    const t2 = Date.now();
    // Extraction features faciales
    let encodingResult;
    try {
      encodingResult = await generateFaceEncodingPython(optimizedPath);
    } catch (err) {
      performanceLog.steps.faceRecognition = Date.now() - t2;
      performanceLog.error = err.message;
      performanceLog.total = Date.now() - startTime;
      if (optimizedPath && optimizedPath !== imagePath) try { fs.unlinkSync(optimizedPath); } catch {}
      if (imagePath) try { fs.unlinkSync(imagePath); } catch {}
      return res.status(400).json({ success: false, message: err.message, performanceLog });
    }
    performanceLog.steps.faceRecognition = Date.now() - t2;
    console.log('🔍 Extraction features:', performanceLog.steps.faceRecognition, 'ms');
    if (!encodingResult.success) {
      performanceLog.error = encodingResult.error || 'Erreur lors de l\'analyse faciale';
      performanceLog.total = Date.now() - startTime;
      if (optimizedPath && optimizedPath !== imagePath) try { fs.unlinkSync(optimizedPath); } catch {}
      if (imagePath) try { fs.unlinkSync(imagePath); } catch {}
      return res.status(400).json({ success: false, message: encodingResult.error || 'Erreur lors de l\'analyse faciale', performanceLog });
    }
    const t3 = Date.now();
    // Mettre à jour l’utilisateur
    await client.connect();
    const db = client.db(dbName);
    const usersCollection = db.collection('users');
    const updateFields = {
      reference_face_data: {
        embedding: encodingResult.embedding,
        model: encodingResult.model,
        faces_detected: encodingResult.faces_detected,
        file_path: optimizedPath,
        created_at: new Date(),
        filename: req.file.filename
      },
      updatedAt: new Date()
    };
    const user = await usersCollection.findOneAndUpdate(
      { _id: new ObjectId(req.user.userId) },
      { $set: updateFields },
      { returnDocument: 'after' }
    );
    await client.close();
    performanceLog.steps.database = Date.now() - t3;
    if (!user.value) {
      performanceLog.error = 'Utilisateur non trouvé';
      performanceLog.total = Date.now() - startTime;
      if (optimizedPath && optimizedPath !== imagePath) try { fs.unlinkSync(optimizedPath); } catch {}
      if (imagePath) try { fs.unlinkSync(imagePath); } catch {}
      return res.status(404).json({ success: false, message: 'Utilisateur non trouvé', performanceLog });
    }
    performanceLog.total = Date.now() - startTime;
    console.log('✅ Upload selfie terminé:', performanceLog);
    res.json({
      success: true,
      message: 'Photo de référence uploadée et encodage facial généré avec succès.',
      data: {
        faces_detected: encodingResult.faces_detected,
        model_used: encodingResult.model,
        filename: req.file.filename
      },
      performanceLog
    });
  } catch (error) {
    performanceLog.error = error.message;
    performanceLog.total = Date.now() - startTime;
    if (req.file && req.file.path) {
      try { fs.unlinkSync(req.file.path); } catch {}
    }
    res.status(500).json({ success: false, message: 'Erreur lors de l’upload de la photo de référence', error: error.message, performanceLog });
  }
});

// Obtenir un utilisateur par ID (admin seulement)
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    // Vérifier si l'utilisateur est admin
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Accès refusé' });
    }

    const { id } = req.params;

    await client.connect();
    const db = client.db(dbName);
    const usersCollection = db.collection('users');

    const user = await usersCollection.findOne({ _id: new ObjectId(id) });

    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    res.json(user);

  } catch (error) {
    console.error('Erreur lors de la récupération de l\'utilisateur:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération de l\'utilisateur' });
  } finally {
    await client.close();
  }
});

// Modifier un utilisateur (admin seulement)
router.put('/:id', authenticateToken, validateUserUpdate, async (req, res) => {
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
    const { name, email, role } = req.body;

    await client.connect();
    const db = client.db(dbName);
    const usersCollection = db.collection('users');

    // Vérifier si l'utilisateur existe
    const existingUser = await usersCollection.findOne({ _id: new ObjectId(id) });

    if (!existingUser) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    // Vérifier si l'email est déjà utilisé (si modifié)
    if (email && email !== existingUser.email) {
      const emailExists = await usersCollection.findOne({ email });

      if (emailExists) {
        return res.status(400).json({ error: 'Cet email est déjà utilisé' });
      }
    }

    const user = await usersCollection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: { name, email, role } },
      { returnDocument: 'after' }
    );

    res.json({
      message: 'Utilisateur modifié avec succès',
      user: user.value
    });

  } catch (error) {
    console.error('Erreur lors de la modification de l\'utilisateur:', error);
    res.status(500).json({ error: 'Erreur lors de la modification de l\'utilisateur' });
  } finally {
    await client.close();
  }
});

// Supprimer un utilisateur (admin seulement)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    // Vérifier si l'utilisateur est admin
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Accès refusé' });
    }

    const { id } = req.params;

    await client.connect();
    const db = client.db(dbName);
    const usersCollection = db.collection('users');

    // Vérifier si l'utilisateur existe
    const existingUser = await usersCollection.findOne({ _id: new ObjectId(id) });

    if (!existingUser) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    // Empêcher la suppression de son propre compte
    if (id === req.user.userId) {
      return res.status(400).json({ error: 'Vous ne pouvez pas supprimer votre propre compte' });
    }

    await usersCollection.deleteOne({ _id: new ObjectId(id) });

    res.json({ message: 'Utilisateur supprimé avec succès' });

  } catch (error) {
    console.error('Erreur lors de la suppression de l\'utilisateur:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression de l\'utilisateur' });
  } finally {
    await client.close();
  }
});

// Route GET /users/:id/reference-face
router.get('/:id/reference-face', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { MongoClient, ObjectId } = require('mongodb');
    const uri = process.env.MONGODB_URI;
    const client = new MongoClient(uri);
    const dbName = uri.split('/').pop();
    await client.connect();
    const db = client.db(dbName);
    const user = await db.collection('users').findOne({ _id: new ObjectId(id) });
    await client.close();
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }
    res.json({ reference_face_data: user.reference_face_data || null });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router; 