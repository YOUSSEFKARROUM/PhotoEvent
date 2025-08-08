const request = require('supertest');
const app = require('../app');

// Tests pour l'authentification

describe('Auth API', () => {
  describe('POST /api/auth/login', () => {
    it('devrait retourner une erreur si l\'utilisateur n\'existe pas', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'unknown@domain.com', password: 'password' });
      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Email ou mot de passe incorrect');
    });

    it('devrait authentifier un utilisateur existant', async () => {
      // Créer un utilisateur avant le test
      const user = { email: 'test@domain.com', password: 'password', name: 'Test User' };
      await request(app).post('/api/auth/register').send(user);

      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: user.email, password: user.password });
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
    });
  });
});
