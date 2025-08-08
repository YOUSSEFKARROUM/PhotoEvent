import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Utilitaires pour le nettoyage et la gestion des fichiers photos
 */

/**
 * Supprime un fichier s'il existe
 * @param {string} filePath - Chemin vers le fichier à supprimer
 * @returns {boolean} - True si le fichier a été supprimé, false sinon
 */
export const deleteFileIfExists = (filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`🗑️ Fichier supprimé : ${filePath}`);
      return true;
    }
    return false;
  } catch (error) {
    console.error(`❌ Erreur lors de la suppression de ${filePath}:`, error.message);
    return false;
  }
};

/**
 * Supprime plusieurs fichiers
 * @param {string[]} filePaths - Liste des chemins de fichiers à supprimer
 * @returns {number} - Nombre de fichiers supprimés
 */
export const deleteMultipleFiles = (filePaths) => {
  let deletedCount = 0;
  for (const filePath of filePaths) {
    if (deleteFileIfExists(filePath)) {
      deletedCount++;
    }
  }
  return deletedCount;
};

/**
 * Nettoie les fichiers temporaires d'upload
 * @param {string} tempDir - Répertoire temporaire
 * @param {number} maxAge - Âge maximum en heures (défaut: 24h)
 * @returns {number} - Nombre de fichiers supprimés
 */
export const cleanupTempFiles = (tempDir, maxAge = 24) => {
  try {
    if (!fs.existsSync(tempDir)) {
      return 0;
    }

    const files = fs.readdirSync(tempDir);
    const now = Date.now();
    const maxAgeMs = maxAge * 60 * 60 * 1000; // Conversion en millisecondes
    let deletedCount = 0;

    for (const file of files) {
      const filePath = path.join(tempDir, file);
      const stats = fs.statSync(filePath);

      if (now - stats.mtime.getTime() > maxAgeMs) {
        if (deleteFileIfExists(filePath)) {
          deletedCount++;
        }
      }
    }

    console.log(`🧹 Nettoyage terminé : ${deletedCount} fichiers temporaires supprimés`);
    return deletedCount;
  } catch (error) {
    console.error('❌ Erreur lors du nettoyage des fichiers temporaires:', error.message);
    return 0;
  }
};

/**
 * Vérifie si un fichier existe et retourne ses informations
 * @param {string} filePath - Chemin vers le fichier
 * @returns {Object|null} - Informations du fichier ou null
 */
export const getFileInfo = (filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      const stats = fs.statSync(filePath);
      return {
        exists: true,
        size: stats.size,
        created: stats.birthtime,
        modified: stats.mtime,
        isFile: stats.isFile(),
        isDirectory: stats.isDirectory()
      };
    }
    return { exists: false };
  } catch (error) {
    console.error(`❌ Erreur lors de la vérification de ${filePath}:`, error.message);
    return null;
  }
};

/**
 * Crée un répertoire s'il n'existe pas
 * @param {string} dirPath - Chemin vers le répertoire
 * @returns {boolean} - True si le répertoire existe ou a été créé
 */
export const ensureDirectoryExists = (dirPath) => {
  try {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
      console.log(`📁 Répertoire créé : ${dirPath}`);
    }
    return true;
  } catch (error) {
    console.error(`❌ Erreur lors de la création du répertoire ${dirPath}:`, error.message);
    return false;
  }
};

/**
 * Calcule la taille totale d'un répertoire
 * @param {string} dirPath - Chemin vers le répertoire
 * @returns {number} - Taille en bytes
 */
export const getDirectorySize = (dirPath) => {
  try {
    if (!fs.existsSync(dirPath)) {
      return 0;
    }

    let totalSize = 0;
    const files = fs.readdirSync(dirPath);

    for (const file of files) {
      const filePath = path.join(dirPath, file);
      const stats = fs.statSync(filePath);

      if (stats.isFile()) {
        totalSize += stats.size;
      } else if (stats.isDirectory()) {
        totalSize += getDirectorySize(filePath);
      }
    }

    return totalSize;
  } catch (error) {
    console.error(`❌ Erreur lors du calcul de la taille de ${dirPath}:`, error.message);
    return 0;
  }
};

/**
 * Formate la taille en bytes en format lisible
 * @param {number} bytes - Taille en bytes
 * @returns {string} - Taille formatée
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Nettoie les fichiers orphelins en comparant la base de données et le système de fichiers
 * @param {Array} dbPhotos - Photos de la base de données
 * @param {string} uploadsDir - Répertoire des uploads
 * @returns {Object} - Résultats du nettoyage
 */
export const cleanupOrphanFiles = (dbPhotos, uploadsDir) => {
  try {
    if (!fs.existsSync(uploadsDir)) {
      return { deleted: 0, errors: 0, total: 0 };
    }

    const filesOnDisk = fs.readdirSync(uploadsDir);
    const dbFilenames = new Set(dbPhotos.map(p => p.filename).filter(Boolean));
    let deletedCount = 0;
    let errorCount = 0;

    for (const file of filesOnDisk) {
      if (!dbFilenames.has(file)) {
        const filePath = path.join(uploadsDir, file);
        if (deleteFileIfExists(filePath)) {
          deletedCount++;
        } else {
          errorCount++;
        }
      }
    }

    return {
      deleted: deletedCount,
      errors: errorCount,
      total: filesOnDisk.length,
      orphanCount: filesOnDisk.length - dbFilenames.size
    };
  } catch (error) {
    console.error('❌ Erreur lors du nettoyage des fichiers orphelins:', error.message);
    return { deleted: 0, errors: 1, total: 0 };
  }
}; 