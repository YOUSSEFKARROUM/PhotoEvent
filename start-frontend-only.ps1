Write-Host "🌐 Démarrage du frontend Photoevents..." -ForegroundColor Green
Write-Host ""

# Vérifier que nous sommes dans le bon répertoire
if (!(Test-Path "package.json")) {
    Write-Host "❌ Erreur: package.json non trouvé!" -ForegroundColor Red
    Write-Host "Assurez-vous d'être dans le répertoire racine du projet." -ForegroundColor Yellow
    exit 1
}

Write-Host "📦 Installation des dépendances..." -ForegroundColor Cyan
npm install

Write-Host "🚀 Démarrage du serveur de développement..." -ForegroundColor Yellow
Write-Host "Port: 5173" -ForegroundColor Gray
Write-Host "URL: http://localhost:5173" -ForegroundColor Gray
Write-Host ""

# Démarrer le serveur de développement
npm run dev:fast

Write-Host ""
Write-Host "Appuyez sur Ctrl+C pour arrêter le serveur..." -ForegroundColor Gray 