import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

// Charger les variables d'environnement
dotenv.config();

// Modèle User simplifié
const userSchema = new mongoose.Schema({
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
    select: false,
    validate: {
      validator: function(password) {
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
  
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  
  consentFacialRecognition: {
    type: Boolean,
    default: false,
    required: [true, 'Le consentement à la reconnaissance faciale est obligatoire']
  },
  
  createdAt: {
    type: Date,
    default: Date.now
  },
  
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Middleware pour hasher le mot de passe avant sauvegarde
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

const User = mongoose.model('User', userSchema);

async function createUser() {
  try {
    // Connexion à MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/photoevents';
    await mongoose.connect(mongoUri);
    console.log('✅ Connecté à MongoDB');

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await User.findOne({ email: 'kjean4386@gmail.com' });
    if (existingUser) {
      console.log('ℹ️ Utilisateur kjean4386@gmail.com existe déjà');
      return;
    }

    // Créer le nouvel utilisateur
    const newUser = new User({
      email: 'kjean4386@gmail.com',
      password: 'password123', // Sera hashé automatiquement
      name: 'Jean K',
      role: 'USER',
      consentFacialRecognition: true,
      isActive: true,
      isEmailVerified: true
    });

    await newUser.save();
    console.log('✅ Utilisateur créé avec succès:');
    console.log(`   Email: ${newUser.email}`);
    console.log(`   Nom: ${newUser.name}`);
    console.log(`   Rôle: ${newUser.role}`);
    console.log(`   Mot de passe: password123`);

  } catch (error) {
    console.error('❌ Erreur lors de la création de l\'utilisateur:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Connexion MongoDB fermée');
  }
}

// Exécuter le script
createUser();
