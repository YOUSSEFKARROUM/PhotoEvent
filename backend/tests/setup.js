const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

let mongoServer;

beforeAll(async () => {
  // Configuration des variables d'environnement pour les tests
  process.env.JWT_SECRET = 'test-jwt-secret-key';
  process.env.NODE_ENV = 'test';
  
  // Démarrage du serveur MongoDB en mémoire
  mongoServer = await MongoMemoryServer.create({
    binary: {
      downloadDir: './mongodb-binaries',
      version: '6.0.14'
    },
    instance: {
      dbName: 'test_db'
    }
  });
  const mongoUri = mongoServer.getUri();
  process.env.MONGODB_URI = mongoUri;
  process.env.MONGODB_URI = mongoUri + 'test_db';
}, 120000); // 2 minutes pour permettre le téléchargement

afterAll(async () => {
  // Nettoyage après tous les tests
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  if (mongoServer) {
    await mongoServer.stop();
  }
});

beforeEach(async () => {
  // Nettoie la base de données avant chaque test
  if (mongoose.connection.readyState !== 0) {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      const collection = collections[key];
      await collection.deleteMany({});
    }
  }
});

// Mock des services externes si nécessaire
jest.mock('cloudinary', () => ({
  v2: {
    config: jest.fn(),
    uploader: {
      upload: jest.fn(() => Promise.resolve({
        public_id: 'test_public_id',
        secure_url: 'https://test-cloudinary-url.com/test.jpg'
      })),
      destroy: jest.fn(() => Promise.resolve({ result: 'ok' }))
    }
  }
}));
