const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

async function resetAdmins() {
  await mongoose.connect('mongodb://localhost:27017/photoevents');
  // Suppression de tous les admins
  const delResult = await User.deleteMany({ role: 'ADMIN' });
  console.log(`Admins supprimés : ${delResult.deletedCount}`);
  // Création d'un nouvel admin
  const hash = await bcrypt.hash('Admin123', 12);
  const newAdmin = await User.create({
    email: 'admin@photoevent.com',
    password: hash,
    name: 'Administrateur',
    role: 'ADMIN',
    createdAt: new Date(),
    updatedAt: new Date()
  });
  console.log('Nouvel admin créé :', newAdmin.email);
  await mongoose.disconnect();
  process.exit();
}

resetAdmins(); 