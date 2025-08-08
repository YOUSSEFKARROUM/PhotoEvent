const request = require('supertest');
const express = require('express');
const { MongoMemoryServer } = require('mongodb-memory-server');
const { MongoClient } = require('mongodb');
const eventController = require('../controllers/eventController');

// Configuration de l'app Express pour les tests
const app = express();
app.use(express.json());

// Routes pour les tests
app.get('/api/events', eventController.getAllEvents);
app.get('/api/events/:id', eventController.getEventById);
app.post('/api/events', eventController.createEvent);
app.put('/api/events/:id', eventController.updateEvent);
app.delete('/api/events/:id', eventController.deleteEvent);

describe('Events API', () => {
  let mongoServer;
  let client;
  let db;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    process.env.MONGODB_URI = uri + 'test_events';
    
    client = new MongoClient(uri);
    await client.connect();
    db = client.db('test_events');
  });

  afterAll(async () => {
    if (client) await client.close();
    if (mongoServer) await mongoServer.stop();
  });

  beforeEach(async () => {
    // Nettoie la collection events avant chaque test
    if (db) {
      await db.collection('events').deleteMany({});
    }
  });

  describe('GET /api/events', () => {
    it('devrait retourner une liste vide si aucun événement n\'existe', async () => {
      const response = await request(app).get('/api/events');
      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });

    it('devrait retourner tous les événements', async () => {
      // Créer des événements de test
      await db.collection('events').insertMany([
        {
          name: 'Événement Test 1',
          date: new Date('2024-01-15'),
          location: 'Paris',
          description: 'Description test 1'
        },
        {
          name: 'Événement Test 2',
          date: new Date('2024-02-15'),
          location: 'Lyon',
          description: 'Description test 2'
        }
      ]);

      const response = await request(app).get('/api/events');
      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(2);
      expect(response.body[0].name).toBe('Événement Test 2'); // Plus récent en premier
    });
  });

  describe('POST /api/events', () => {
    it('devrait créer un nouvel événement', async () => {
      const eventData = {
        name: 'Nouvel Événement',
        date: '2024-03-15',
        location: 'Marseille',
        description: 'Nouvel événement de test',
        photographerEmail: 'photo@test.com'
      };

      const response = await request(app)
        .post('/api/events')
        .send(eventData);

      expect(response.status).toBe(201);
      expect(response.body.name).toBe(eventData.name);
      expect(response.body).toHaveProperty('_id');
      expect(response.body).toHaveProperty('createdAt');
      expect(response.body).toHaveProperty('updatedAt');
    });

    it('devrait créer un événement avec des données minimales', async () => {
      const eventData = {
        name: 'Événement Minimal'
      };

      const response = await request(app)
        .post('/api/events')
        .send(eventData);

      expect(response.status).toBe(201);
      expect(response.body.name).toBe(eventData.name);
    });
  });

  describe('GET /api/events/:id', () => {
    it('devrait retourner un événement spécifique par ID', async () => {
      // Créer un événement de test
      const insertResult = await db.collection('events').insertOne({
        name: 'Événement Spécifique',
        date: new Date('2024-01-15'),
        location: 'Nice'
      });
      const eventId = insertResult.insertedId;

      const response = await request(app).get(`/api/events/${eventId}`);
      expect(response.status).toBe(200);
      expect(response.body.name).toBe('Événement Spécifique');
      expect(response.body._id).toBe(eventId.toString());
    });

    it('devrait retourner 404 pour un ID inexistant', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const response = await request(app).get(`/api/events/${fakeId}`);
      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Événement non trouvé');
    });

    it('devrait retourner 500 pour un ID invalide', async () => {
      const invalidId = 'invalid-id';
      const response = await request(app).get(`/api/events/${invalidId}`);
      expect(response.status).toBe(500);
    });
  });

  describe('PUT /api/events/:id', () => {
    it('devrait mettre à jour un événement existant', async () => {
      // Créer un événement de test
      const insertResult = await db.collection('events').insertOne({
        name: 'Événement Original',
        date: new Date('2024-01-15'),
        location: 'Toulouse'
      });
      const eventId = insertResult.insertedId;

      const updateData = {
        name: 'Événement Mis à Jour',
        location: 'Bordeaux',
        description: 'Description mise à jour'
      };

      const response = await request(app)
        .put(`/api/events/${eventId}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.name).toBe('Événement Mis à Jour');
      expect(response.body.location).toBe('Bordeaux');
      expect(response.body).toHaveProperty('updatedAt');
    });

    it('devrait retourner 404 pour un ID inexistant', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const updateData = { name: 'Nouveau nom' };

      const response = await request(app)
        .put(`/api/events/${fakeId}`)
        .send(updateData);

      expect(response.status).toBe(404);
    });

    it('devrait valider l\'email du photographe', async () => {
      const insertResult = await db.collection('events').insertOne({
        name: 'Test Event',
        date: new Date('2024-01-15')
      });
      const eventId = insertResult.insertedId;

      const updateData = {
        photographerEmail: 'email-invalide'
      };

      const response = await request(app)
        .put(`/api/events/${eventId}`)
        .send(updateData);

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Email photographe invalide');
    });

    it('devrait valider le format de la date', async () => {
      const insertResult = await db.collection('events').insertOne({
        name: 'Test Event'
      });
      const eventId = insertResult.insertedId;

      const updateData = {
        date: 'date-invalide'
      };

      const response = await request(app)
        .put(`/api/events/${eventId}`)
        .send(updateData);

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Date invalide');
    });
  });

  describe('DELETE /api/events/:id', () => {
    it('devrait supprimer un événement existant', async () => {
      // Créer un événement de test
      const insertResult = await db.collection('events').insertOne({
        name: 'Événement à Supprimer',
        date: new Date('2024-01-15')
      });
      const eventId = insertResult.insertedId;

      const response = await request(app).delete(`/api/events/${eventId}`);
      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Événement supprimé avec succès');

      // Vérifier que l'événement a été supprimé
      const deletedEvent = await db.collection('events').findOne({ _id: eventId });
      expect(deletedEvent).toBeNull();
    });

    it('devrait retourner 404 pour un ID inexistant', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const response = await request(app).delete(`/api/events/${fakeId}`);
      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Événement non trouvé');
    });
  });
});
