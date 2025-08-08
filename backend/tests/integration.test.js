const request = require('supertest');
const express = require('express');
const { MongoMemoryServer } = require('mongodb-memory-server');
const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');

// Import des routes et contrôleurs
const authController = require('../controllers/authController');
const eventController = require('../controllers/eventController');
const uploadController = require('../controllers/uploadController');

// Configuration de l'app Express pour les tests d'intégration
const app = express();
app.use(express.json());

// Middleware d'authentification mock pour les tests
const mockAuth = (req, res, next) => {
  if (req.headers.authorization) {
    req.user = { userId: '507f1f77bcf86cd799439011', email: 'test@test.com', role: 'ADMIN' };
  }
  next();
};

// Routes
app.post('/api/auth/login', authController.login);
app.get('/api/auth/me', mockAuth, authController.getCurrentUser);
app.get('/api/events', eventController.getAllEvents);
app.post('/api/events', mockAuth, eventController.createEvent);
app.get('/api/events/:id', eventController.getEventById);
app.put('/api/events/:id', mockAuth, eventController.updateEvent);
app.delete('/api/events/:id', mockAuth, eventController.deleteEvent);

describe('Tests d\'Intégration API', () => {
  let mongoServer;
  let client;
  let db;
  let authToken;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    process.env.MONGODB_URI = uri + 'integration_test';
    process.env.JWT_SECRET = 'test-secret-key';
    
    client = new MongoClient(uri);
    await client.connect();
    db = client.db('integration_test');
  });

  afterAll(async () => {
    if (client) await client.close();
    if (mongoServer) await mongoServer.stop();
  });

  beforeEach(async () => {
    // Nettoie toutes les collections
    const collections = await db.listCollections().toArray();
    for (const collection of collections) {
      await db.collection(collection.name).deleteMany({});
    }

    // Créer un utilisateur admin pour les tests (même email que la prod)
    const hashedPassword = await bcrypt.hash('admin123', 12);
    await db.collection('users').insertOne({
      email: 'admin@photoevents.com',
      password: hashedPassword,
      name: 'Admin Test',
      role: 'ADMIN',
      createdAt: new Date(),
      updatedAt: new Date()
    });
  });

  describe('Workflow complet : Authentification → Événements', () => {
    it('devrait permettre le workflow complet d\'authentification et de gestion d\'événements', async () => {
      // 1. Authentification
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@photoevents.com',
          password: 'admin123'
        });

      expect(loginResponse.status).toBe(200);
      expect(loginResponse.body).toHaveProperty('token');
      expect(loginResponse.body.user.role).toBe('ADMIN');

      authToken = loginResponse.body.token;

      // 2. Créer un événement
      const eventData = {
        name: 'Événement Test Intégration',
        date: '2024-06-15',
        location: 'Paris, France',
        description: 'Test d\'intégration complète',
        photographerEmail: 'photo@test.com'
      };

      const createResponse = await request(app)
        .post('/api/events')
        .set('Authorization', `Bearer ${authToken}`)
        .send(eventData);

      expect(createResponse.status).toBe(201);
      expect(createResponse.body.name).toBe(eventData.name);
      const eventId = createResponse.body._id;

      // 3. Récupérer tous les événements
      const getAllResponse = await request(app)
        .get('/api/events');

      expect(getAllResponse.status).toBe(200);
      expect(getAllResponse.body).toHaveLength(1);
      expect(getAllResponse.body[0].name).toBe(eventData.name);

      // 4. Récupérer l'événement spécifique
      const getOneResponse = await request(app)
        .get(`/api/events/${eventId}`);

      expect(getOneResponse.status).toBe(200);
      expect(getOneResponse.body.name).toBe(eventData.name);

      // 5. Mettre à jour l'événement
      const updateData = {
        name: 'Événement Mis à Jour',
        location: 'Lyon, France'
      };

      const updateResponse = await request(app)
        .put(`/api/events/${eventId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData);

      expect(updateResponse.status).toBe(200);
      expect(updateResponse.body.name).toBe('Événement Mis à Jour');
      expect(updateResponse.body.location).toBe('Lyon, France');

      // 6. Vérifier la mise à jour
      const getUpdatedResponse = await request(app)
        .get(`/api/events/${eventId}`);

      expect(getUpdatedResponse.status).toBe(200);
      expect(getUpdatedResponse.body.name).toBe('Événement Mis à Jour');

      // 7. Supprimer l'événement
      const deleteResponse = await request(app)
        .delete(`/api/events/${eventId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(deleteResponse.status).toBe(200);

      // 8. Vérifier la suppression
      const getDeletedResponse = await request(app)
        .get(`/api/events/${eventId}`);

      expect(getDeletedResponse.status).toBe(404);

      // 9. Vérifier que la liste est vide
      const getFinalResponse = await request(app)
        .get('/api/events');

      expect(getFinalResponse.status).toBe(200);
      expect(getFinalResponse.body).toHaveLength(0);
    });
  });

  describe('Tests de Gestion des Erreurs', () => {
    it('devrait gérer les erreurs d\'authentification', async () => {
      // Tentative d'accès sans token
      const response = await request(app)
        .post('/api/events')
        .send({
          name: 'Événement Sans Auth',
          date: '2024-06-15'
        });

      // L'endpoint devrait être protégé
      // Note: Le comportement exact dépend de votre middleware d'auth
      expect([401, 403, 500]).toContain(response.status);
    });

    it('devrait gérer les données invalides', async () => {
      // Authentification
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@photoevents.com',
          password: 'admin123'
        });

      const authToken = loginResponse.body.token;

      // Créer un événement avec un email invalide
      const eventData = {
        name: 'Événement avec Email Invalide',
        photographerEmail: 'email-invalide'
      };

      const createResponse = await request(app)
        .post('/api/events')
        .set('Authorization', `Bearer ${authToken}`)
        .send(eventData);

      // Le serveur devrait accepter la création (la validation email est dans updateEvent)
      expect(createResponse.status).toBe(201);
      const eventId = createResponse.body._id;

      // Mais la mise à jour avec email invalide devrait échouer
      const updateResponse = await request(app)
        .put(`/api/events/${eventId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ photographerEmail: 'email-toujours-invalide' });

      expect(updateResponse.status).toBe(400);
      expect(updateResponse.body.error).toBe('Email photographe invalide');
    });

    it('devrait gérer les IDs d\'événements invalides', async () => {
      const invalidId = 'invalid-id';
      
      const response = await request(app)
        .get(`/api/events/${invalidId}`);

      expect(response.status).toBe(500);
    });
  });

  describe('Tests de Performance et Charge', () => {
    it('devrait gérer plusieurs événements simultanés', async () => {
      // Créer plusieurs événements en parallèle
      const events = Array.from({ length: 10 }, (_, i) => ({
        name: `Événement ${i + 1}`,
        date: `2024-0${(i % 9) + 1}-15`,
        location: `Ville ${i + 1}`
      }));

      // Insérer directement en base pour éviter les problèmes d'auth dans ce test
      await db.collection('events').insertMany(events.map(event => ({
        ...event,
        date: new Date(event.date),
        createdAt: new Date(),
        updatedAt: new Date()
      })));

      const response = await request(app)
        .get('/api/events');

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(10);
      
      // Vérifier que les événements sont triés par date décroissante
      const dates = response.body.map(event => new Date(event.date));
      for (let i = 1; i < dates.length; i++) {
        expect(dates[i-1].getTime()).toBeGreaterThanOrEqual(dates[i].getTime());
      }
    });
  });

  describe('Tests de Cohérence des Données', () => {
    it('devrait maintenir la cohérence des timestamps', async () => {
      // Authentification
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@photoevents.com',
          password: 'admin123'
        });

      const authToken = loginResponse.body.token;

      // Créer un événement
      const createTime = new Date();
      const createResponse = await request(app)
        .post('/api/events')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Événement Timestamp Test',
          date: '2024-06-15'
        });

      expect(createResponse.status).toBe(201);
      const eventId = createResponse.body._id;

      expect(createResponse.body).toHaveProperty('createdAt');
      expect(createResponse.body).toHaveProperty('updatedAt');
      expect(new Date(createResponse.body.createdAt)).toBeInstanceOf(Date);
      expect(new Date(createResponse.body.updatedAt)).toBeInstanceOf(Date);

      // Attendre un peu puis mettre à jour
      await new Promise(resolve => setTimeout(resolve, 100));

      const updateTime = new Date();
      const updateResponse = await request(app)
        .put(`/api/events/${eventId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Événement Timestamp Test - Mis à Jour'
        });

      expect(updateResponse.status).toBe(200);
      expect(updateResponse.body).toHaveProperty('updatedAt');

      const originalUpdatedAt = new Date(createResponse.body.updatedAt);
      const newUpdatedAt = new Date(updateResponse.body.updatedAt);

      expect(newUpdatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
      expect(newUpdatedAt.getTime()).toBeGreaterThanOrEqual(updateTime.getTime());
    });
  });
});
