import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

/**
 * Modèle User refactorisé avec sécurité renforcée et fonctionnalités avancées
 * 
 * Améliorations :
 * - Validation stricte des données
 * - Hachage automatique des mots de passe
 * - Gestion des tentatives de connexion
 * - Support de la reconnaissance faciale
 * - Hooks de sécurité
 * - Index optimisés
 * - Méthodes utilitaires intégrées
 * - Conformité RGPD avec consentement explicite
 */

const userSchema = new mongoose.Schema({
  // Informations de base
  email: {
    type: String,
    required: [true, 'L\'email est obligatoire'],
    unique: true,
    lowercase: true,
    trim: true,
    index: true,
    validate: {
      validator: function(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      },
      message: 'Format d\'email invalide'
    },
    maxlength: [254, 'Email trop long']
  },
  
  password: {
    type: String,
    required: [true, 'Le mot de passe est requis'],
    minlength: [4, 'Le mot de passe doit contenir au moins 4 caractères'],
    maxlength: [128, 'Mot de passe trop long'],
    select: false, // Masqué par défaut dans les requêtes
    validate: {
      validator: function(password) {
        // Au moins une lettre et un chiffre OU au moins 6 caractères
        return /^(?=.*[A-Za-z])(?=.*\d).{4,}$/.test(password) || password.length >= 6;
      },
      message: 'Le mot de passe doit contenir au moins une lettre et un chiffre, ou faire au moins 6 caractères'
    }
  },
  
  name: {
    type: String,
    required: [true, 'Le nom est requis'],
    trim: true,
    minlength: [2, 'Le nom doit contenir au moins 2 caractères'],
    maxlength: [50, 'Le nom ne peut pas dépasser 50 caractères']
  },
  
  role: {
    type: String,
    enum: {
      values: ['USER', 'ADMIN', 'PHOTOGRAPHER', 'GUEST'],
      message: 'Rôle invalide'
    },
    default: 'USER',
    index: true
  },
  
  // Sécurité et authentification
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  
  emailVerificationToken: {
    type: String,
    select: false
  },
  
  emailVerificationExpires: {
    type: Date,
    select: false
  },
  
  passwordResetToken: {
    type: String,
    select: false
  },
  
  passwordResetExpires: {
    type: Date,
    select: false
  },
  
  passwordChangedAt: {
    type: Date,
    default: Date.now
  },
  
  // Tentatives de connexion (sécurité anti-bruteforce)
  loginAttempts: {
    type: Number,
    default: 0,
    select: false
  },
  
  lockUntil: {
    type: Date,
    select: false
  },
  
  lastLoginAt: {
    type: Date,
    default: null
  },
  
  lastLoginIP: {
    type: String,
    default: null
  },
  
  // Reconnaissance faciale
  referenceFaceEncoding: {
    type: [Number],
    default: null,
    select: false // Sensible : masqué par défaut
  },
  
  referenceFaceModel: {
    type: String,
    enum: ['Facenet', 'Facenet512', 'OpenFace', 'DeepFace', 'DeepID', 'Dlib', 'ArcFace', 'fallback'],
    default: null
  },
  
  faceEncodingUpdatedAt: {
    type: Date,
    default: null
  },
  
  // Conformité RGPD - Consentement explicite pour la reconnaissance faciale
  consentFacialRecognition: {
    type: Boolean,
    default: false,
    required: [true, 'Le consentement à la reconnaissance faciale est obligatoire']
  },
  
  consentFacialRecognitionDate: {
    type: Date,
    default: null
  },
  
  consentFacialRecognitionIP: {
    type: String,
    default: null
  },
  
  // Préférences utilisateur
  preferences: {
    language: {
      type: String,
      enum: ['fr', 'en', 'es', 'de'],
      default: 'fr'
    },
    notifications: {
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: true },
      sms: { type: Boolean, default: false }
    },
    privacy: {
      profileVisible: { type: Boolean, default: true },
      allowFaceRecognition: { type: Boolean, default: true },
      dataRetention: { type: Boolean, default: true }
    }
  },
  
  // Métadonnées
  createdAt: {
    type: Date,
    default: Date.now,
    immutable: true // Empêche la modification après création
  },
  
  updatedAt: {
    type: Date,
    default: Date.now
  },
  
  deletedAt: {
    type: Date,
    default: null,
    select: false // Soft delete
  }
}, {
  // Options du schéma
  timestamps: false, // Nous gérons manuellement
  versionKey: false, // Supprime __v
  toJSON: {
    transform: function(doc, ret) {
      // Nettoyage des données sensibles dans les réponses JSON
      delete ret.password;
      delete ret.loginAttempts;
      delete ret.lockUntil;
      delete ret.passwordResetToken;
      delete ret.passwordResetExpires;
      delete ret.emailVerificationToken;
      delete ret.emailVerificationExpires;
      delete ret.referenceFaceEncoding;
      delete ret.deletedAt;
      return ret;
    }
  }
});

// Index composés pour les performances
userSchema.index({ email: 1, isActive: 1 });
userSchema.index({ role: 1, isActive: 1 });
userSchema.index({ createdAt: -1 });
userSchema.index({ lastLoginAt: -1 });
userSchema.index({ consentFacialRecognition: 1 }); // Index pour les requêtes RGPD

// Index de texte pour la recherche
userSchema.index({ name: 'text', email: 'text' });

// Propriété virtuelle pour vérifier si le compte est verrouillé
userSchema.virtual('isLocked').get(function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

// MIDDLEWARE PRE-SAVE : Hachage automatique du mot de passe
userSchema.pre('save', async function(next) {
  // Mise à jour du timestamp
  this.updatedAt = new Date();
  
  // Ne hasher que si le mot de passe a été modifié
  if (!this.isModified('password')) return next();
  
  try {
    // Hash avec salt fort (coût 12)
    this.password = await bcrypt.hash(this.password, 12);
    this.passwordChangedAt = new Date();
    next();
  } catch (error) {
    next(error);
  }
});

// MIDDLEWARE PRE-SAVE : Génération de tokens de vérification
userSchema.pre('save', function(next) {
  if (this.isNew && !this.emailVerificationToken) {
    this.emailVerificationToken = crypto.randomBytes(32).toString('hex');
    this.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h
  }
  next();
});

// MIDDLEWARE PRE-SAVE : Mise à jour du consentement facial
userSchema.pre('save', function(next) {
  if (this.isModified('consentFacialRecognition') && this.consentFacialRecognition) {
    this.consentFacialRecognitionDate = new Date();
    // Note: IP sera mise à jour dans le controller
  }
  next();
});

// MÉTHODES INSTANCE

/**
 * Vérification du mot de passe avec gestion des tentatives
 * @param {string} candidatePassword - Mot de passe à vérifier
 * @returns {Promise<boolean>} - True si le mot de passe est correct
 */
userSchema.methods.comparePassword = async function(candidatePassword) {
  if (!this.password) {
    throw new Error('Mot de passe non disponible');
  }
  return await bcrypt.compare(candidatePassword, this.password);
};

/**
 * Incrémentation des tentatives de connexion échouées
 */
userSchema.methods.incrementLoginAttempts = async function() {
  // Si on a un verrou et qu'il a expiré, on le supprime
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $unset: { lockUntil: 1 },
      $set: { loginAttempts: 1 }
    });
  }
  
  const updates = { $inc: { loginAttempts: 1 } };
  
  // Verrouillage après 5 tentatives
  if (this.loginAttempts + 1 >= 5 && !this.isLocked) {
    updates.$set = {
      lockUntil: Date.now() + 30 * 60 * 1000 // Verrouillage 30 minutes
    };
  }
  
  return this.updateOne(updates);
};

/**
 * Réinitialisation des tentatives après connexion réussie
 */
userSchema.methods.resetLoginAttempts = function() {
  return this.updateOne({
    $unset: { loginAttempts: 1, lockUntil: 1 },
    $set: { 
      lastLoginAt: new Date(),
      lastLoginIP: this.lastLoginIP
    }
  });
};

/**
 * Génération d'un token de réinitialisation de mot de passe
 * @returns {string} - Token de réinitialisation
 */
userSchema.methods.generatePasswordResetToken = function() {
  const resetToken = crypto.randomBytes(32).toString('hex');
  
  // Hash du token pour la sécurité
  this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  this.passwordResetExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
  
  return resetToken;
};

/**
 * Vérification si le token JWT est encore valide
 * @param {number} JWTTimestamp - Timestamp du token JWT
 * @returns {boolean} - True si le token est valide
 */
userSchema.methods.isJWTValid = function(JWTTimestamp) {
  if (!this.passwordChangedAt) return true;
  
  const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
  return JWTTimestamp > changedTimestamp;
};

/**
 * Mise à jour du consentement facial avec IP
 * @param {string} ip - Adresse IP de l'utilisateur
 */
userSchema.methods.updateFacialConsent = function(ip) {
  this.consentFacialRecognition = true;
  this.consentFacialRecognitionDate = new Date();
  this.consentFacialRecognitionIP = ip;
  return this.save();
};

// MÉTHODES STATIQUES

/**
 * Recherche sécurisée d'utilisateur par email
 * @param {string} email - Email à rechercher
 * @returns {Promise<User|null>} - Utilisateur trouvé ou null
 */
userSchema.statics.findByEmail = function(email) {
  return this.findOne({ 
    email: email.toLowerCase().trim(),
    isActive: true,
    deletedAt: null
  });
};

/**
 * Recherche avec encodage facial
 * @param {string} userId - ID de l'utilisateur
 * @returns {Promise<User|null>} - Utilisateur avec encodage facial
 */
userSchema.statics.findWithFaceEncoding = function(userId) {
  return this.findById(userId).select('+referenceFaceEncoding +referenceFaceModel');
};

/**
 * Statistiques des utilisateurs
 * @returns {Promise<Object>} - Statistiques
 */
userSchema.statics.getStats = function() {
  return this.aggregate([
    {
      $group: {
        _id: null,
        totalUsers: { $sum: 1 },
        activeUsers: { $sum: { $cond: ['$isActive', 1, 0] } },
        adminUsers: { $sum: { $cond: [{ $eq: ['$role', 'ADMIN'] }, 1, 0] } },
        verifiedUsers: { $sum: { $cond: ['$isEmailVerified', 1, 0] } },
        usersWithFaceData: { $sum: { $cond: [{ $ne: ['$referenceFaceEncoding', null] }, 1, 0] } },
        usersWithConsent: { $sum: { $cond: ['$consentFacialRecognition', 1, 0] } }
      }
    }
  ]);
};

/**
 * Utilisateurs avec consentement facial
 * @returns {Promise<User[]>} - Liste des utilisateurs avec consentement
 */
userSchema.statics.findWithFacialConsent = function() {
  return this.find({ 
    consentFacialRecognition: true,
    isActive: true,
    deletedAt: null
  });
};

export default mongoose.model('User', userSchema);
