const performanceStats = {
  uploads: [],
  averageTime: 0,
  slowUploads: 0
};

const performanceMonitor = (req, res, next) => {
  const startTime = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    
    // Enregistrer les stats
    performanceStats.uploads.push({
      timestamp: new Date(),
      duration,
      route: req.route?.path,
      fileSize: req.file?.size,
      userId: req.user?.userId
    });

    // Garder seulement les 100 derniers uploads
    if (performanceStats.uploads.length > 100) {
      performanceStats.uploads.shift();
    }

    // Calculer moyenne
    const total = performanceStats.uploads.reduce((sum, upload) => sum + upload.duration, 0);
    performanceStats.averageTime = total / performanceStats.uploads.length;

    // Compter les uploads lents
    if (duration > 10000) {
      performanceStats.slowUploads++;
      console.warn(`🐌 Upload lent détecté: ${duration}ms`);
    }

    // Log périodique des stats
    if (performanceStats.uploads.length % 10 === 0) {
      console.log('📊 Stats performance:', {
        averageTime: `${performanceStats.averageTime.toFixed(0)}ms`,
        slowUploads: performanceStats.slowUploads,
        totalUploads: performanceStats.uploads.length
      });
    }
  });

  next();
};

// Route pour consulter les stats
const getPerformanceStats = (req, res) => {
  res.json(performanceStats);
};

module.exports = { performanceMonitor, getPerformanceStats }; 