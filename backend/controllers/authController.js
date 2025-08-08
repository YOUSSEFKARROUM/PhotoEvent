import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import rateLimit from 'express-rate-limit';

/**
 * Auth Controller - Version refactorisée avec sécurité renforcée
 * 
 * Améliorations :
 * - Utilisation de Mongoose au lieu de MongoDB natif
 * - Validation des données d'entrée
 * - Rate limiting intégré
 * - Gestion d'erreurs robuste
 * - Logging sécurisé
 * - Token refresh et expiration adaptative
 */

// Rate limiting spécifique pour login
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 tentatives par IP
  message: {
    error: 'Trop de tentatives de connexion. Réessayez dans 15 minutes.',
    retryAfter: 900
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    console.warn(`[SECURITY] Rate limit dépassé pour IP: ${req.ip}`);
    res.status(429).json({
      success: false,
      message: 'Trop de tentatives de connexion. Réessayez dans 15 minutes.',
      retryAfter: 900
    });
  }
});

// Validateurs pour les données d'entrée
const loginValidation = [
  body('email')
    .isEmail()
    .withMessage('Format email invalide')
    .normalizeEmail()
    .isLength({ max: 254 })
    .withMessage('Email trop long'),
  body('password')
    .isLength({ min: 4, max: 128 })
    .withMessage('Le mot de passe doit contenir entre 4 et 128 caractères')
];

const registerValidation = [
  body('email')
    .isEmail()
    .withMessage('Format email invalide')
    .normalizeEmail()
    .isLength({ max: 254 })
    .withMessage('Email trop long'),
  body('password')
    .isLength({ min: 4, max: 128 })
    .withMessage('Le mot de passe doit contenir entre 4 et 128 caractères'),
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Le nom doit contenir entre 2 et 50 caractères')
];

/**
 * Inscription utilisateur
 * @param {Request} req - Requête Express
 * @param {Response} res - Réponse Express
 */
const register = async (req, res) => {
  try {
    // Validation des données d'entrée
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Données invalides',
        details: errors.array()
      });
    }

    const { email, password, name } = req.body;
    
    const User = (await import('../models/User.js')).default;
    
    // Vérifier si l'utilisateur existe déjà
    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Cet email est déjà utilisé'
      });
    }

    // Créer l'utilisateur
    const user = new User({
      email: email.toLowerCase().trim(),
      password,
      name: name.trim(),
      role: 'USER'
    });
    
    await user.save();

    // Générer le token JWT
    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      message: 'Utilisateur créé avec succès',
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Erreur lors de l\'inscription:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'inscription'
    });
  }
};

/**
 * Connexion utilisateur avec sécurité renforcée
 * @param {Request} req - Requête Express
 * @param {Response} res - Réponse Express
 */
const login = async (req, res) => {
  try {
    // Validation des données d'entrée
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.warn(`[AUTH] Tentative de connexion avec données invalides: ${req.body.email}`);
      return res.status(400).json({
        success: false,
        message: 'Données invalides',
        details: errors.array()
      });
    }

    const { email, password } = req.body;
    
    const User = (await import('../models/User.js')).default;
    
    // Log sécurisé (pas de mot de passe)
    console.log(`[AUTH] Tentative de connexion pour: ${email}`);

    // Recherche utilisateur avec projection optimisée
    const user = await User.findOne({ email, isActive: true, deletedAt: null }).select('+password');
    
    if (!user) {
      console.warn(`[AUTH] Utilisateur inexistant: ${email}`);
      // Délai artificiel pour éviter les attaques par timing
      await new Promise(resolve => setTimeout(resolve, 100));
      return res.status(401).json({ 
        success: false,
        message: 'Identifiants incorrects' 
      });
    }

    // Vérification du mot de passe avec timing sécurisé
    const isValidPassword = await bcrypt.compare(password, user.password);
    
    if (!isValidPassword) {
      console.warn(`[AUTH] Mot de passe incorrect pour: ${email}`);
      return res.status(401).json({ 
        success: false,
        message: 'Identifiants incorrects' 
      });
    }

    // Génération token JWT avec durée adaptative selon le rôle
    const tokenExpiry = user.role === 'ADMIN' ? '24h' : '7d';
    const payload = {
      userId: user._id,
      email: user.email,
      role: user.role,
      iat: Math.floor(Date.now() / 1000)
    };
    
    const token = jwt.sign(payload, process.env.JWT_SECRET, { 
      expiresIn: tokenExpiry,
      issuer: 'photoevents-api',
      audience: 'photoevents-client'
    });

    // Mise à jour du dernier login
    await User.updateOne(
      { _id: user._id },
      { 
        $set: { 
          lastLoginAt: new Date(),
          updatedAt: new Date()
        }
      }
    );

    console.log(`[AUTH] Connexion réussie pour: ${email}`);

    // Réponse sécurisée (pas de données sensibles)
    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        lastLoginAt: new Date()
      },
      expiresIn: tokenExpiry
    });

  } catch (error) {
    console.error('[AUTH] Erreur lors de la connexion:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la connexion'
    });
  }
};

/**
 * Récupération de l'utilisateur courant avec cache
 * @param {Request} req - Requête Express (avec req.user du middleware auth)
 * @param {Response} res - Réponse Express
 */
const getCurrentUser = async (req, res) => {
  try {
    if (!req.user || !req.user.userId) {
      return res.status(401).json({ 
        success: false,
        message: 'Token invalide ou expiré' 
      });
    }

    const User = (await import('../models/User.js')).default;

    // Recherche avec cache léger (lean query)
    const user = await User.findById(req.user.userId)
      .select('-password')
      .lean();

    if (!user) {
      console.warn(`[AUTH] Utilisateur inexistant dans token: ${req.user.userId}`);
      return res.status(404).json({ 
        success: false,
        message: 'Utilisateur non trouvé' 
      });
    }

    // Vérification de cohérence token vs DB
    if (user.email !== req.user.email) {
      console.error(`[SECURITY] Incohérence token/DB pour: ${req.user.email}`);
      return res.status(401).json({ 
        success: false,
        message: 'Token corrompu' 
      });
    }

    res.json({
      success: true,
      user: {
        ...user,
        tokenIssuedAt: new Date(req.user.iat * 1000)
      }
    });

  } catch (error) {
    console.error('[AUTH] Erreur lors de la récupération utilisateur:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};

/**
 * Déconnexion utilisateur (invalidation côté client)
 * @param {Request} req - Requête Express
 * @param {Response} res - Réponse Express
 */
const logout = async (req, res) => {
  try {
    if (req.user) {
      console.log(`[AUTH] Déconnexion pour: ${req.user.email}`);
      
      // Note: Avec JWT, la déconnexion est gérée côté client
      // En production, on pourrait implémenter une blacklist de tokens
    }
    
    res.json({
      success: true,
      message: 'Déconnexion réussie'
    });
  } catch (error) {
    console.error('[AUTH] Erreur lors de la déconnexion:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la déconnexion'
    });
  }
};

export default {
  register: [registerValidation, register],
  login: [loginLimiter, ...loginValidation, login],
  getCurrentUser,
  logout,
  loginLimiter,
  loginValidation
};
