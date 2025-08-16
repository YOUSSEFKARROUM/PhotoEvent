import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Charger les variables d'environnement
dotenv.config();

// Modèle User
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
  consentFacialRecognition: {
    type: Boolean,
    default: false
  },
  consentFacialRecognitionDate: {
    type: Date,
    default: null
  }
});

const User = mongoose.model('User', userSchema);

async function checkAndUpdateConsent() {
  try {
    // Connexion à MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/photoevents');
    console.log('✅ Connecté à MongoDB');

    // Chercher l'utilisateur admin
    const adminUser = await User.findOne({ email: 'admin@photoevents.com' });
    
    if (!adminUser) {
      console.log('❌ Utilisateur admin@photoevents.com non trouvé');
      return;
    }

    console.log('👤 Utilisateur trouvé:', adminUser.email);
    console.log('🔒 Consentement actuel:', adminUser.consentFacialRecognition);

    // Mettre à jour le consentement si nécessaire
    if (!adminUser.consentFacialRecognition) {
      adminUser.consentFacialRecognition = true;
      adminUser.consentFacialRecognitionDate = new Date();
      await adminUser.save();
      console.log('✅ Consentement RGPD mis à jour pour admin@photoevents.com');
    } else {
      console.log('✅ Consentement RGPD déjà accordé');
    }

    // Afficher les détails
    console.log('📊 Détails du consentement:');
    console.log('  - Consentement facial:', adminUser.consentFacialRecognition);
    console.log('  - Date du consentement:', adminUser.consentFacialRecognitionDate);

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Déconnecté de MongoDB');
  }
}

// Exécuter le script
checkAndUpdateConsent();
