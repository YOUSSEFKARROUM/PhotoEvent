import schedule from 'node-schedule';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

// Configuration
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const execAsync = promisify(exec);

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
    console.log('✅ Auto-cleanup connecté à MongoDB');
  } catch (error) {
    console.error('❌ Erreur connexion MongoDB:', error.message);
    throw error;
  }
};

/**
 * Nettoyage des fichiers temporaires
 */
const cleanupTempFiles = async () => {
  try {
    console.log('🧹 Début nettoyage fichiers temporaires...');

    const tempDir = path.join(__dirname, '..', 'uploads', 'temp');
    const { cleanupTempFiles } = await import('../utils/photoCleanup.js');

    const result = cleanupTempFiles(tempDir, 24); // 24 heures
    console.log(`✅ Nettoyage temporaires terminé: ${result} fichiers supprimés`);

    return result;
  } catch (error) {
    console.error('❌ Erreur nettoyage temporaires:', error.message);
    return 0;
  }
};

/**
 * Nettoyage des fichiers orphelins
 */
const cleanupOrphanFiles = async () => {
  try {
    console.log('🗑️ Début nettoyage fichiers orphelins...');

    const Photo = (await import('../models/Photo.js')).default;
    const uploadsDir = path.join(__dirname, '..', 'uploads', 'photos');
    const { cleanupOrphanFiles } = await import('../utils/photoCleanup.js');

    const photos = await Photo.find({});
    const result = cleanupOrphanFiles(photos, uploadsDir);

    console.log(`✅ Nettoyage orphelins terminé: ${result.deleted} fichiers supprimés`);
    return result;
  } catch (error) {
    console.error('❌ Erreur nettoyage orphelins:', error.message);
    return { deleted: 0, errors: 1 };
  }
};

/**
 * Nettoyage des anciennes photos non traitées
 */
const cleanupOldPendingPhotos = async () => {
  try {
    console.log('⏰ Début nettoyage photos en attente anciennes...');

    const Photo = (await import('../models/Photo.js')).default;
    const { deleteFileIfExists } = await import('../utils/photoCleanup.js');

    // Photos en attente depuis plus de 24h
    const cutoffDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const oldPendingPhotos = await Photo.find({
      processingStatus: 'pending',
      uploadDate: { $lt: cutoffDate }
    });

    let deletedCount = 0;
    for (const photo of oldPendingPhotos) {
      if (photo.path && deleteFileIfExists(photo.path)) {
        await Photo.findByIdAndDelete(photo._id);
        deletedCount++;
      }
    }

    console.log(`✅ Nettoyage photos anciennes terminé: ${deletedCount} photos supprimées`);
    return deletedCount;
  } catch (error) {
    console.error('❌ Erreur nettoyage photos anciennes:', error.message);
    return 0;
  }
};

/**
 * Nettoyage des logs d'erreur
 */
const cleanupErrorLogs = async () => {
  try {
    console.log('📝 Début nettoyage logs d\'erreur...');

    const fs = await import('fs');
    const logPath = path.join(__dirname, '..', 'upload_error.log');

    if (fs.existsSync(logPath)) {
      const stats = fs.statSync(logPath);
      const fileSize = stats.size;

      // Si le fichier fait plus de 10MB, le tronquer
      if (fileSize > 10 * 1024 * 1024) {
        const content = fs.readFileSync(logPath, 'utf8');
        const lines = content.split('\n');
        const recentLines = lines.slice(-1000); // Garder les 1000 dernières lignes
        fs.writeFileSync(logPath, recentLines.join('\n'));
        console.log('✅ Log d\'erreur tronqué');
      }
    }

    return true;
  } catch (error) {
    console.error('❌ Erreur nettoyage logs:', error.message);
    return false;
  }
};

/**
 * Nettoyage complet hebdomadaire
 */
const weeklyCleanup = async () => {
  console.log('📅 === DÉBUT NETTOYAGE HEBDOMADAIRE ===');

  try {
    const results = {
      tempFiles: await cleanupTempFiles(),
      orphanFiles: await cleanupOrphanFiles(),
      oldPendingPhotos: await cleanupOldPendingPhotos(),
      errorLogs: await cleanupErrorLogs()
    };

    console.log('📊 Résultats nettoyage hebdomadaire:', results);
    console.log('✅ === NETTOYAGE HEBDOMADAIRE TERMINÉ ===');

    return results;
  } catch (error) {
    console.error('❌ Erreur nettoyage hebdomadaire:', error.message);
    return null;
  }
};

/**
 * Nettoyage quotidien (plus léger)
 */
const dailyCleanup = async () => {
  console.log('🌅 === DÉBUT NETTOYAGE QUOTIDIEN ===');

  try {
    const results = {
      tempFiles: await cleanupTempFiles(),
      errorLogs: await cleanupErrorLogs()
    };

    console.log('📊 Résultats nettoyage quotidien:', results);
    console.log('✅ === NETTOYAGE QUOTIDIEN TERMINÉ ===');

    return results;
  } catch (error) {
    console.error('❌ Erreur nettoyage quotidien:', error.message);
    return null;
  }
};

/**
 * Nettoyage manuel via ligne de commande
 */
const manualCleanup = async (type = 'all') => {
  console.log(`🔧 === NETTOYAGE MANUEL: ${type} ===`);

  try {
    let results;

    switch (type) {
      case 'temp':
        results = await cleanupTempFiles();
        break;
      case 'orphan':
        results = await cleanupOrphanFiles();
        break;
      case 'old':
        results = await cleanupOldPendingPhotos();
        break;
      case 'logs':
        results = await cleanupErrorLogs();
        break;
      case 'all':
      default:
        results = await weeklyCleanup();
        break;
    }

    console.log('✅ === NETTOYAGE MANUEL TERMINÉ ===');
    return results;
  } catch (error) {
    console.error('❌ Erreur nettoyage manuel:', error.message);
    return null;
  }
};

/**
 * Configuration des tâches planifiées
 */
const setupScheduledTasks = () => {
  // Nettoyage quotidien à 3h du matin
  schedule.scheduleJob('0 3 * * *', dailyCleanup);
  console.log('⏰ Nettoyage quotidien programmé: 3h00');

  // Nettoyage hebdomadaire le dimanche à 2h du matin
  schedule.scheduleJob('0 2 * * 0', weeklyCleanup);
  console.log('⏰ Nettoyage hebdomadaire programmé: Dimanche 2h00');

  // Nettoyage des logs toutes les 6 heures
  schedule.scheduleJob('0 */6 * * *', cleanupErrorLogs);
  console.log('⏰ Nettoyage logs programmé: Toutes les 6 heures');
};

/**
 * Démarrage du service
 */
const startAutoCleanup = async () => {
  try {
    console.log('🚀 Démarrage du service de nettoyage automatique...');

    // Connexion à MongoDB
    await connectDB();

    // Configuration des tâches planifiées
    setupScheduledTasks();

    console.log('✅ Service de nettoyage automatique démarré');
    console.log('📅 Tâches programmées:');
    console.log('   - Nettoyage quotidien: 3h00');
    console.log('   - Nettoyage hebdomadaire: Dimanche 2h00');
    console.log('   - Nettoyage logs: Toutes les 6 heures');

    // Nettoyage initial
    console.log('🧹 Exécution du nettoyage initial...');
    await dailyCleanup();

  } catch (error) {
    console.error('❌ Erreur démarrage auto-cleanup:', error.message);
    process.exit(1);
  }
};

/**
 * Arrêt propre
 */
const stopAutoCleanup = async () => {
  console.log('\n🛑 Arrêt du service de nettoyage automatique...');

  try {
    await mongoose.disconnect();
    console.log('✅ Service arrêté proprement');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur arrêt service:', error.message);
    process.exit(1);
  }
};

// Gestion des arguments de ligne de commande
const args = process.argv.slice(2);
if (args.length > 0) {
  const type = args[0];
  manualCleanup(type).then(() => {
    process.exit(0);
  }).catch((error) => {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  });
} else {
  // Mode service
  startAutoCleanup();

  // Gestion des signaux d'arrêt
  process.on('SIGINT', stopAutoCleanup);
  process.on('SIGTERM', stopAutoCleanup);
} 