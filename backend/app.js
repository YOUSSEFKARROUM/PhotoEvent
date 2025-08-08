const express = require('express');
const cors = require('cors');
const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');
const { router: authRoutes } = require('./routes/auth');
const eventRoutes = require('./routes/eventRoutes');
const photoRoutes = require('./routes/photos');
const uploadRoutes = require('./routes/upload');
const path = require('path');

// Import conditionnel du middleware de performance
let performanceMonitor, getPerformanceStats;
try {
    const perfModule = require('./middleware/performanceMonitor');
    performanceMonitor = perfModule.performanceMonitor;
    getPerformanceStats = perfModule.getPerformanceStats;
} catch (error) {
    console.log('⚠️  Middleware de performance non disponible');
    performanceMonitor = (req, res, next) => next();
    getPerformanceStats = (req, res) => res.json({ error: 'Performance monitoring disabled' });
}

const app = express();

// Middleware de base
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Middleware de performance conditionnel
app.use(performanceMonitor);

// Static files
app.use('/api', express.static(path.join(__dirname, 'public')));
app.use('/api/uploads', express.static('uploads'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/photos', photoRoutes);
app.use('/api/upload', uploadRoutes);
app.get('/api/performance/stats', getPerformanceStats);

// Debug route to check DB and file status
app.get('/api/debug/status', async (req, res) => {
    try {
        const fs = require('fs');
        const path = require('path');
        const uploadsDir = path.join(__dirname, 'uploads', 'photos');
        const files = fs.existsSync(uploadsDir) ? fs.readdirSync(uploadsDir) : [];
        
        const uri = process.env.DATABASE_URL;
        const client = new MongoClient(uri);
        const dbName = uri.split('/').pop();
        await client.connect();
        const db = client.db(dbName);
        const photos = db.collection('photos');
        const photosData = await photos.find().toArray();
        await client.close();
        res.json({
            filesOnDisk: files,
            photosInDb: photosData,
            uploadsPath: uploadsDir
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Debug route to check files in uploads/photos
app.get('/api/debug/files', (req, res) => {
    const fs = require('fs');
    const path = require('path');
    const uploadsDir = path.join(__dirname, 'uploads');
    const photosDir = path.join(__dirname, 'uploads', 'photos');
    console.log("=== FILE SYSTEM CHECK ===");
    console.log(`Uploads directory exists: ${fs.existsSync(uploadsDir)}`);
    console.log(`Photos directory exists: ${fs.existsSync(photosDir)}`);
    if (fs.existsSync(photosDir)) {
        const files = fs.readdirSync(photosDir);
        console.log(`Files in photos directory:`, files);
        res.json({
            uploadsExists: fs.existsSync(uploadsDir),
            photosExists: fs.existsSync(photosDir),
            files: files
        });
    } else {
        res.json({
            uploadsExists: fs.existsSync(uploadsDir),
            photosExists: false,
            files: []
        });
    }
});

// Debug route to test image serving
app.get('/api/test-image/:filename', (req, res) => {
    const path = require('path');
    const fs = require('fs');
    const filePath = path.join(__dirname, 'uploads', 'photos', req.params.filename);
    console.log(`Testing image: ${filePath}`);
    console.log(`File exists: ${fs.existsSync(filePath)}`);
    if (fs.existsSync(filePath)) {
        res.sendFile(filePath);
    } else {
        res.status(404).json({ error: 'File not found', path: filePath });
    }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Photoevents API is running',
    timestamp: new Date().toISOString()
  });
});

async function ensureAdminUser() {
  if (process.env.NODE_ENV === 'test') {
    return; // Skip admin user creation in test environment
  }
  
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
  } else {
    console.log('Utilisateur admin existe déjà : admin@photoevents.com');
  }
  await client.close();
}

// Only create admin user if not in test mode
if (process.env.NODE_ENV !== 'test') {
  ensureAdminUser();
}

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

module.exports = app;
