import { Worker } from 'bullmq';
import Redis from 'ioredis';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Configuration
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const execAsync = promisify(exec);

/**
 * Configuration Redis pour le worker
 */
const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD,
  retryDelayOnFailover: 100,
  maxRetriesPerRequest: 1,
  lazyConnect: true,
  retryStrategy: () => null,
};

const disableQueues = process.env.DISABLE_REDIS === 'true' || process.env.QUEUE_MODE === 'memory';

let redis = null;
let redisAvailable = false;

if (!disableQueues) {
  const tmpRedis = new Redis(redisConfig);
  let loggedError = false;
  tmpRedis.on('error', (error) => {
    if (!loggedError) {
      console.error('❌ Erreur Redis dans le worker:', error.message);
      loggedError = true;
    }
  });
  try {
    await tmpRedis.ping();
    redisAvailable = true;
    redis = tmpRedis;
    console.log('✅ Worker connecté à Redis');
  } catch (err) {
    try { tmpRedis.disconnect(); } catch {}
    console.warn('⚠️ Redis indisponible - arrêt du worker (rien à traiter sans Redis).');
  }
} else {
  console.log('ℹ️ Worker désactivé (DISABLE_REDIS/QUEUE_MODE).');
}

/**
 * Connexion MongoDB
 */
const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/photoevents';
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Worker connecté à MongoDB');
  } catch (error) {
    console.error('❌ Erreur connexion MongoDB:', error.message);
    throw error;
  }
};

/**
 * Traitement d'une photo avec DeepFace
 * @param {Object} job - Job BullMQ
 * @returns {Promise<Object>} - Résultat du traitement
 */
const processPhoto = async (job) => {
  const { photoId, filePath, userId, eventId } = job.data;

  console.log(`🚀 Début traitement photo ${photoId}`);

  try {
    // Mettre à jour le statut en base
    const Photo = (await import('../models/Photo.js')).default;
    await Photo.findByIdAndUpdate(photoId, {
      processingStatus: 'processing',
      processingStartedAt: new Date()
    });

    // Vérifier que le fichier existe
    const fs = await import('fs');
    if (!fs.existsSync(filePath)) {
      throw new Error(`Fichier non trouvé: ${filePath}`);
    }

    // Chemin vers le script Python
    const scriptPath = path.join(__dirname, '..', 'scripts', 'deepface_encode.py');

    // Commande Python avec gestion d'erreur
    const pythonCommand = process.env.PYTHON_COMMAND || 'python';
    const command = `${pythonCommand} "${scriptPath}" "${filePath}" "Facenet"`;

    console.log(`🔍 Exécution DeepFace: ${command}`);

    // Exécution avec timeout
    const { stdout, stderr } = await execAsync(command, {
      timeout: 300000, // 5 minutes
      maxBuffer: 1024 * 1024 // 1MB
    });

    if (stderr) {
      console.warn('⚠️ Avertissements DeepFace:', stderr);
    }

    // Parser le résultat
    const result = JSON.parse(stdout.trim());

    if (!result.success) {
      throw new Error(`DeepFace échec: ${result.error}`);
    }

    // Mettre à jour la photo avec les résultats
    const updateData = {
      faceEncoding: result.embedding,
      faceModel: result.model,
      facesDetected: result.faces_detected,
      processed: true,
      processingStatus: 'completed',
      processingCompletedAt: new Date()
    };

    await Photo.findByIdAndUpdate(photoId, updateData);

    console.log(`✅ Photo ${photoId} traitée avec succès`);

    return {
      success: true,
      photoId,
      facesDetected: result.faces_detected,
      model: result.model
    };

  } catch (error) {
    console.error(`❌ Erreur traitement photo ${photoId}:`, error.message);

    // Mettre à jour le statut d'erreur
    try {
      const Photo = (await import('../models/Photo.js')).default;
      await Photo.findByIdAndUpdate(photoId, {
        processingStatus: 'failed',
        processingError: error.message,
        processingCompletedAt: new Date()
      });
    } catch (dbError) {
      console.error('❌ Erreur mise à jour statut:', dbError.message);
    }

    throw error;
  }
};

/**
 * Nettoyage des fichiers
 * @param {Object} job - Job BullMQ
 * @returns {Promise<Object>} - Résultat du nettoyage
 */
const cleanupFiles = async (job) => {
  const { type, directory, maxAge } = job.data;

  console.log(`🧹 Début nettoyage ${type} dans ${directory}`);

  try {
    const { cleanupTempFiles, cleanupOrphanFiles } = await import('../utils/photoCleanup.js');
    const Photo = (await import('../models/Photo.js')).default;

    let result;

    switch (type) {
      case 'temp':
        result = cleanupTempFiles(directory, maxAge);
        break;
      case 'orphan':
        const photos = await Photo.find({});
        result = cleanupOrphanFiles(photos, directory);
        break;
      default:
        throw new Error(`Type de nettoyage inconnu: ${type}`);
    }

    console.log(`✅ Nettoyage ${type} terminé:`, result);
    return result;

  } catch (error) {
    console.error(`❌ Erreur nettoyage ${type}:`, error.message);
    throw error;
  }
};

/**
 * Worker principal pour le traitement des photos
 */
if (!redisAvailable) {
  process.exit(0);
}

const photoWorker = new Worker('photo-processing', async (job) => {
  console.log(`📸 Traitement job ${job.id}: ${job.name}`);

  switch (job.name) {
    case 'process-photo':
      return await processPhoto(job);
    default:
      throw new Error(`Type de job inconnu: ${job.name}`);
  }
}, {
  connection: redis,
  concurrency: 2, // Traiter 2 jobs simultanément
  removeOnComplete: 100,
  removeOnFail: 50
});

/**
 * Worker pour le nettoyage
 */
const cleanupWorker = new Worker('cleanup-tasks', async (job) => {
  console.log(`🧹 Nettoyage job ${job.id}: ${job.name}`);

  switch (job.name) {
    case 'cleanup-files':
      return await cleanupFiles(job);
    default:
      throw new Error(`Type de job de nettoyage inconnu: ${job.name}`);
  }
}, {
  connection: redis,
  concurrency: 1, // Un seul job de nettoyage à la fois
  removeOnComplete: 50,
  removeOnFail: 20
});

// Événements du worker photo
photoWorker.on('completed', (job, result) => {
  console.log(`✅ Job photo ${job.id} terminé:`, result);
});

photoWorker.on('failed', (job, err) => {
  console.error(`❌ Job photo ${job.id} échoué:`, err.message);
});

photoWorker.on('error', (err) => {
  console.error('❌ Erreur worker photo:', err.message);
});

// Événements du worker nettoyage
cleanupWorker.on('completed', (job, result) => {
  console.log(`✅ Job nettoyage ${job.id} terminé:`, result);
});

cleanupWorker.on('failed', (job, err) => {
  console.error(`❌ Job nettoyage ${job.id} échoué:`, err.message);
});

cleanupWorker.on('error', (err) => {
  console.error('❌ Erreur worker nettoyage:', err.message);
});

/**
 * Initialisation et démarrage
 */
const startWorkers = async () => {
  try {
    console.log('🚀 Démarrage des workers...');

    // Connexion à MongoDB
    await connectDB();

    console.log('👷 Workers prêts !');
    console.log('📸 Worker photo-processing actif');
    console.log('🧹 Worker cleanup-tasks actif');

  } catch (error) {
    console.error('❌ Erreur démarrage workers:', error.message);
    process.exit(1);
  }
};

/**
 * Arrêt propre des workers
 */
const stopWorkers = async () => {
  console.log('\n🛑 Arrêt des workers...');

  try {
    await Promise.all([
      photoWorker.close(),
      cleanupWorker.close(),
      redis.quit(),
      mongoose.disconnect()
    ]);

    console.log('✅ Workers arrêtés proprement');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur arrêt workers:', error.message);
    process.exit(1);
  }
};

// Gestion des signaux d'arrêt
process.on('SIGINT', stopWorkers);
process.on('SIGTERM', stopWorkers);

// Démarrage
startWorkers(); 