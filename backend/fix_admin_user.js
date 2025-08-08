const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function fixAdminUser() {
  const uri = process.env.DATABASE_URL || 'mongodb://localhost:27017/photoevent';
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log('Connexion à MongoDB réussie');
    
    const dbName = uri.split('/').pop();
    const db = client.db(dbName);
    const users = db.collection('users');
    
    // Supprimer l'ancien utilisateur admin s'il existe
    const result = await users.deleteMany({ 
      $or: [
        { email: 'admin@photoevents.com' },
        { role: 'ADMIN' }
      ]
    });
    console.log(`${result.deletedCount} ancien(s) utilisateur(s) admin supprimé(s)`);
    
    // Créer un nouvel utilisateur admin
    const hashedPassword = await bcrypt.hash('admin123', 12);
    const adminUser = {
      email: 'admin@photoevents.com',
      password: hashedPassword,
      name: 'Administrateur',
      role: 'ADMIN',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const insertResult = await users.insertOne(adminUser);
    console.log('Nouvel utilisateur admin créé avec l\'ID:', insertResult.insertedId);
    
    // Vérifier la création
    const createdUser = await users.findOne({ email: 'admin@photoevents.com' });
    console.log('Utilisateur admin vérifié:', {
      id: createdUser._id,
      email: createdUser.email,
      name: createdUser.name,
      role: createdUser.role,
      createdAt: createdUser.createdAt
    });
    
    console.log('\n✅ Utilisateur admin réparé avec succès!');
    console.log('Email: admin@photoevents.com');
    console.log('Mot de passe: admin123');
    
  } catch (error) {
    console.error('Erreur lors de la réparation de l\'utilisateur admin:', error);
  } finally {
    await client.close();
  }
}

fixAdminUser();
