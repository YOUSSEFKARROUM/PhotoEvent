Write-Host "🚀 Démarrage COMPLET de Photoevents..." -ForegroundColor Green
Write-Host ""

# Vérifier que nous sommes dans le bon répertoire
if (!(Test-Path "backend")) {
    Write-Host "❌ Erreur: Dossier 'backend' non trouvé!" -ForegroundColor Red
    Write-Host "Assurez-vous d'être dans le répertoire racine du projet." -ForegroundColor Yellow
    exit 1
}

# Étape 1: Configuration du backend
Write-Host "🔧 Étape 1: Configuration du backend..." -ForegroundColor Cyan

# Créer le fichier .env s'il n'existe pas
if (!(Test-Path "backend\.env")) {
    Write-Host "📝 Création du fichier .env..." -ForegroundColor Yellow
    Set-Content -Path "backend\.env" -Value @"
JWT_SECRET=photoevents-super-secret-jwt-key-2024-development-only
NODE_ENV=development
PORT=3001
MONGODB_URI=mongodb://localhost:27017/photoevents
"@
    Write-Host "✅ Fichier .env créé!" -ForegroundColor Green
}

# Étape 2: Réinitialiser le mot de passe admin
Write-Host "🔑 Étape 2: Réinitialisation du mot de passe admin..." -ForegroundColor Cyan
Set-Location backend
node reset_admin_password.js
Set-Location ..

# Étape 3: Créer le favicon
Write-Host "🎨 Étape 3: Configuration du favicon..." -ForegroundColor Cyan
if (!(Test-Path "public\favicon.ico")) {
    Set-Content -Path "public\favicon.ico" -Value "<!-- Favicon placeholder -->"
    Write-Host "✅ Favicon créé!" -ForegroundColor Green
}

# Étape 4: Démarrer le backend
Write-Host "📦 Étape 4: Démarrage du backend..." -ForegroundColor Cyan
Set-Location backend
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm run dev:ultra" -WindowStyle Normal
Set-Location ..

Write-Host "⏳ Attente de 3 secondes pour le backend..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

# Étape 5: Tester l'authentification
Write-Host "🔍 Étape 5: Test de l'authentification..." -ForegroundColor Cyan
Set-Location backend
node test_auth_simple.js
Set-Location ..

# Étape 6: Démarrer le frontend
Write-Host "🌐 Étape 6: Démarrage du frontend..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm run dev:fast" -WindowStyle Normal

Write-Host ""
Write-Host "✅ DÉMARRAGE COMPLET TERMINÉ !" -ForegroundColor Green
Write-Host ""
Write-Host "📱 Frontend: http://localhost:5173" -ForegroundColor Blue
Write-Host "🔧 Backend: http://localhost:3001" -ForegroundColor Blue
Write-Host "📊 Health check: http://localhost:3001/api/health" -ForegroundColor Blue
Write-Host ""
Write-Host "🔑 Identifiants de connexion:" -ForegroundColor Yellow
Write-Host "   Email: admin@photoevents.com" -ForegroundColor Gray
Write-Host "   Mot de passe: admin123" -ForegroundColor Gray
Write-Host ""
Write-Host "💡 Les serveurs sont maintenant prêts !" -ForegroundColor Green
Write-Host "Appuyez sur une touche pour fermer cette fenêtre..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown") 