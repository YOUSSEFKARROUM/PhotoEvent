@echo off
echo 🚀 Démarrage rapide de Photoevents...
echo.

echo 📦 Démarrage du backend...
cd backend
start "Backend Server" cmd /k "npm run dev:minimal"
cd ..

echo ⏳ Attente de 3 secondes pour le backend...
timeout /t 3 /nobreak > nul

echo 🌐 Démarrage du frontend...
start "Frontend Dev" cmd /k "npm run dev:minimal"

echo.
echo ✅ Serveurs démarrés !
echo 📱 Frontend: http://localhost:5173
echo 🔧 Backend: http://localhost:3001
echo.
echo Appuyez sur une touche pour fermer cette fenêtre...
pause > nul 