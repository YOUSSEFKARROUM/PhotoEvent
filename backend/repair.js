const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

const uri = process.env.DATABASE_URL || 'mongodb://localhost:27017/photoevents';
const dbName = uri.split('/').pop() || 'photoevents';

const repair = {
    async run() {
        console.log('🔧 RÉPARATION AUTOMATIQUE DES IMAGES (MongoDB)\n');
        // Étape 1: Nettoyer la base
        console.log('1. Nettoyage de la base...');
        await this.cleanDatabase();
        // Étape 2: Créer des images de test
        console.log('2. Création des images de test...');
        await this.createTestImages();
        // Étape 3: Vérifier la configuration
        console.log('3. Vérification de la configuration...');
        await this.checkConfiguration();
        console.log('\n✅ RÉPARATION TERMINÉE!');
        console.log('👉 Redémarre ton serveur backend');
        console.log('👉 Rafraîchis ton navigateur');
    },
    async cleanDatabase() {
        const client = new MongoClient(uri);
        await client.connect();
        const db = client.db(dbName);
        const photos = db.collection('photos');
        // Supprimer toutes les photos avec URLs externes (example.com ou http...), insensible à la casse
        const delRes = await photos.deleteMany({ $or: [
            { url: { $regex: /example\.com/i } },
            { url: { $regex: /^http/i } }
        ] });
        console.log(`   ✅ ${delRes.deletedCount} photos externes supprimées`);
        // Ajouter 3 photos de test
        const testPhotos = [
            { eventsId: '1', url: 'test1.svg', uploadedAt: new Date() },
            { eventsId: '1', url: 'test2.svg', uploadedAt: new Date() },
            { eventsId: '1', url: 'test3.svg', uploadedAt: new Date() }
        ];
        await photos.insertMany(testPhotos);
        console.log('   ✅ Photos de test ajoutées');
        await client.close();
    },
    async createTestImages() {
        const uploadsDir = path.join(__dirname, 'uploads/photos');
        if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
        }
        const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1'];
        colors.forEach((color, index) => {
            const svg = `<svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">\n    <rect width="100%" height="100%" fill="${color}"/>\n    <text x="50%" y="50%" text-anchor="middle" fill="white" font-size="24" font-family="Arial">Test Image ${index + 1}</text>\n</svg>`;
            fs.writeFileSync(path.join(uploadsDir, `test${index + 1}.svg`), svg);
            console.log(`   ✅ test${index + 1}.svg créé`);
        });
    },
    async checkConfiguration() {
        const uploadsDir = path.join(__dirname, 'uploads/photos');
        const files = fs.readdirSync(uploadsDir);
        console.log(`   📁 ${files.length} fichiers dans uploads/photos`);
        const client = new MongoClient(uri);
        await client.connect();
        const db = client.db(dbName);
        const photos = db.collection('photos');
        const count = await photos.countDocuments();
        console.log(`   📊 ${count} photos en base`);
        await client.close();
    }
};

if (require.main === module) {
    repair.run().catch(console.error);
}

module.exports = repair; 