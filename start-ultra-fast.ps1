Write-Host "⚡ Démarrage ULTRA-RAPIDE de Photoevents..." -ForegroundColor Green
Write-Host ""

# Optimisations système
Write-Host "🔧 Optimisations système..." -ForegroundColor Cyan
$env:NODE_ENV = "development"
$env:NODE_OPTIONS = "--max-old-space-size=2048"

Write-Host "📦 Démarrage du backend (ultra-rapide)..." -ForegroundColor Yellow
Set-Location backend
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm run dev:ultra" -WindowStyle Normal
Set-Location ..

Write-Host "⏳ Attente de 1 seconde pour le backend..." -ForegroundColor Cyan
Start-Sleep -Seconds 1

Write-Host "🌐 Démarrage du frontend (ultra-rapide)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm run dev:fast" -WindowStyle Normal

Write-Host ""
Write-Host "✅ Serveurs démarrés en mode ULTRA-RAPIDE !" -ForegroundColor Green
Write-Host "📱 Frontend: http://localhost:5173" -ForegroundColor Blue
Write-Host "🔧 Backend: http://localhost:3001" -ForegroundColor Blue
Write-Host ""
Write-Host "💡 Conseils pour des redémarrages encore plus rapides:" -ForegroundColor Yellow
Write-Host "   - Fermez les onglets inutiles du navigateur" -ForegroundColor Gray
Write-Host "   - Désactivez les extensions de développement" -ForegroundColor Gray
Write-Host "   - Utilisez un SSD pour de meilleures performances" -ForegroundColor Gray
Write-Host ""
Write-Host "Appuyez sur une touche pour fermer cette fenêtre..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown") 