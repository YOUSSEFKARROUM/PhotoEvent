import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env file from the same directory as this config file
dotenv.config({ path: path.join(__dirname, '.env') });

// Configuration de l'application
const config = {
  // Configuration de la base de données MongoDB
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/photoevents'
  },

  // Configuration JWT
  jwt: {
    secret: process.env.JWT_SECRET || 'votre_cle_secrete_jwt_tres_longue_et_complexe_ici_par_defaut',
    expiresIn: '24h'
  },

  // Configuration Redis
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    enabled: process.env.REDIS_ENABLED !== 'false'
  },

  // Configuration du serveur
  server: {
    port: process.env.PORT || 3001,
    env: process.env.NODE_ENV || 'development'
  },

  // Configuration des uploads
  upload: {
    path: process.env.UPLOAD_PATH || './uploads',
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 10485760 // 10MB
  },

  // Configuration DeepFace
  deepface: {
    enabled: process.env.DEEPFACE_ENABLED !== 'false'
  }
};

export default config;
