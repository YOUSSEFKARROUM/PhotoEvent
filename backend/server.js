/**
 * Photoevents Backend Server
 *
 * Point d'entrée principal du backend Express.
 * - Sécurité renforcée (helmet, CORS, rate limit)
 * - Connexion MongoDB centralisée (mongoose)
 * - Gestion robuste des erreurs
 * - Création automatique de l'admin si absent
 * - Documentation et logs explicites
 */



import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import path from 'path';
import { fileURLToPath } from 'url';
import uploadRoutes from './routes/uploadRoutes.js';
import config from './config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = config.server.port;
const isDevelopment = config.server.env === 'development';

// --- Sécurité : Vérification obligatoire de JWT_SECRET ---
if (!config.jwt.secret || config.jwt.secret === 'votre_cle_secrete_jwt_tres_longue_et_complexe_ici_par_defaut') {
  console.warn('⚠️  ATTENTION : JWT_SECRET utilise la valeur par défaut. En production, définissez une clé secrète unique dans le fichier .env');
}

// --- Connexion MongoDB centralisée (mongoose) ---
const mongoUri = config.mongodb.uri;

// Timeout pour la connexion MongoDB
const connectWithTimeout = async () => {
  try {
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 3000, // Réduit à 3 secondes
      socketTimeoutMS: 30000, // Réduit à 30 secondes
      connectTimeoutMS: 3000, // Timeout de connexion
    });
    console.log('✅ Connecté à MongoDB:', mongoUri);
  } catch (err) {
    console.error('❌ Erreur de connexion à MongoDB:', err.message);
    console.log('⚠️  Le serveur démarre sans MongoDB. Certaines fonctionnalités seront limitées.');
    // Ne pas arrêter le serveur, continuer sans DB
  }
};

// Connexion MongoDB asynchrone (non-bloquante)
setTimeout(connectWithTimeout, 100);

// --- Sécurité CORS améliorée ---
const corsOptions = {
  origin: config.server.env === 'production' 
    ? process.env.FRONTEND_URL 
    : ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// --- Limitation de la taille des payloads JSON ---
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

// --- Log global pour chaque requête (dev uniquement) ---
if (isDevelopment) {
  app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
  });
}

// --- Sécurité HTTP ---
if (config.server.env === 'production') {
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"]
      }
    }
  }));
} else {
  app.use(helmet());
}

// --- Rate limiting (production uniquement) ---
if (config.server.env === 'production') {
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requêtes par fenêtre
    message: {
      error: 'Trop de requêtes, réessayez plus tard',
      retryAfter: 900
    },
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use('/api/', limiter);
}

// --- Logging HTTP ---
app.use(morgan(config.server.env === 'development' ? 'dev' : 'combined'));

// --- Servir les images avec headers CORS explicites ---
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  setHeaders: (res) => {
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Cross-Origin-Resource-Policy', 'cross-origin');
    res.set('Cache-Control', 'public, max-age=31536000'); // Cache 1 an pour les images
  }
}));

// --- Middleware statique pour /api/uploads ---
const uploadsPath = path.join(__dirname, 'uploads');
app.use('/api/uploads', express.static(uploadsPath, {
  setHeaders: (res) => {
    res.set('Cache-Control', 'public, max-age=31536000');
  }
}));

// --- Routes API ---
app.use('/api/upload', uploadRoutes);
app.use('/api/auth', (await import('./routes/authRoutes.js')).default);
app.use('/api/events', (await import('./routes/eventRoutes.js')).default);
app.use('/api/photos', (await import('./routes/photos.js')).default);
app.use('/api/users', (await import('./routes/userRoutes.js')).default);
app.use('/api', express.static(path.join(__dirname, 'public')));

// --- Route racine ---
app.get('/', (req, res) => {
  res.json({
    message: 'Photoevents API is running',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString()
  });
});

// --- Routes de debug (DEV uniquement) ---
if (config.server.env === 'development') {
  // Diagnostic DB et fichiers
  app.get('/api/debug/photos', async (req, res) => {
    const fs = await import('fs');
    const uploadsDir = path.join(__dirname, 'uploads');
    try {
      const files = fs.readdirSync(uploadsDir);
      const Photo = (await import('./models/Photo.js')).default;
      const photosData = await Photo.find().limit(10);
      res.json({
        filesOnDisk: files,
        photosInDb: photosData.length,
        uploadsPath: uploadsDir
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  
  // Vérification fichiers
  app.get('/api/debug/files', (req, res) => {
    const fs = require('fs');
    const uploadsDir = path.join(__dirname, 'uploads');
    const photosDir = path.join(__dirname, 'uploads', 'photos');
    const uploadsExists = fs.existsSync(uploadsDir);
    const photosExists = fs.existsSync(photosDir);
    const files = photosExists ? fs.readdirSync(photosDir) : [];
    res.json({ uploadsExists, photosExists, filesCount: files.length });
  });
}

// --- Health check ---
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Photoevents API is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    environment: config.server.env
  });
});

// --- Création automatique de l'utilisateur admin (si absent) ---
async function ensureAdminUser() {
  const User = (await import('./models/User.js')).default;
  try {
    const admin = await User.findOne({ email: 'admin@photoevents.com' });
    if (!admin) {
      await User.create({
        email: 'admin@photoevents.com',
        password: await bcrypt.hash('admin123', 12),
        name: 'Administrateur',
        role: 'ADMIN',
        consentFacialRecognition: true, // Consentement par défaut pour l'admin
        createdAt: new Date(),
        updatedAt: new Date()
      });
      console.log('✅ Utilisateur admin créé : admin@photoevents.com / admin123');
    } else {
      console.log('ℹ️ Utilisateur admin existe déjà : admin@photoevents.com');
    }
  } catch (error) {
    console.error('❌ Erreur lors de la création de l\'admin:', error.message);
  }
}

// --- Gestion centralisée des erreurs ---
app.use((err, req, res, next) => {
  if (config.server.env !== 'production') {
    console.error('Error:', err);
  }
  
  const statusCode = err.statusCode || 500;
  const message = config.server.env === 'production' 
    ? 'Une erreur est survenue' 
    : err.message;
    
  res.status(statusCode).json({
    success: false,
    message,
    ...(config.server.env !== 'production' && { stack: err.stack })
  });
});

// --- 404 handler ---
app.use('*', (req, res) => {
  res.status(404).json({ 
    success: false,
    message: 'Route non trouvée',
    path: req.originalUrl,
    method: req.method
  });
});

// --- Lancement du serveur ---
app.listen(PORT, () => {
  console.log(`🚀 Photoevents Backend running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🌍 Environment: ${config.server.env}`);
  console.log(`🔑 JWT Secret: ${config.jwt.secret.substring(0, 20)}...`);
  console.log(`📁 Uploads: ${config.upload.path}`);
  
  // Créer l'admin après le démarrage du serveur
  ensureAdminUser();
});
