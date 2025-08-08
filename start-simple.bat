@echo off
echo 🚀 Démarrage simple de Photoevents...
echo.

echo 📦 Démarrage du backend...
cd backend
set NODE_ENV=development
start "Backend Server" cmd /k "nodemon --ignore uploads/* --ignore *.log --ignore tests/* server.js"
cd ..

echo ⏳ Attente de 3 secondes...
timeout /t 3 /nobreak > nul

echo 🌐 Démarrage du frontend...
start "Frontend Dev" cmd /k "npm run dev"

echo.
echo ✅ Serveurs démarrés !
echo 📱 Frontend: http://localhost:5173
echo 🔧 Backend: http://localhost:3001
echo.
echo Appuyez sur une touche pour fermer cette fenêtre...
pause > nul 