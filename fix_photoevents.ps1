# Script de correction complète Photoevents pour Windows
param(
    [switch]$SkipPython = $false,
    [switch]$SkipRedis = $false
)

Write-Host "🚀 === CORRECTION COMPLÈTE PHOTOEVENTS (Windows) ===" -ForegroundColor Green
Write-Host ""

# Fonction pour afficher les messages colorés
function Write-Status {
    param([string]$Message)
    Write-Host "📦 $Message" -ForegroundColor Cyan
}

function Write-Success {
    param([string]$Message)
    Write-Host "✅ $Message" -ForegroundColor Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "⚠️  $Message" -ForegroundColor Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "❌ $Message" -ForegroundColor Red
}

# Vérifier que nous sommes dans le bon répertoire
if (!(Test-Path "backend")) {
    Write-Error "Dossier 'backend' non trouvé!"
    Write-Warning "Assurez-vous d'être dans le répertoire racine du projet."
    exit 1
}

Write-Status "Installation des dépendances Node.js..."
Set-Location backend
npm install bullmq@^5.1.0 ioredis@^5.3.2 node-schedule@^2.1.1
Write-Success "Dépendances Node.js installées"

if (!$SkipPython) {
    Write-Status "Installation des dépendances Python..."
    
    # Vérifier si Python est installé
    try {
        $pythonVersion = python --version 2>&1
        Write-Success "Python détecté: $pythonVersion"
    } catch {
        Write-Error "Python n'est pas installé ou n'est pas dans le PATH"
        Write-Warning "Veuillez installer Python 3.11+ depuis https://www.python.org/downloads/"
        Write-Warning "Assurez-vous de cocher 'Add Python to PATH' lors de l'installation"
        exit 1
    }
    
    # Installer les dépendances Python avec les bonnes versions
    python -m pip install --upgrade pip
    python -m pip install tensorflow==2.15.0 tf-keras==2.15.0
    python -m pip install deepface==0.0.79 opencv-python==4.8.0.76 retina-face==0.0.14
    Write-Success "Dépendances Python installées"
} else {
    Write-Warning "Installation Python ignorée"
}

Write-Status "Création du fichier .env..."
$envContent = @"
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
PYTHON_COMMAND=python
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
"@

Set-Content -Path ".env" -Value $envContent
Write-Success "Fichier .env créé"

Write-Status "Création des répertoires nécessaires..."
New-Item -ItemType Directory -Force -Path "uploads/photos" | Out-Null
New-Item -ItemType Directory -Force -Path "uploads/temp" | Out-Null
Write-Success "Répertoires créés"

if (!$SkipPython) {
    Write-Status "Vérification de l'installation DeepFace..."
    try {
        $result = python -c "import deepface; print('DeepFace OK')" 2>&1
        if ($result -like "*DeepFace OK*") {
            Write-Success "DeepFace installé correctement"
        } else {
            Write-Warning "DeepFace n'est pas installé correctement"
            Write-Warning "Les fonctionnalités de reconnaissance faciale seront limitées"
        }
    } catch {
        Write-Warning "Erreur lors de la vérification DeepFace"
    }
}

Set-Location ..

Write-Status "Installation des dépendances frontend..."
npm install
Write-Success "Dépendances frontend installées"

if (!$SkipRedis) {
    Write-Status "Vérification de Redis..."
    try {
        $redisVersion = redis-server --version 2>&1
        Write-Success "Redis détecté: $redisVersion"
    } catch {
        Write-Warning "Redis n'est pas installé"
        Write-Warning "Installez Redis pour utiliser les queues de traitement"
        Write-Warning "Windows: Téléchargez depuis https://github.com/microsoftarchive/redis/releases"
        Write-Warning "Ou utilisez WSL2 avec: sudo apt-get install redis-server"
    }
} else {
    Write-Warning "Vérification Redis ignorée"
}

Write-Status "Vérification de MongoDB..."
try {
    $mongoVersion = mongod --version 2>&1
    Write-Success "MongoDB détecté: $mongoVersion"
} catch {
    Write-Warning "MongoDB n'est pas installé"
    Write-Warning "Installez MongoDB pour la base de données"
    Write-Warning "Windows: Téléchargez depuis https://www.mongodb.com/try/download/community"
    Write-Warning "Ou utilisez MongoDB Atlas (cloud)"
}

Write-Host ""
Write-Success "=== CORRECTION TERMINÉE ==="
Write-Host ""
Write-Host "📋 Prochaines étapes :" -ForegroundColor Yellow
Write-Host ""
Write-Host "1️⃣ Démarrer MongoDB :" -ForegroundColor White
Write-Host "   mongod" -ForegroundColor Gray
Write-Host ""
if (!$SkipRedis) {
    Write-Host "2️⃣ Démarrer Redis :" -ForegroundColor White
    Write-Host "   redis-server" -ForegroundColor Gray
    Write-Host ""
    Write-Host "3️⃣ Démarrer le worker de traitement :" -ForegroundColor White
    Write-Host "   cd backend && npm run worker" -ForegroundColor Gray
    Write-Host ""
    Write-Host "4️⃣ Démarrer le serveur backend :" -ForegroundColor White
    Write-Host "   cd backend && npm run dev" -ForegroundColor Gray
    Write-Host ""
    Write-Host "5️⃣ Démarrer le frontend :" -ForegroundColor White
    Write-Host "   npm run dev" -ForegroundColor Gray
} else {
    Write-Host "2️⃣ Démarrer le serveur backend :" -ForegroundColor White
    Write-Host "   cd backend && npm run dev" -ForegroundColor Gray
    Write-Host ""
    Write-Host "3️⃣ Démarrer le frontend :" -ForegroundColor White
    Write-Host "   npm run dev" -ForegroundColor Gray
}
Write-Host ""
Write-Host "🔑 Identifiants par défaut :" -ForegroundColor Yellow
Write-Host "   Email: admin@photoevents.com" -ForegroundColor Gray
Write-Host "   Mot de passe: admin123" -ForegroundColor Gray
Write-Host ""
Write-Host "📊 URLs :" -ForegroundColor Yellow
Write-Host "   Frontend: http://localhost:5173" -ForegroundColor Gray
Write-Host "   Backend: http://localhost:3001" -ForegroundColor Gray
Write-Host "   Health check: http://localhost:3001/api/health" -ForegroundColor Gray
Write-Host ""
Write-Success "Toutes les corrections ont été appliquées !" 