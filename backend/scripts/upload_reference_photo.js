// Script d'upload automatisé d'une photo de référence pour un utilisateur
// Usage: node upload_reference_photo.js <imagePath> <token>

const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');
const FormData = require('form-data');

if (process.argv.length < 4) {
  console.error('Usage: node upload_reference_photo.js <imagePath> <token>');
  process.exit(1);
}

const imagePath = process.argv[2];
const token = process.argv[3];

if (!fs.existsSync(imagePath)) {
  console.error('Fichier image introuvable:', imagePath);
  process.exit(1);
}

const form = new FormData();
form.append('photo', fs.createReadStream(imagePath));

fetch('http://localhost:5000/api/users/me/reference-photo', {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: form
})
  .then(async (res) => {
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      console.error('Erreur API:', data);
      process.exit(1);
    }
    console.log('Réponse API:', data);
  })
  .catch((err) => {
    console.error('Erreur lors de la requête:', err);
    process.exit(1);
  }); 