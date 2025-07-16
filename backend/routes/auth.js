const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { MongoClient, ObjectId } = require('mongodb');

const router = express.Router();
const uri = process.env.DATABASE_URL;
const dbName = uri.split('/').pop();

// Middleware de validation
const validateRegistration = [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('name').trim().isLength({ min: 2 })
];

const validateLogin = [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty()
];

// Inscription
router.post('/register', validateRegistration, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, name } = req.body;
    const client = new MongoClient(uri);
    await client.connect();
    const db = client.db(dbName);
    const users = db.collection('users');

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await users.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Cet email est déjà utilisé' });
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 12);

    // Créer l'utilisateur
    const userDoc = {
      email,
      password: hashedPassword,
      name,
      role: 'USER',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    const result = await users.insertOne(userDoc);
    const user = {
      id: result.insertedId,
      email: userDoc.email,
      name: userDoc.name,
      role: userDoc.role,
      createdAt: userDoc.createdAt
    };

    // Générer le token JWT
    const token = jwt.sign(
      { userId: user.id.toString(), email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.status(201).json({
      message: 'Utilisateur créé avec succès',
      user,
      token
    });
  } catch (error) {
    console.error('Erreur lors de l\'inscription:', error);
    res.status(500).json({ error: 'Erreur lors de l\'inscription' });
  } finally {
    if (typeof client !== 'undefined') await client.close();
  }
});

// Connexion
router.post('/login', validateLogin, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;
    const client = new MongoClient(uri);
    await client.connect();
    const db = client.db(dbName);
    const users = db.collection('users');

    // Trouver l'utilisateur
    const userDoc = await users.findOne({ email });
    if (!userDoc) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    }

    // Vérifier le mot de passe
    const isValidPassword = await bcrypt.compare(password, userDoc.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    }

    // Générer le token JWT
    const token = jwt.sign(
      { userId: userDoc._id, email: userDoc.email, role: userDoc.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.json({
      message: 'Connexion réussie',
      user: {
        id: userDoc._id,
        email: userDoc.email,
        name: userDoc.name,
        role: userDoc.role,
        createdAt: userDoc.createdAt
      },
      token
    });
  } catch (error) {
    console.error('Erreur lors de la connexion:', error);
    res.status(500).json({ error: 'Erreur lors de la connexion' });
  } finally {
    if (typeof client !== 'undefined') await client.close();
  }
});

// Vérifier le token (middleware)
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  console.log('[AUTH] Authorization header:', authHeader); // LOG DEBUG
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    console.error('[AUTH] Token manquant dans la requête'); // LOG DEBUG
    return res.status(401).json({ error: 'Token manquant' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      console.error('[AUTH] JWT verification error:', err);
      return res.status(403).json({ error: 'Token invalide', details: err.message });
    }
    console.log('[AUTH] JWT decoded user:', user); // LOG DEBUG
    req.user = user;
    next();
  });
};

// Route protégée pour obtenir les infos de l'utilisateur
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const client = new MongoClient(uri);
    await client.connect();
    const db = client.db(dbName);
    const users = db.collection('users');
    const user = await users.findOne({ _id: new ObjectId(req.user.userId) }, {
      projection: { password: 0 }
    });
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }
    res.json({ user });
  } catch (error) {
    console.error('Erreur lors de la récupération du profil:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération du profil' });
  } finally {
    if (typeof client !== 'undefined') await client.close();
  }
});

module.exports = { router, authenticateToken }; 