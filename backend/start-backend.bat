@echo off
chcp 65001 >nul
echo 🚀 Démarrage du backend Photoevents...

REM Vérifier si Node.js est installé
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js n'est pas installé ou n'est pas dans le PATH
    echo Installez Node.js depuis https://nodejs.org/
    pause
    exit /b 1
)

REM Vérifier si npm est installé
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ npm n'est pas installé ou n'est pas dans le PATH
    pause
    exit /b 1
)

REM Vérifier si les dépendances sont installées
if not exist "node_modules" (
    echo 📦 Installation des dépendances...
    npm install
    if %errorlevel% neq 0 (
        echo ❌ Erreur lors de l'installation des dépendances
        pause
        exit /b 1
    )
)

REM Créer le dossier uploads s'il n'existe pas
if not exist "uploads" (
    echo 📁 Création du dossier uploads...
    mkdir uploads
)

REM Créer le dossier uploads/photos s'il n'existe pas
if not exist "uploads\photos" (
    echo 📁 Création du dossier uploads/photos...
    mkdir uploads\photos
)

REM Définir les variables d'environnement par défaut
set JWT_SECRET=votre_cle_secrete_jwt_tres_longue_et_complexe_ici_par_defaut
set MONGODB_URI=mongodb://localhost:27017/photoevents
set PORT=5000
set NODE_ENV=development
set REDIS_ENABLED=false

echo 🔧 Configuration:
echo    Port: %PORT%
echo    MongoDB: %MONGODB_URI%
echo    Redis: Désactivé (mode fallback)
echo    JWT: Utilise la clé par défaut

echo.
echo ⚠️  ATTENTION: En production, créez un fichier .env avec une clé JWT_SECRET unique!

echo.
echo 🚀 Démarrage du serveur...
echo Appuyez sur Ctrl+C pour arrêter le serveur

REM Démarrer le serveur
npm run dev

