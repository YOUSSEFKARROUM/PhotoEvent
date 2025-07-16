const fs = require('fs');
const path = require('path');

const sourceDir = path.join(__dirname, 'uploads/photos');
const missingFileList = path.join(__dirname, 'missing_images.txt');

// Lis la liste des images manquantes (une par ligne)
if (!fs.existsSync(missingFileList)) {
  console.log('Fichier missing_images.txt introuvable. Ajoute les noms d\'images manquantes dedans, un par ligne.');
  process.exit(1);
}
const expectedFiles = fs.readFileSync(missingFileList, 'utf-8')
  .split(/\r?\n/)
  .map(f => f.trim())
  .filter(f => f.length > 0);

fs.readdir(sourceDir, (err, files) => {
  if (err) throw err;
  if (files.length === 0) {
    console.log('Aucune image source trouvée.');
    return;
  }
  expectedFiles.forEach((target, i) => {
    const dest = path.join(sourceDir, target);
    if (!fs.existsSync(dest)) {
      const src = path.join(sourceDir, files[i % files.length]);
      fs.copyFileSync(src, dest);
      console.log(`Copié ${src} -> ${dest}`);
    } else {
      console.log(`${target} existe déjà, ignoré.`);
    }
  });
}); 