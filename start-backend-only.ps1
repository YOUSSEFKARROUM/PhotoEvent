Write-Host "🔧 Démarrage du backend Photoevents..." -ForegroundColor Green
Write-Host ""

# Vérifier que nous sommes dans le bon répertoire
if (!(Test-Path "backend")) {
    Write-Host "❌ Erreur: Dossier 'backend' non trouvé!" -ForegroundColor Red
    Write-Host "Assurez-vous d'être dans le répertoire racine du projet." -ForegroundColor Yellow
    exit 1
}

# Vérifier que le fichier .env existe
if (!(Test-Path "backend\.env")) {
    Write-Host "❌ Erreur: Fichier .env manquant dans le backend!" -ForegroundColor Red
    Write-Host "Création du fichier .env..." -ForegroundColor Yellow
    
    Set-Content -Path "backend\.env" -Value @"
JWT_SECRET=photoevents-super-secret-jwt-key-2024-development-only
NODE_ENV=development
PORT=3001
MONGODB_URI=mongodb://localhost:27017/photoevents
"@
    Write-Host "✅ Fichier .env créé!" -ForegroundColor Green
}

# Aller dans le dossier backend
Set-Location backend

Write-Host "📦 Installation des dépendances..." -ForegroundColor Cyan
npm install

Write-Host "🚀 Démarrage du serveur backend..." -ForegroundColor Yellow
Write-Host "Port: 3001" -ForegroundColor Gray
Write-Host "Health check: http://localhost:3001/api/health" -ForegroundColor Gray
Write-Host ""

# Démarrer le serveur
npm run dev:ultra

Write-Host ""
Write-Host "Appuyez sur Ctrl+C pour arrêter le serveur..." -ForegroundColor Gray 