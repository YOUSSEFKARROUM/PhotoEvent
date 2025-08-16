# 🔧 Guide de Dépannage - Backend Photoevents

## Problèmes Courants et Solutions

### 1. ❌ Erreur JWT_SECRET manquant

**Problème :**
```
ERREUR CRITIQUE : La variable d'environnement JWT_SECRET n'est pas définie.
```

**Solutions :**

#### Option A : Utiliser le script de démarrage automatique (Recommandé)
```bash
# Windows PowerShell
.\start-backend.ps1

# Windows Command Prompt
start-backend.bat

# Linux/Mac
./start-backend.sh
```

#### Option B : Créer un fichier .env manuellement
Créez un fichier `.env` à la racine du dossier `backend` avec :
```env
JWT_SECRET=votre_cle_secrete_jwt_tres_longue_et_complexe_ici
MONGODB_URI=mongodb://localhost:27017/photoevents
PORT=5000
NODE_ENV=development
REDIS_ENABLED=false
```

#### Option C : Définir les variables d'environnement directement
```bash
# Windows PowerShell
$env:JWT_SECRET="votre_cle_secrete_jwt_tres_longue_et_complexe_ici"
$env:REDIS_ENABLED="false"
npm run dev

# Windows Command Prompt
set JWT_SECRET=votre_cle_secrete_jwt_tres_longue_et_complexe_ici
set REDIS_ENABLED=false
npm run dev

# Linux/Mac
export JWT_SECRET="votre_cle_secrete_jwt_tres_longue_et_complexe_ici"
export REDIS_ENABLED="false"
npm run dev
```

### 2. ❌ Erreur Redis indisponible

**Problème :**
```
❌ Erreur Redis: connect ECONNREFUSED 127.0.0.1:6379
⚠️ Redis indisponible - les queues BullMQ sont désactivées
```

**Solutions :**

#### Option A : Désactiver Redis (Recommandé pour le développement)
```bash
# Définir la variable d'environnement
set REDIS_ENABLED=false  # Windows
export REDIS_ENABLED="false"  # Linux/Mac

# Ou utiliser le script de démarrage automatique
.\start-backend.ps1
```

#### Option B : Installer et démarrer Redis
```bash
# Windows (avec WSL ou Docker)
docker run -d -p 6379:6379 redis:alpine

# Linux
sudo apt-get install redis-server
sudo systemctl start redis

# Mac
brew install redis
brew services start redis
```

### 3. ❌ Erreur MongoDB indisponible

**Problème :**
```
❌ Erreur de connexion à MongoDB
```

**Solutions :**

#### Option A : Installer MongoDB localement
```bash
# Windows
# Télécharger depuis https://www.mongodb.com/try/download/community

# Linux
sudo apt-get install mongodb

# Mac
brew install mongodb-community
```

#### Option B : Utiliser MongoDB Atlas (cloud)
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/photoevents
```

#### Option C : Utiliser Docker
```bash
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

### 4. 📁 Dossiers manquants

**Problème :**
```
Error: ENOENT: no such file or directory, open './uploads/...'
```

**Solution :**
```bash
# Créer les dossiers nécessaires
mkdir uploads
mkdir uploads/photos
mkdir uploads/temp
```

### 5. 🔑 Problèmes d'authentification

**Problème :**
```
JWT verification failed
```

**Solutions :**
- Vérifier que `JWT_SECRET` est défini et unique
- Redémarrer le serveur après modification de `JWT_SECRET`
- Vérifier que l'utilisateur admin existe

### 6. 🚀 Démarrage rapide

**Pour un démarrage immédiat sans configuration :**

1. **Utiliser le script automatique :**
   ```bash
   .\start-backend.ps1  # Windows PowerShell
   # ou
   start-backend.bat    # Windows Command Prompt
   ```

2. **Configuration minimale :**
   ```bash
   set JWT_SECRET=dev_secret_key_123
   set REDIS_ENABLED=false
   npm run dev
   ```

### 7. 📋 Vérification de l'installation

**Tester que tout fonctionne :**
```bash
# Vérifier la santé du serveur
curl http://localhost:5000/api/health

# Vérifier la base de données
curl http://localhost:5000/api/debug/photos
```

### 8. 🔄 Redémarrage propre

**En cas de problème :**
```bash
# Arrêter le serveur (Ctrl+C)
# Nettoyer les processus
taskkill /f /im node.exe  # Windows
pkill -f node              # Linux/Mac

# Redémarrer
npm run dev
```

## 📞 Support

Si les problèmes persistent :
1. Vérifiez les logs du serveur
2. Consultez le fichier `config.js` pour la configuration
3. Vérifiez que tous les dossiers existent
4. Assurez-vous que les ports 5000 et 27017 sont libres

