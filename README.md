# Photoevents - Application de Reconnaissance Faciale

Une application moderne de gestion d'événements avec reconnaissance faciale, construite avec React et Vite.

## 🚀 Fonctionnalités

- **Gestion d'événements** : Création et gestion d'événements
- **Upload de photos** : Interface moderne pour uploader des photos
- **Reconnaissance faciale** : Détection automatique des visages
- **Dashboard admin** : Interface d'administration complète
- **Design moderne** : Interface utilisateur élégante avec Tailwind CSS

## 🛠️ Technologies utilisées

- **React 18** - Framework frontend
- **Vite** - Build tool et dev server
- **Tailwind CSS** - Framework CSS
- **React Router** - Navigation
- **Framer Motion** - Animations
- **Lucide React** - Icônes
- **Date-fns** - Manipulation de dates

## 📦 Installation

1. **Cloner le projet** (si ce n'est pas déjà fait)
```bash
git clone <votre-repo>
cd BEYONDCOM2
```

2. **Installer les dépendances**
```bash
npm install
```

3. **Lancer le serveur de développement**
```bash
npm run dev
```

4. **Ouvrir dans le navigateur**
L'application sera accessible à l'adresse : http://localhost:3000

## 🏗️ Structure du projet

```
src/
├── components/          # Composants réutilisables
│   ├── ui/             # Composants UI de base
│   └── admin/          # Composants spécifiques à l'admin
├── entities/           # Modèles de données
├── pages/              # Pages de l'application
├── utils/              # Fonctions utilitaires
├── lib/                # Bibliothèques utilitaires
└── integrations/       # Intégrations externes
```

## 🎯 Pages disponibles

- **Accueil** (`/`) - Page d'accueil avec présentation
- **Événements** (`/eventss`) - Liste des événements
- **Mes Photos** (`/my-photos`) - Photos de l'utilisateur
- **Upload** (`/upload`) - Upload de photos
- **Admin** (`/admin`) - Dashboard administrateur
- **Gestion Événements** (`/admin/eventss`) - Gestion des événements
- **Gestion Utilisateurs** (`/admin/users`) - Gestion des utilisateurs
- **Gestion Photos** (`/admin/photos`) - Modération des photos

## 🔧 Scripts disponibles

- `npm run dev` - Lance le serveur de développement
- `npm run build` - Construit l'application pour la production
- `npm run preview` - Prévisualise la build de production
- `npm run lint` - Lance le linter
- `npm run lint:fix` - Corrige automatiquement les erreurs de linting

## 🎨 Design System

L'application utilise un design system moderne avec :
- **Couleurs** : Palette bleue/indigo avec variables CSS
- **Typographie** : Hiérarchie claire avec Tailwind
- **Composants** : Système de composants réutilisables
- **Animations** : Transitions fluides avec Framer Motion

## 🔒 Sécurité et RGPD

- Reconnaissance faciale sécurisée
- Conformité RGPD
- Gestion des consentements
- Stockage sécurisé des données

## 📱 Responsive Design

L'application est entièrement responsive et s'adapte à tous les écrans :
- Mobile (< 768px)
- Tablet (768px - 1024px)
- Desktop (> 1024px)

## 🚀 Déploiement

Pour déployer l'application :

1. **Build de production**
```bash
npm run build
```

2. **Déployer le dossier `dist`** sur votre serveur web

## 🤝 Contribution

1. Fork le projet
2. Créer une branche feature (`git checkout -b feature/AmazingFeature`)
3. Commit les changements (`git commit -m 'Add some AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

## 📞 Support

Pour toute question ou problème, n'hésitez pas à ouvrir une issue sur GitHub. 