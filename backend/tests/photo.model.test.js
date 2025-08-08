const mongoose = require('mongoose');
const Photo = require('../models/Photo');
const { MongoMemoryServer } = require('mongodb-memory-server');

describe('Photo Model', () => {
  let mongoServer;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    await Photo.deleteMany({});
  });

  describe('Schema Validation', () => {
    it('devrait créer une photo avec les champs requis', async () => {
      const photoData = {
        filename: 'test-photo.jpg',
        originalName: 'original-photo.jpg',
        path: '/uploads/photos/test-photo.jpg',
        size: 1024000,
        mimetype: 'image/jpeg'
      };

      const photo = new Photo(photoData);
      const savedPhoto = await photo.save();

      expect(savedPhoto.filename).toBe(photoData.filename);
      expect(savedPhoto.originalName).toBe(photoData.originalName);
      expect(savedPhoto.path).toBe(photoData.path);
      expect(savedPhoto.size).toBe(photoData.size);
      expect(savedPhoto.mimetype).toBe(photoData.mimetype);
      expect(savedPhoto.uploadDate).toBeDefined();
      expect(savedPhoto.facesDetected).toBe(0);
      expect(savedPhoto.faceModel).toBe('Facenet');
    });

    it('devrait échouer si le filename est manquant', async () => {
      const photoData = {
        originalName: 'original-photo.jpg',
        path: '/uploads/photos/test-photo.jpg'
      };

      const photo = new Photo(photoData);
      let error;
      try {
        await photo.save();
      } catch (err) {
        error = err;
      }

      expect(error).toBeDefined();
      expect(error.errors.filename).toBeDefined();
    });

    it('devrait accepter les encodages faciaux', async () => {
      const photoData = {
        filename: 'test-photo-with-faces.jpg',
        face_encodings: [
          [0.1, 0.2, 0.3, 0.4, 0.5], // Premier visage
          [0.6, 0.7, 0.8, 0.9, 1.0]  // Deuxième visage
        ],
        facesDetected: 2
      };

      const photo = new Photo(photoData);
      const savedPhoto = await photo.save();

      expect(savedPhoto.face_encodings).toHaveLength(2);
      expect(savedPhoto.face_encodings[0]).toEqual([0.1, 0.2, 0.3, 0.4, 0.5]);
      expect(savedPhoto.face_encodings[1]).toEqual([0.6, 0.7, 0.8, 0.9, 1.0]);
      expect(savedPhoto.facesDetected).toBe(2);
    });

    it('devrait accepter les tags', async () => {
      const photoData = {
        filename: 'tagged-photo.jpg',
        tags: ['mariage', 'famille', 'extérieur']
      };

      const photo = new Photo(photoData);
      const savedPhoto = await photo.save();

      expect(savedPhoto.tags).toEqual(['mariage', 'famille', 'extérieur']);
    });

    it('devrait accepter une description', async () => {
      const photoData = {
        filename: 'described-photo.jpg',
        description: 'Belle photo de famille prise lors du mariage'
      };

      const photo = new Photo(photoData);
      const savedPhoto = await photo.save();

      expect(savedPhoto.description).toBe('Belle photo de famille prise lors du mariage');
    });

    it('devrait valider le modèle de reconnaissance faciale', async () => {
      const validModels = ['Facenet', 'Facenet512', 'OpenFace', 'DeepFace', 'DeepID', 'Dlib', 'ArcFace', 'fallback'];
      
      for (const model of validModels) {
        const photoData = {
          filename: `test-${model}.jpg`,
          faceModel: model
        };

        const photo = new Photo(photoData);
        const savedPhoto = await photo.save();
        expect(savedPhoto.faceModel).toBe(model);
        await Photo.deleteOne({ _id: savedPhoto._id });
      }
    });

    it('devrait rejeter un modèle de reconnaissance invalide', async () => {
      const photoData = {
        filename: 'invalid-model.jpg',
        faceModel: 'InvalidModel'
      };

      const photo = new Photo(photoData);
      let error;
      try {
        await photo.save();
      } catch (err) {
        error = err;
      }

      expect(error).toBeDefined();
      expect(error.errors.faceModel).toBeDefined();
    });
  });

  describe('Méthodes et Fonctionnalités', () => {
    it('devrait définir uploadDate automatiquement', async () => {
      const before = new Date();
      const photo = new Photo({ filename: 'auto-date.jpg' });
      const savedPhoto = await photo.save();
      const after = new Date();

      expect(savedPhoto.uploadDate).toBeDefined();
      expect(savedPhoto.uploadDate.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(savedPhoto.uploadDate.getTime()).toBeLessThanOrEqual(after.getTime());
    });

    it('devrait maintenir la compatibilité avec l\'ancien champ faceEncoding', async () => {
      const photoData = {
        filename: 'legacy-encoding.jpg',
        faceEncoding: [0.1, 0.2, 0.3, 0.4, 0.5] // Ancien format
      };

      const photo = new Photo(photoData);
      const savedPhoto = await photo.save();

      expect(savedPhoto.faceEncoding).toEqual([0.1, 0.2, 0.3, 0.4, 0.5]);
    });

    it('devrait permettre l\'utilisation simultanée des anciens et nouveaux champs d\'encodage', async () => {
      const photoData = {
        filename: 'mixed-encoding.jpg',
        faceEncoding: [0.1, 0.2, 0.3, 0.4, 0.5], // Ancien format
        face_encodings: [
          [0.1, 0.2, 0.3, 0.4, 0.5],
          [0.6, 0.7, 0.8, 0.9, 1.0]
        ], // Nouveau format
        facesDetected: 2
      };

      const photo = new Photo(photoData);
      const savedPhoto = await photo.save();

      expect(savedPhoto.faceEncoding).toEqual([0.1, 0.2, 0.3, 0.4, 0.5]);
      expect(savedPhoto.face_encodings).toHaveLength(2);
      expect(savedPhoto.facesDetected).toBe(2);
    });
  });

  describe('Requêtes et Index', () => {
    it('devrait pouvoir rechercher des photos par tags', async () => {
      await Photo.create([
        { filename: 'photo1.jpg', tags: ['mariage', 'famille'] },
        { filename: 'photo2.jpg', tags: ['anniversaire', 'famille'] },
        { filename: 'photo3.jpg', tags: ['mariage', 'extérieur'] }
      ]);

      const mariagePhotos = await Photo.find({ tags: 'mariage' });
      const famillePhotos = await Photo.find({ tags: 'famille' });

      expect(mariagePhotos).toHaveLength(2);
      expect(famillePhotos).toHaveLength(2);
      expect(mariagePhotos.map(p => p.filename)).toContain('photo1.jpg');
      expect(mariagePhotos.map(p => p.filename)).toContain('photo3.jpg');
    });

    it('devrait pouvoir rechercher des photos avec encodages faciaux', async () => {
      await Photo.create([
        { filename: 'photo1.jpg', face_encodings: [[0.1, 0.2]] },
        { filename: 'photo2.jpg' }, // Pas d'encodage
        { filename: 'photo3.jpg', face_encodings: [[0.3, 0.4]] }
      ]);

      const photosWithFaces = await Photo.find({ 
        face_encodings: { $exists: true, $ne: null } 
      });

      expect(photosWithFaces).toHaveLength(2);
      expect(photosWithFaces.map(p => p.filename)).toContain('photo1.jpg');
      expect(photosWithFaces.map(p => p.filename)).toContain('photo3.jpg');
    });

    it('devrait pouvoir trier par date d\'upload', async () => {
      const date1 = new Date('2024-01-01');
      const date2 = new Date('2024-01-02');
      const date3 = new Date('2024-01-03');

      await Photo.create([
        { filename: 'photo2.jpg', uploadDate: date2 },
        { filename: 'photo1.jpg', uploadDate: date1 },
        { filename: 'photo3.jpg', uploadDate: date3 }
      ]);

      const photosAsc = await Photo.find().sort({ uploadDate: 1 });
      const photosDesc = await Photo.find().sort({ uploadDate: -1 });

      expect(photosAsc[0].filename).toBe('photo1.jpg');
      expect(photosAsc[2].filename).toBe('photo3.jpg');
      expect(photosDesc[0].filename).toBe('photo3.jpg');
      expect(photosDesc[2].filename).toBe('photo1.jpg');
    });
  });
});
