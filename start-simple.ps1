Write-Host "🚀 Démarrage simple de Photoevents..." -ForegroundColor Green
Write-Host ""

# Démarrage du backend
Write-Host "📦 Démarrage du backend..." -ForegroundColor Yellow
Set-Location backend
$env:NODE_ENV = "development"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "nodemon --ignore uploads/* --ignore *.log --ignore tests/* server.js" -WindowStyle Normal
Set-Location ..

# Attendre un peu
Write-Host "⏳ Attente de 3 secondes..." -ForegroundColor Cyan
Start-Sleep -Seconds 3

# Démarrage du frontend
Write-Host "🌐 Démarrage du frontend..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm run dev" -WindowStyle Normal

Write-Host ""
Write-Host "✅ Serveurs démarrés !" -ForegroundColor Green
Write-Host "📱 Frontend: http://localhost:5173" -ForegroundColor Blue
Write-Host "🔧 Backend: http://localhost:3001" -ForegroundColor Blue
Write-Host ""
Write-Host "Appuyez sur une touche pour fermer cette fenêtre..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown") 