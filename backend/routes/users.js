const express = require('express');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const { MongoClient, ObjectId } = require('mongodb');
const { authenticateToken } = require('./auth');

const router = express.Router();
const uri = process.env.DATABASE_URL;
const client = new MongoClient(uri);
const dbName = uri.split('/').pop();

// Middleware de validation
const validateUserUpdate = [
  body('name').optional().trim().isLength({ min: 2 }),
  body('email').optional().isEmail().normalizeEmail(),
  body('role').optional().isIn(['USER', 'ADMIN', 'PHOTOGRAPHER'])
];

// Obtenir tous les utilisateurs (admin seulement)
router.get('/', authenticateToken, async (req, res) => {
  try {
    // Vérifier si l'utilisateur est admin
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Accès refusé' });
    }

    await client.connect();
    const db = client.db(dbName);
    const usersCollection = db.collection('users');

    const users = await usersCollection.find({}).toArray();

    res.json(users);

  } catch (error) {
    console.error('Erreur lors de la récupération des utilisateurs:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des utilisateurs' });
  } finally {
    await client.close();
  }
});

// Obtenir un utilisateur par ID (admin seulement)
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    // Vérifier si l'utilisateur est admin
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Accès refusé' });
    }

    const { id } = req.params;

    await client.connect();
    const db = client.db(dbName);
    const usersCollection = db.collection('users');

    const user = await usersCollection.findOne({ _id: new ObjectId(id) });

    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    res.json(user);

  } catch (error) {
    console.error('Erreur lors de la récupération de l\'utilisateur:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération de l\'utilisateur' });
  } finally {
    await client.close();
  }
});

// Modifier un utilisateur (admin seulement)
router.put('/:id', authenticateToken, validateUserUpdate, async (req, res) => {
  try {
    // Vérifier si l'utilisateur est admin
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Accès refusé' });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { name, email, role } = req.body;

    await client.connect();
    const db = client.db(dbName);
    const usersCollection = db.collection('users');

    // Vérifier si l'utilisateur existe
    const existingUser = await usersCollection.findOne({ _id: new ObjectId(id) });

    if (!existingUser) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    // Vérifier si l'email est déjà utilisé (si modifié)
    if (email && email !== existingUser.email) {
      const emailExists = await usersCollection.findOne({ email });

      if (emailExists) {
        return res.status(400).json({ error: 'Cet email est déjà utilisé' });
      }
    }

    const user = await usersCollection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: { name, email, role } },
      { returnDocument: 'after' }
    );

    res.json({
      message: 'Utilisateur modifié avec succès',
      user: user.value
    });

  } catch (error) {
    console.error('Erreur lors de la modification de l\'utilisateur:', error);
    res.status(500).json({ error: 'Erreur lors de la modification de l\'utilisateur' });
  } finally {
    await client.close();
  }
});

// Modifier son propre profil (utilisateur connecté)
router.put('/me', authenticateToken, async (req, res) => {
  try {
    console.log('--- [PUT /api/users/me] --- LOGIQUE NORMALE SANS 403');
    const { name, email, reference_face_data, consent_given, consent_date } = req.body;
    await client.connect();
    const db = client.db(dbName);
    const usersCollection = db.collection('users');

    // Mise à jour sans aucun contrôle d'ID
    const updateFields = {};
    if (name) updateFields.name = name;
    if (email) updateFields.email = email;
    if (reference_face_data) updateFields.reference_face_data = reference_face_data;
    if (typeof consent_given !== 'undefined') updateFields.consent_given = consent_given;
    if (consent_date) updateFields.consent_date = consent_date;
    updateFields.updatedAt = new Date();

    const user = await usersCollection.findOneAndUpdate(
      { _id: new ObjectId(req.user.userId) },
      { $set: updateFields },
      { returnDocument: 'after' }
    );

    res.json({
      message: 'Profil utilisateur modifié avec succès (aucun 403 possible)',
      user: user.value
    });
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la modification du profil utilisateur' });
  } finally {
    await client.close();
  }
});

// Supprimer un utilisateur (admin seulement)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    // Vérifier si l'utilisateur est admin
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Accès refusé' });
    }

    const { id } = req.params;

    await client.connect();
    const db = client.db(dbName);
    const usersCollection = db.collection('users');

    // Vérifier si l'utilisateur existe
    const existingUser = await usersCollection.findOne({ _id: new ObjectId(id) });

    if (!existingUser) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    // Empêcher la suppression de son propre compte
    if (id === req.user.userId) {
      return res.status(400).json({ error: 'Vous ne pouvez pas supprimer votre propre compte' });
    }

    await usersCollection.deleteOne({ _id: new ObjectId(id) });

    res.json({ message: 'Utilisateur supprimé avec succès' });

  } catch (error) {
    console.error('Erreur lors de la suppression de l\'utilisateur:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression de l\'utilisateur' });
  } finally {
    await client.close();
  }
});

module.exports = router; 