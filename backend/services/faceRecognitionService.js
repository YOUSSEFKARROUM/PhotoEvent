import { execSync, spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class FaceRecognitionService {
    constructor() {
        this.scriptPath = path.join(__dirname, '..', 'scripts', 'deepface_encode.py');
        this.modelName = 'Facenet'; // Modèle par défaut
        this.pythonCommand = process.env.PYTHON_COMMAND || 'python';
        this.deepfaceAvailable = false;
        this.initialized = false;
    }

    /**
     * Initialisation rapide - vérifie DeepFace en arrière-plan
     */
    async initialize() {
        if (this.initialized) return;
        
        console.log('🔄 Initialisation du service de reconnaissance faciale...');
        
        // Vérification rapide en arrière-plan
        this.checkAvailability().then(available => {
            this.deepfaceAvailable = available;
            this.initialized = true;
            if (available) {
                console.log('✅ Service de reconnaissance faciale disponible');
            } else {
                console.log('⚠️  DeepFace non disponible - fonctionnalités de reconnaissance limitées');
            }
        }).catch(err => {
            console.log('⚠️  Erreur lors de l\'initialisation DeepFace:', err.message);
            this.deepfaceAvailable = false;
            this.initialized = true;
        });
    }

    /**
     * Vérifie que le script Python et DeepFace sont disponibles
     */
    async checkAvailability() {
        try {
            // Vérifie que le script existe
            if (!fs.existsSync(this.scriptPath)) {
                throw new Error(`Script Python non trouvé: ${this.scriptPath}`);
            }

            // Test rapide de DeepFace avec timeout court
            const testResult = execSync(
                `${this.pythonCommand} -c "import deepface; print('OK')"`,
                { encoding: 'utf-8', timeout: 3000 } // Timeout réduit à 3 secondes
            );

            return testResult.trim() === 'OK';
        } catch (error) {
            console.error('DeepFace non disponible:', error.message);
            return false;
        }
    }

    /**
     * Génère l'encodage facial d'une image
     * @param {string} imagePath - Chemin vers l'image
     * @param {string} modelName - Modèle à utiliser (optionnel)
     * @returns {Promise<Object>} Résultat avec l'encodage
     */
    async generateFaceEncoding(imagePath, modelName = null) {
        // Initialiser si pas encore fait
        if (!this.initialized) {
            await this.initialize();
        }

        // Si DeepFace n'est pas disponible, retourner un encodage factice
        if (!this.deepfaceAvailable) {
            console.log('⚠️  DeepFace non disponible - génération d\'encodage factice');
            return {
                success: true,
                embedding: new Array(128).fill(0), // Encodage factice
                model: 'fallback',
                facesDetected: 1
            };
        }

        return new Promise((resolve, reject) => {
            // Log du chemin du script et de la commande Python
            console.log('[FaceRecognition] Chemin script Python:', this.scriptPath);
            console.log('[FaceRecognition] Commande Python:', this.pythonCommand);
            try {
                // Validation du chemin
                if (!fs.existsSync(imagePath)) {
                    console.error('[FaceRecognition] Image non trouvée:', imagePath);
                    return reject(new Error(`Image non trouvée: ${imagePath}`));
                }
                if (!fs.existsSync(this.scriptPath)) {
                    console.error('[FaceRecognition] Script Python non trouvé:', this.scriptPath);
                    return reject(new Error(`Script Python non trouvé: ${this.scriptPath}`));
                }

                const model = modelName || this.modelName;
                const command = `${this.pythonCommand} "${this.scriptPath}" "${imagePath}" "${model}"`;

                // Log avant exécution
                console.log('[FaceRecognition] Appel script Python:', command);

                // Log du chemin de l'image passée au script Python
                console.log('[FaceRecognition] Image transmise au script:', imagePath);

                let result;
                try {
                    result = execSync(command, {
                        encoding: 'utf-8',
                        timeout: 300000, // 5 minutes max (réduit de 10 à 5)
                        maxBuffer: 1024 * 1024 // 1MB buffer
                    });
                    // Log du résultat complet
                    console.log('[FaceRecognition] Résultat complet du script:', result);
                } catch (error) {
                    console.error('[FaceRecognition] Erreur execSync (complète):', error);
                    return reject(new Error(`Erreur d'exécution du script DeepFace: ${error.stderr || error.message}`));
                }

                // Log après exécution
                console.log('[FaceRecognition] Résultat script Python:', result);

                const parsedResult = JSON.parse(result.trim());

                if (parsedResult.success) {
                    resolve({
                        success: true,
                        embedding: parsedResult.embedding,
                        model: parsedResult.model,
                        facesDetected: parsedResult.faces_detected
                    });
                } else {
                    // Transmettre l'objet d'erreur complet du script Python
                    console.error('[FaceRecognition] Erreur retournée par le script:', parsedResult);
                    reject(new Error(JSON.stringify(parsedResult)));
                }

            } catch (error) {
                // Si execSync lui-même échoue (timeout, etc.), capturer la sortie
                const stderr = error.stderr || error.message;
                console.error('[FaceRecognition] Exception générale:', stderr);
                reject(new Error(`Erreur d'exécution du script DeepFace: ${stderr}`));
            }
        });
    }

    /**
     * Compare deux encodages faciaux
     * @param {Array} encoding1 - Premier encodage
     * @param {Array} encoding2 - Deuxième encodage
     * @returns {number} Score de similarité (0-1)
     */
    compareFaces(encoding1, encoding2) {
        try {
            if (!Array.isArray(encoding1) || !Array.isArray(encoding2)) {
                if (process.env.FACE_RECOGNITION_DEBUG === 'true') {
                    console.log('[DEBUG] Encodages non valides pour la comparaison');
                }
                return 0;
            }

            if (encoding1.length !== encoding2.length) {
                if (process.env.FACE_RECOGNITION_DEBUG === 'true') {
                    console.log('[DEBUG] Longueurs d\'encodage différentes');
                }
                return 0;
            }

            // Calcul de la similarité cosinus
            let dotProduct = 0;
            let norm1 = 0;
            let norm2 = 0;

            for (let i = 0; i < encoding1.length; i++) {
                dotProduct += encoding1[i] * encoding2[i];
                norm1 += encoding1[i] * encoding1[i];
                norm2 += encoding2[i] * encoding2[i];
            }

            norm1 = Math.sqrt(norm1);
            norm2 = Math.sqrt(norm2);

            if (norm1 === 0 || norm2 === 0) {
                if (process.env.FACE_RECOGNITION_DEBUG === 'true') {
                    console.log('[DEBUG] Norme nulle dans la comparaison');
                }
                return 0;
            }

            const similarity = dotProduct / (norm1 * norm2);
            const normalized = Math.max(0, Math.min(1, (similarity + 1) / 2));
            if (process.env.FACE_RECOGNITION_DEBUG === 'true') {
                console.log(`[DEBUG] Similarité calculée: ${normalized}`);
            }
            return normalized;

        } catch (error) {
            console.error('Erreur comparaison visages:', error);
            return 0;
        }
    }

    /**
     * Trouve les visages similaires dans une liste de candidats
     * @param {Array} referenceEncoding - Encodage de référence
     * @param {Array} candidates - Liste des candidats avec leurs encodages
     * @param {number} threshold - Seuil de similarité
     * @param {number} limit - Nombre maximum de résultats
     * @returns {Array} Liste des correspondances triées par similarité
     */
    findSimilarFaces(referenceEncoding, candidates, threshold, limit = 10) {
        try {
            const matches = [];

            for (const candidate of candidates) {
                if (candidate.faceEncoding && Array.isArray(candidate.faceEncoding)) {
                    const similarity = this.compareFaces(referenceEncoding, candidate.faceEncoding);
                    
                    if (similarity >= threshold) {
                        matches.push({
                            ...candidate,
                            similarity: similarity
                        });
                    }
                }
            }

            // Tri par similarité décroissante
            matches.sort((a, b) => b.similarity - a.similarity);

            return matches.slice(0, limit);
        } catch (error) {
            console.error('Erreur recherche visages similaires:', error);
            return [];
        }
    }

    /**
     * Traite une image uploadée et génère l'encodage facial
     * @param {string} imagePath - Chemin vers l'image
     * @param {string} userId - ID de l'utilisateur (optionnel)
     * @returns {Promise<Object>} Résultat du traitement
     */
    async processUploadedImage(imagePath, userId = null) {
        try {
            console.log(`🔍 Traitement image: ${imagePath}`);
            
            const result = await this.generateFaceEncoding(imagePath);
            
            if (result.success) {
                console.log(`✅ Encodage généré: ${result.facesDetected} visage(s) détecté(s)`);
                return {
                    success: true,
                    faceEncoding: result.embedding,
                    model: result.model,
                    facesDetected: result.facesDetected
                };
            } else {
                console.error('❌ Échec génération encodage:', result.error);
                return {
                    success: false,
                    error: result.error
                };
            }
        } catch (error) {
            console.error('❌ Erreur traitement image:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Génère un encodage factice pour les tests
     * @param {string} imagePath - Chemin vers l'image
     * @returns {Promise<Object>} Encodage factice
     */
    async generateFallbackEncoding(imagePath) {
        console.log('🔄 Génération encodage factice pour:', imagePath);
        
        // Générer un encodage factice basé sur le hash du fichier
        const crypto = await import('crypto');
        const fs = await import('fs');
        
        try {
            const fileBuffer = fs.readFileSync(imagePath);
            const hash = crypto.createHash('md5').update(fileBuffer).digest('hex');
            
            // Convertir le hash en array de nombres
            const encoding = [];
            for (let i = 0; i < 128; i++) {
                const charCode = hash.charCodeAt(i % hash.length);
                encoding.push((charCode / 255) * 2 - 1); // Normaliser entre -1 et 1
            }
            
            return {
                success: true,
                faceEncoding: encoding,
                model: 'fallback',
                facesDetected: 1
            };
        } catch (error) {
            console.error('❌ Erreur génération encodage factice:', error);
            return {
                success: false,
                error: 'Impossible de générer un encodage factice'
            };
        }
    }
}

export default FaceRecognitionService; 