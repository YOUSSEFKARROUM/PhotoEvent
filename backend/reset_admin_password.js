const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

async function resetPassword() {
  await mongoose.connect('mongodb://localhost:27017/photoevents');
  const hash = await bcrypt.hash('admin123', 12); // Nouveau mot de passe
  const result = await User.updateOne(
    { email: 'admin@photoevents.com' },
    { $set: { password: hash } }
  );
  if (result.modifiedCount > 0) {
    console.log('Mot de passe réinitialisé pour admin@photoevents.com');
  } else {
    console.log('Aucun utilisateur trouvé avec cet email.');
  }
  await mongoose.disconnect();
  process.exit();
}

resetPassword(); 