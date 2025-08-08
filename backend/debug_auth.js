const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function debugAuth() {
  const uri = process.env.DATABASE_URL || 'mongodb://localhost:27017/photoevent';
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log('✅ Connexion à MongoDB réussie');
    
    const dbName = uri.split('/').pop();
    const db = client.db(dbName);
    const users = db.collection('users');
    
    console.log('\n=== DIAGNOSTIC DE L\'UTILISATEUR ADMIN ===');
    
    // Chercher l'utilisateur admin
    const adminUser = await users.findOne({ email: 'admin@photoevents.com' });
    
    if (!adminUser) {
      console.log('❌ Aucun utilisateur admin trouvé');
      return;
    }
    
    console.log('✅ Utilisateur admin trouvé:');
    console.log('  ID:', adminUser._id);
    console.log('  Email:', adminUser.email);
    console.log('  Nom:', adminUser.name);
    console.log('  Rôle:', adminUser.role);
    console.log('  Créé le:', adminUser.createdAt);
    console.log('  Hash du mot de passe:', adminUser.password.substring(0, 20) + '...');
    
    // Test de vérification du mot de passe
    console.log('\n=== TEST DE VÉRIFICATION DU MOT DE PASSE ===');
    
    const testPasswords = ['admin123', 'Admin123', 'ADMIN123', 'admin', '123456'];
    
    for (const testPassword of testPasswords) {
      const isValid = await bcrypt.compare(testPassword, adminUser.password);
      console.log(`  Test "${testPassword}": ${isValid ? '✅ VALIDE' : '❌ Invalide'}`);
      
      if (isValid) {
        console.log(`🎉 Le mot de passe correct est: "${testPassword}"`);
        break;
      }
    }
    
    // Test de création d'un nouveau hash
    console.log('\n=== TEST DE NOUVEAU HASH ===');
    const newHash = await bcrypt.hash('admin123', 12);
    const isNewHashValid = await bcrypt.compare('admin123', newHash);
    console.log('  Nouveau hash créé:', newHash.substring(0, 20) + '...');
    console.log('  Vérification du nouveau hash:', isNewHashValid ? '✅ VALIDE' : '❌ Invalide');
    
    // Comparaison avec l'ancien hash
    const isOldHashValid = await bcrypt.compare('admin123', adminUser.password);
    console.log('  Vérification de l\'ancien hash:', isOldHashValid ? '✅ VALIDE' : '❌ Invalide');
    
    if (!isOldHashValid) {
      console.log('\n🔧 RÉPARATION NÉCESSAIRE - Mise à jour du hash...');
      await users.updateOne(
        { email: 'admin@photoevents.com' },
        { 
          $set: { 
            password: newHash,
            updatedAt: new Date()
          } 
        }
      );
      console.log('✅ Hash mis à jour avec succès');
      
      // Vérification finale
      const updatedUser = await users.findOne({ email: 'admin@photoevents.com' });
      const finalCheck = await bcrypt.compare('admin123', updatedUser.password);
      console.log('  Vérification finale:', finalCheck ? '✅ SUCCÈS' : '❌ ÉCHEC');
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await client.close();
  }
}

debugAuth();
