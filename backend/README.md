# Photoevents Backend API

Backend Node.js/Express pour l'application Photoevents avec reconnaissance faciale.

## 🚀 Fonctionnalités

- **Authentification JWT** - Inscription, connexion, gestion des tokens
- **Gestion des événements** - CRUD complet avec autorisations
- **Upload de photos** - Stockage Cloudinary avec traitement d'images
- **Reconnaissance faciale** - Intégration API de détection de visages
- **Base de données PostgreSQL** - Avec Prisma ORM
- **Sécurité** - Helmet, CORS, rate limiting, validation

## 🛠️ Technologies

- **Node.js** - Runtime JavaScript
- **Express** - Framework web
- **Prisma** - ORM pour PostgreSQL
- **JWT** - Authentification
- **Cloudinary** - Stockage d'images
- **Multer** - Upload de fichiers
- **Sharp** - Traitement d'images

## 📦 Installation

1. **Installer les dépendances**
```bash
cd backend
npm install
```

2. **Configurer l'environnement**
```bash
cp env.example .env
# Éditer .env avec vos configurations
```

3. **Configurer la base de données**
```bash
# Installer Prisma CLI
npm install -g prisma

# Générer le client Prisma
npx prisma generate

# Créer les tables
npx prisma db push

# (Optionnel) Voir la base de données
npx prisma studio
```

4. **Lancer le serveur**
```bash
# Développement
npm run dev

# Production
npm start
```

## 🔧 Configuration

### Variables d'environnement (.env)

```env
# Server
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# Database
DATABASE_URL="postgresql://username:password@localhost:5432/photoevents"

# JWT
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=7d

# Cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Face Recognition (optionnel)
FACE_API_KEY=your-face-api-key
FACE_API_ENDPOINT=https://api.face-api.com
```

## 📚 API Endpoints

### Authentification
- `POST /api/auth/register` - Inscription
- `POST /api/auth/login` - Connexion
- `GET /api/auth/me` - Profil utilisateur

### Événements
- `GET /api/eventss` - Liste des événements
- `GET /api/eventss/:id` - Détails d'un événement
- `POST /api/eventss` - Créer un événement (admin)
- `PUT /api/eventss/:id` - Modifier un événement (admin)
- `DELETE /api/eventss/:id` - Supprimer un événement (admin)

### Photos
- `GET /api/photos` - Liste des photos
- `GET /api/photos/:id` - Détails d'une photo
- `POST /api/photos` - Créer une photo
- `PUT /api/photos/:id` - Modifier une photo
- `DELETE /api/photos/:id` - Supprimer une photo

### Upload
- `POST /api/upload/photo` - Upload d'une photo
- `POST /api/upload/multiple` - Upload multiple

### Utilisateurs
- `GET /api/users` - Liste des utilisateurs (admin)
- `GET /api/users/:id` - Détails d'un utilisateur
- `PUT /api/users/:id` - Modifier un utilisateur
- `DELETE /api/users/:id` - Supprimer un utilisateur (admin)

## 🔒 Sécurité

- **JWT Authentication** - Tokens sécurisés
- **Password Hashing** - Bcrypt pour les mots de passe
- **Input Validation** - Express-validator
- **Rate Limiting** - Protection contre les attaques
- **CORS** - Configuration sécurisée
- **Helmet** - Headers de sécurité

## 🗄️ Base de données

### Modèles Prisma

- **User** - Utilisateurs avec rôles
- **events** - Événements avec photographes
- **Photo** - Photos avec métadonnées
- **Like** - Système de likes

### Relations

- Un utilisateur peut avoir plusieurs événements (photographe)
- Un événement peut avoir plusieurs photos
- Un utilisateur peut avoir plusieurs photos
- Un utilisateur peut liker plusieurs photos

## 🚀 Déploiement

### Heroku
```bash
# Configurer les variables d'environnement
heroku config:set DATABASE_URL=your-database-url
heroku config:set JWT_SECRET=your-jwt-secret

# Déployer
git push heroku main
```

### Docker
```bash
# Construire l'image
docker build -t photoevents-backend .

# Lancer le conteneur
docker run -p 5000:5000 photoevents-backend
```

## 🧪 Tests

```bash
# Lancer les tests
npm test

# Tests avec coverage
npm run test:coverage
```

## 📊 Monitoring

- **Health Check** - `GET /api/health`
- **Logs** - Morgan pour le logging
- **Error Handling** - Middleware global

## 🔗 Intégration Frontend

Le backend est configuré pour fonctionner avec le frontend React sur `http://localhost:3000`.

Pour connecter le frontend, mettez à jour les entités pour utiliser les vraies API au lieu des données simulées.

## 📄 Licence

MIT License 