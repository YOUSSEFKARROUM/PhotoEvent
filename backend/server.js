const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();
const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// Vérification obligatoire de JWT_SECRET
if (!process.env.JWT_SECRET) {
  console.error('ERREUR CRITIQUE : La variable d\'environnement JWT_SECRET n\'est pas définie. Ajoutez-la dans un fichier .env à la racine du dossier backend.');
  process.exit(1);
}

// CORS global pour autoriser le frontend React
app.use(cors({ origin: 'http://localhost:5173' }));

// Sert le dossier uploads à la racine du projet
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Exemple de route racine
app.get('/', (req, res) => {
  res.send('Backend is running!');
});

// Middleware de sécurité
app.use(helmet());

// Ajout automatique de la configuration CORS
// app.use(cors({ origin: 'http://localhost:5173' })); // This line is removed as per the new_code

// Ajoute le header CORS pour les fichiers statiques /uploads
// app.use('/uploads', (req, res, next) => { // This block is removed as per the new_code
//   res.header('Access-Control-Allow-Origin', 'http://localhost:5173');
//   next();
// }, express.static('uploads')); // This block is removed as per the new_code

// Rate limiting (désactivé en développement)
if (process.env.NODE_ENV === 'production') {
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limite chaque IP à 100 requêtes par fenêtre
  });
  app.use(limiter);
}

// Logging
app.use(morgan('combined'));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', require('./routes/auth').router);
app.use('/api/users', require('./routes/users'));
app.use('/api/events', require('./routes/events'));
app.use('/api/photos', require('./routes/photos'));
app.use('/api/upload', require('./routes/upload'));
app.use('/uploads/photos', require('express').static(path.join(__dirname, 'uploads/photos')));
// app.use('/uploads', express.static(path.join(__dirname, 'uploads'))); // This line is removed as per the new_code

// Route de diagnostic
app.get('/api/photos/debug', (req, res) => {
    const fs = require('fs');
    const sqlite3 = require('sqlite3').verbose();
    const uploadsDir = path.join(__dirname, 'uploads/photos');
    try {
        const files = fs.readdirSync(uploadsDir);
        const db = new sqlite3.Database('./database.sqlite');
        db.all("SELECT * FROM photos", (err, photos) => {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.json({
                filesOnDisk: files,
                photosInDb: photos,
                uploadsPath: uploadsDir
            });
        });
        db.close();
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Sert les images depuis backend/uploads/photos avec header CORS explicite
app.use('/uploads', express.static(path.join(__dirname, 'uploads/photos'), {
  setHeaders: (res, path) => {
    res.set('Access-Control-Allow-Origin', 'http://localhost:5173');
    res.set('Cross-Origin-Resource-Policy', 'cross-origin'); // Permet le chargement cross-origin des images
  }
}));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Photoevents API is running',
    timestamp: new Date().toISOString()
  });
});

async function ensureAdminUser() {
  const uri = process.env.DATABASE_URL;
  const client = new MongoClient(uri);
  const dbName = uri.split('/').pop();
  await client.connect();
  const db = client.db(dbName);
  const users = db.collection('users');
  const admin = await users.findOne({ email: 'admin@photoevents.com' });
  if (!admin) {
    await users.insertOne({
      email: 'admin@photoevents.com',
      password: await bcrypt.hash('admin123', 12),
      name: 'Administrateur',
      role: 'ADMIN',
      createdAt: new Date(),
      updatedAt: new Date()
    });
    console.log('Utilisateur admin créé : admin@photoevents.com / admin123');
  }
  await client.close();
}

ensureAdminUser();

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`🚀 Photoevents Backend running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
}); 