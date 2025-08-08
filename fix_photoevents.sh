#!/bin/bash
set -e

echo "🚀 === CORRECTION COMPLÈTE PHOTOEVENTS ==="
echo ""

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonction pour afficher les messages colorés
print_status() {
    echo -e "${BLUE}📦 $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Vérifier que nous sommes dans le bon répertoire
if [ ! -d "backend" ]; then
    print_error "Dossier 'backend' non trouvé!"
    print_warning "Assurez-vous d'être dans le répertoire racine du projet."
    exit 1
fi

print_status "Installation des dépendances Node.js..."
cd backend
npm install bullmq@^5.1.0 ioredis@^5.3.2 node-schedule@^2.1.1
print_success "Dépendances Node.js installées"

print_status "Installation des dépendances Python..."
# Vérifier si Python est installé
if ! command -v python3 &> /dev/null; then
    print_error "Python 3 n'est pas installé"
    print_warning "Veuillez installer Python 3.11+ avant de continuer"
    exit 1
fi

# Installer les dépendances Python avec les bonnes versions
python3 -m pip install --upgrade pip
python3 -m pip install tensorflow==2.15.0 tf-keras==2.15.0
python3 -m pip install deepface==0.0.79 opencv-python==4.8.0.76 retina-face==0.0.14
print_success "Dépendances Python installées"

print_status "Création du fichier .env..."
cat > .env << EOT
# Configuration du serveur
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# Base de données MongoDB
MONGODB_URI=mongodb://localhost:27017/photoevents

# Sécurité JWT
JWT_SECRET=photoevents-super-secret-jwt-key-2024-development-only-change-in-production
JWT_EXPIRES_IN=7d

# Redis pour les queues
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Python et DeepFace
PYTHON_COMMAND=python3
FACE_RECOGNITION_DEBUG=true
FACE_RECOGNITION_THRESHOLD=0.7

# Cloudinary (optionnel)
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# Logs et monitoring
LOG_LEVEL=info
ENABLE_METRICS=true

# Limites et timeouts
MAX_FILE_SIZE=52428800
UPLOAD_TIMEOUT=300000
FACE_RECOGNITION_TIMEOUT=300000

# Nettoyage automatique
CLEANUP_TEMP_FILES_AGE=24
CLEANUP_ORPHAN_FILES_ENABLED=true
CLEANUP_OLD_PENDING_PHOTOS_ENABLED=true
EOT
print_success "Fichier .env créé"

print_status "Création des répertoires nécessaires..."
mkdir -p uploads/photos uploads/temp
print_success "Répertoires créés"

print_status "Vérification de l'installation DeepFace..."
if python3 -c "import deepface; print('DeepFace OK')" 2>/dev/null; then
    print_success "DeepFace installé correctement"
else
    print_warning "DeepFace n'est pas installé correctement"
    print_warning "Les fonctionnalités de reconnaissance faciale seront limitées"
fi

cd ..

print_status "Installation des dépendances frontend..."
npm install
print_success "Dépendances frontend installées"

print_status "Vérification de Redis..."
if command -v redis-server &> /dev/null; then
    print_success "Redis détecté"
else
    print_warning "Redis n'est pas installé"
    print_warning "Installez Redis pour utiliser les queues de traitement"
    print_warning "Ubuntu/Debian: sudo apt-get install redis-server"
    print_warning "macOS: brew install redis"
    print_warning "Windows: Téléchargez depuis https://redis.io/download"
fi

print_status "Vérification de MongoDB..."
if command -v mongod &> /dev/null; then
    print_success "MongoDB détecté"
else
    print_warning "MongoDB n'est pas installé"
    print_warning "Installez MongoDB pour la base de données"
    print_warning "Ubuntu/Debian: sudo apt-get install mongodb"
    print_warning "macOS: brew install mongodb/brew/mongodb-community"
    print_warning "Windows: Téléchargez depuis https://www.mongodb.com/try/download/community"
fi

echo ""
print_success "=== CORRECTION TERMINÉE ==="
echo ""
echo "📋 Prochaines étapes :"
echo ""
echo "1️⃣ Démarrer Redis :"
echo "   redis-server"
echo ""
echo "2️⃣ Démarrer MongoDB :"
echo "   mongod"
echo ""
echo "3️⃣ Démarrer le worker de traitement :"
echo "   cd backend && npm run worker"
echo ""
echo "4️⃣ Démarrer le serveur backend :"
echo "   cd backend && npm run dev"
echo ""
echo "5️⃣ Démarrer le frontend :"
echo "   npm run dev"
echo ""
echo "🔑 Identifiants par défaut :"
echo "   Email: admin@photoevents.com"
echo "   Mot de passe: admin123"
echo ""
echo "📊 URLs :"
echo "   Frontend: http://localhost:5173"
echo "   Backend: http://localhost:3001"
echo "   Health check: http://localhost:3001/api/health"
echo ""
print_success "Toutes les corrections ont été appliquées !" 