const mongoose = require('mongoose');
const User = require('../models/User');

async function fixAdmin() {
  await mongoose.connect('mongodb://localhost:27017/photoevent');
  const email = 'admin@photoevents.com';
  const password = 'Admin123';

  let user = await User.findOne({ email });
  if (!user) {
    user = new User({
      email,
      password,
      name: 'Administrateur',
      role: 'ADMIN',
      isActive: true,
      deletedAt: null,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    await user.save();
    console.log('Nouvel admin créé.');
    } else {
    user.password = password;
    user.isActive = true;
    user.deletedAt = null;
    user.updatedAt = new Date();
    await user.save();
    console.log('Admin existant mis à jour.');
  }
  // Affichage pour debug
  const admin = await User.findOne({ email }).select('+password');
  console.log('Admin en base:', {
    email: admin.email,
    isActive: admin.isActive,
    deletedAt: admin.deletedAt,
    hash: admin.password,
    role: admin.role
  });
  await mongoose.disconnect();
}

fixAdmin();
