// Script Node.js pour corriger les images et URLs dans la base (MongoDB)
const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
require('dotenv').config();

// Configuration
const MONGO_URL = process.env.MONGODB_URI;
const PHOTOS_DIR = path.join(__dirname, 'uploads/photos');
const BACKUP_DIR = path.join(__dirname, 'backup_images');

if (!fs.existsSync(PHOTOS_DIR)) fs.mkdirSync(PHOTOS_DIR, { recursive: true });
if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true });

// Nettoyer la base (garder uniquement le nom du fichier)
async function cleanDatabase() {
  const client = new MongoClient(MONGO_URL);
  await client.connect();
  const dbName = MONGO_URL.split('/').pop();
  const db = client.db(dbName);
  const photos = await db.collection('photos').find({}).toArray();
  let updates = 0;
  for (const photo of photos) {
    let cleanUrl = photo.url;
    if (!cleanUrl) continue;
    if (cleanUrl.startsWith('http://') || cleanUrl.startsWith('https://')) {
      cleanUrl = path.basename(cleanUrl);
    }
    if (cleanUrl.includes('/uploads/')) {
      cleanUrl = cleanUrl.split('/uploads/')[1];
    }
    if (cleanUrl !== photo.url) {
      await db.collection('photos').updateOne({ _id: photo._id }, { $set: { url: cleanUrl } });
      console.log(`✅ ${photo._id}: ${photo.url} → ${cleanUrl}`);
      updates++;
    }
  }
  if (updates === 0) console.log('✅ Aucune URL à nettoyer');
  await client.close();
}

// Télécharger les images distantes
function downloadImage(url, filename) {
  return new Promise((resolve, reject) => {
    const filepath = path.join(PHOTOS_DIR, filename);
    if (fs.existsSync(filepath)) {
      console.log(`⏭️  Fichier existe déjà: ${filename}`);
      resolve(filepath);
      return;
    }
    const client = url.startsWith('https:') ? https : http;
    client.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`HTTP ${response.statusCode}: ${url}`));
        return;
      }
      const file = fs.createWriteStream(filepath);
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        console.log(`✅ Téléchargé: ${filename}`);
        resolve(filepath);
      });
      file.on('error', (err) => {
        fs.unlink(filepath, () => {});
        reject(err);
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

async function downloadAllImages() {
  const client = new MongoClient(MONGO_URL);
  await client.connect();
  const dbName = MONGO_URL.split('/').pop();
  const db = client.db(dbName);
  const photos = await db.collection('photos').find({}).toArray();
  let downloads = 0;
  for (const photo of photos) {
    if (photo.url && (photo.url.startsWith('http://') || photo.url.startsWith('https://'))) {
      const filename = path.basename(photo.url);
      try {
        await downloadImage(photo.url, filename);
        await db.collection('photos').updateOne({ _id: photo._id }, { $set: { url: filename } });
        console.log(`✅ DB mis à jour: ${photo._id} → ${filename}`);
        downloads++;
      } catch (error) {
        console.error(`❌ Échec téléchargement ${photo.url}:`, error.message);
      }
    }
  }
  if (downloads === 0) console.log('✅ Aucune image distante à télécharger');
  await client.close();
}

// Audit complet
async function auditImages() {
  const client = new MongoClient(MONGO_URL);
  await client.connect();
  const dbName = MONGO_URL.split('/').pop();
  const db = client.db(dbName);
  const photos = await db.collection('photos').find({}).toArray();
  const stats = { total: photos.length, remote: 0, local: 0, existing: 0, missing: 0, malformed: 0 };
  const issues = [];
  for (const photo of photos) {
    if (!photo.url) continue;
    if (photo.url.startsWith('http://') || photo.url.startsWith('https://')) {
      stats.remote++;
    } else {
      stats.local++;
      const filename = photo.url.includes('/') ? photo.url.split('/').pop() : photo.url;
      const filepath = path.join(PHOTOS_DIR, filename);
      if (fs.existsSync(filepath)) {
        stats.existing++;
      } else {
        stats.missing++;
        issues.push({ id: photo._id, url: photo.url, issue: 'Fichier local manquant', expectedPath: filepath });
      }
    }
    if (!photo.url || photo.url.includes('example.com')) {
      stats.malformed++;
      issues.push({ id: photo._id, url: photo.url, issue: 'URL invalide ou exemple' });
    }
  }
  console.log('\n📊 STATISTIQUES:');
  console.log(`Total: ${stats.total}`);
  console.log(`URLs distantes: ${stats.remote}`);
  console.log(`URLs locales: ${stats.local}`);
  console.log(`Fichiers existants: ${stats.existing}`);
  console.log(`Fichiers manquants: ${stats.missing}`);
  console.log(`URLs malformées: ${stats.malformed}`);
  if (issues.length > 0) {
    console.log('\n❌ PROBLÈMES DÉTECTÉS:');
    issues.forEach(issue => {
      console.log(`ID ${issue.id}: ${issue.issue} - ${issue.url}`);
    });
  }
  await client.close();
}

// MENU PRINCIPAL
async function main() {
  console.log('🖼️  CORRECTEUR D\'IMAGES PHOTOevents\n');
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.log('Usage: node fix_images.js [option]');
    console.log('Options:');
    console.log('  audit      - Analyser les problèmes d\'images');
    console.log('  clean      - Nettoyer les URLs en base (garder nom fichier)');
    console.log('  download   - Télécharger les images distantes');
    console.log('  all        - Effectuer toutes les corrections');
    return;
  }
  const option = args[0];
  try {
    switch (option) {
      case 'audit':
        await auditImages();
        break;
      case 'clean':
        await cleanDatabase();
        console.log('✅ Base de données nettoyée');
        break;
      case 'download':
        await downloadAllImages();
        console.log('✅ Images téléchargées');
        break;
      case 'all':
        await auditImages();
        await downloadAllImages();
        await cleanDatabase();
        console.log('✅ Toutes les corrections effectuées');
        break;
      default:
        console.log('❌ Option inconnue:', option);
    }
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

main(); 