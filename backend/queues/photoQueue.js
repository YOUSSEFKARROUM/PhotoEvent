import { Queue } from 'bullmq';
import Redis from 'ioredis';

/**
 * Configuration Redis pour les queues
 */
const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD,
  retryDelayOnFailover: 100,
  maxRetriesPerRequest: 3,
  lazyConnect: true
};

// Connexion Redis
const redis = new Redis(redisConfig);

redis.on('connect', () => {
  console.log('✅ Connecté à Redis pour les queues');
});

redis.on('error', (error) => {
  console.error('❌ Erreur Redis:', error.message);
});

/**
 * Queue pour le traitement des photos
 */
const photoQueue = new Queue('photo-processing', {
  connection: redis,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000
    },
    removeOnComplete: 100,
    removeOnFail: 50
  }
});

/**
 * Queue pour le nettoyage automatique
 */
const cleanupQueue = new Queue('cleanup-tasks', {
  connection: redis,
  defaultJobOptions: {
    attempts: 2,
    backoff: {
      type: 'fixed',
      delay: 5000
    },
    removeOnComplete: 50,
    removeOnFail: 20
  }
});

/**
 * Ajoute une tâche de traitement de photo à la queue
 * @param {Object} photoData - Données de la photo
 * @returns {Promise<Job>} - Job créé
 */
export const addPhotoProcessingJob = async (photoData) => {
  try {
    const job = await photoQueue.add('process-photo', {
      photoId: photoData.id,
      filePath: photoData.path,
      userId: photoData.uploadedBy,
      eventId: photoData.eventId,
      timestamp: new Date().toISOString()
    }, {
      priority: 1,
      delay: 1000 // Délai de 1 seconde avant traitement
    });

    console.log(`📸 Job de traitement ajouté: ${job.id} pour la photo ${photoData.id}`);
    return job;
  } catch (error) {
    console.error('❌ Erreur lors de l\'ajout du job de traitement:', error.message);
    throw error;
  }
};

/**
 * Ajoute une tâche de nettoyage à la queue
 * @param {Object} cleanupData - Données de nettoyage
 * @returns {Promise<Job>} - Job créé
 */
export const addCleanupJob = async (cleanupData) => {
  try {
    const job = await cleanupQueue.add('cleanup-files', {
      type: cleanupData.type, // 'temp', 'orphan', 'old'
      directory: cleanupData.directory,
      maxAge: cleanupData.maxAge || 24, // heures
      timestamp: new Date().toISOString()
    }, {
      priority: 5, // Priorité plus basse
      delay: 5000 // Délai de 5 secondes
    });

    console.log(`🧹 Job de nettoyage ajouté: ${job.id} pour ${cleanupData.type}`);
    return job;
  } catch (error) {
    console.error('❌ Erreur lors de l\'ajout du job de nettoyage:', error.message);
    throw error;
  }
};

/**
 * Obtient les statistiques de la queue
 * @returns {Promise<Object>} - Statistiques
 */
export const getQueueStats = async () => {
  try {
    const [waiting, active, completed, failed] = await Promise.all([
      photoQueue.getWaiting(),
      photoQueue.getActive(),
      photoQueue.getCompleted(),
      photoQueue.getFailed()
    ]);

    return {
      waiting: waiting.length,
      active: active.length,
      completed: completed.length,
      failed: failed.length,
      total: waiting.length + active.length + completed.length + failed.length
    };
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des stats de queue:', error.message);
    return { waiting: 0, active: 0, completed: 0, failed: 0, total: 0 };
  }
};

/**
 * Vide toutes les queues
 * @returns {Promise<boolean>} - True si réussi
 */
export const clearAllQueues = async () => {
  try {
    await Promise.all([
      photoQueue.obliterate({ force: true }),
      cleanupQueue.obliterate({ force: true })
    ]);
    console.log('🗑️ Toutes les queues ont été vidées');
    return true;
  } catch (error) {
    console.error('❌ Erreur lors du vidage des queues:', error.message);
    return false;
  }
};

/**
 * Ferme proprement les connexions
 */
export const closeQueues = async () => {
  try {
    await Promise.all([
      photoQueue.close(),
      cleanupQueue.close(),
      redis.quit()
    ]);
    console.log('🔌 Connexions Redis fermées');
  } catch (error) {
    console.error('❌ Erreur lors de la fermeture des queues:', error.message);
  }
};

// Gestion de l'arrêt propre
process.on('SIGINT', async () => {
  console.log('\n🛑 Arrêt en cours...');
  await closeQueues();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Arrêt en cours...');
  await closeQueues();
  process.exit(0);
});

export default photoQueue;
export { cleanupQueue, redis }; 