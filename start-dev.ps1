Write-Host "🚀 Démarrage rapide de Photoevents..." -ForegroundColor Green
Write-Host ""

Write-Host "📦 Démarrage du backend..." -ForegroundColor Yellow
Set-Location backend
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm run dev:ultra" -WindowStyle Normal
Set-Location ..

Write-Host "⏳ Attente de 2 secondes pour le backend..." -ForegroundColor Cyan
Start-Sleep -Seconds 2

Write-Host "🌐 Démarrage du frontend..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm run dev:fast" -WindowStyle Normal

Write-Host ""
Write-Host "✅ Serveurs démarrés !" -ForegroundColor Green
Write-Host "📱 Frontend: http://localhost:5173" -ForegroundColor Blue
Write-Host "🔧 Backend: http://localhost:3001" -ForegroundColor Blue
Write-Host ""
Write-Host "Appuyez sur une touche pour fermer cette fenêtre..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown") 