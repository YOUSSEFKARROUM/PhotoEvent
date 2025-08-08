const { spawn } = require('child_process');
const path = require('path');

class FaceService {
  constructor() {
    this.pythonPath = process.env.PYTHON_PATH || 'python3';
    this.scriptPath = path.join(__dirname, '../services/deepface_server.py');
  }

  async extractFaceEncoding(imagePath) {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      console.log('🔍 Lancement extraction faciale:', imagePath);
      const pythonProcess = spawn(this.pythonPath, [this.scriptPath, imagePath]);
      let output = '';
      let errorOutput = '';
      pythonProcess.stdout.on('data', (data) => {
        output += data.toString();
      });
      pythonProcess.stderr.on('data', (data) => {
        errorOutput += data.toString();
        console.log('Python stderr:', data.toString());
      });
      pythonProcess.on('close', (code) => {
        const processingTime = Date.now() - startTime;
        console.log(`🕐 Extraction terminée en ${processingTime}ms`);
        if (code === 0) {
          try {
            const result = JSON.parse(output.trim());
            if (result.success) {
              resolve(result.encoding);
            } else {
              reject(new Error('Aucun visage détecté dans l\'image'));
            }
          } catch (parseError) {
            console.error('Erreur parsing JSON:', parseError);
            reject(new Error('Erreur de traitement de l\'image'));
          }
        } else {
          console.error('Erreur Python:', errorOutput);
          reject(new Error(`Erreur script Python (code ${code})`));
        }
      });
      // Timeout après 30 secondes
      setTimeout(() => {
        pythonProcess.kill();
        reject(new Error('Timeout: traitement trop long'));
      }, 30000);
    });
  }

  async processUploadedImage(imagePath, userId) {
    try {
      const encoding = await this.extractFaceEncoding(imagePath);
      return {
        hasface: encoding !== null,
        encoding: encoding,
        confidence: encoding ? 0.9 : 0
      };
    } catch (error) {
      console.error('Erreur traitement image:', error);
      return {
        hasface: false,
        encoding: null,
        confidence: 0
      };
    }
  }
}

module.exports = new FaceService(); 