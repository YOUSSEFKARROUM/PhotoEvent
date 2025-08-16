# Script de démarrage du backend Photoevents
# Ce script configure l'environnement et démarre le serveur

Write-Host "🚀 Démarrage du backend Photoevents..." -ForegroundColor Green

# Vérifier si Node.js est installé
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js détecté: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js n'est pas installé ou n'est pas dans le PATH" -ForegroundColor Red
    Write-Host "Installez Node.js depuis https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}

# Vérifier si npm est installé
try {
    $npmVersion = npm --version
    Write-Host "✅ npm détecté: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ npm n'est pas installé ou n'est pas dans le PATH" -ForegroundColor Red
    exit 1
}

# Vérifier si les dépendances sont installées
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 Installation des dépendances..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Erreur lors de l'installation des dépendances" -ForegroundColor Red
        exit 1
    }
}

# Créer le dossier uploads s'il n'existe pas
if (-not (Test-Path "uploads")) {
    Write-Host "📁 Création du dossier uploads..." -ForegroundColor Yellow
    New-Item -ItemType Directory -Path "uploads" -Force | Out-Null
}

# Créer le dossier uploads/photos s'il n'existe pas
if (-not (Test-Path "uploads/photos")) {
    Write-Host "📁 Création du dossier uploads/photos..." -ForegroundColor Yellow
    New-Item -ItemType Directory -Path "uploads/photos" -Force | Out-Null
}

# Définir les variables d'environnement par défaut
$env:JWT_SECRET = "votre_cle_secrete_jwt_tres_longue_et_complexe_ici_par_defaut"
$env:MONGODB_URI = "mongodb://localhost:27017/photoevents"
$env:PORT = "5000"
$env:NODE_ENV = "development"
$env:REDIS_ENABLED = "false"

Write-Host "🔧 Configuration:" -ForegroundColor Cyan
Write-Host "   Port: $env:PORT" -ForegroundColor White
Write-Host "   MongoDB: $env:MONGODB_URI" -ForegroundColor White
Write-Host "   Redis: Désactivé (mode fallback)" -ForegroundColor White
Write-Host "   JWT: Utilise la clé par défaut" -ForegroundColor Yellow

Write-Host "`n⚠️  ATTENTION: En production, créez un fichier .env avec une clé JWT_SECRET unique!" -ForegroundColor Yellow

Write-Host "`n🚀 Démarrage du serveur..." -ForegroundColor Green
Write-Host "Appuyez sur Ctrl+C pour arreter le serveur" -ForegroundColor Gray

# Démarrer le serveur
npm run dev
