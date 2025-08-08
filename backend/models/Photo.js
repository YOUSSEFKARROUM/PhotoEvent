import mongoose from 'mongoose';

const photoSchema = new mongoose.Schema({
    eventId: { type: String, required: true }, // Association stricte à un événement
    url: { type: String },
    uploadedAt: { type: Date },
    // faceEncodings: { type: [Number], default: undefined }, // SUPPRIMÉ : champ obsolète
    facesDetected: { type: Number },
    processed: { type: Boolean, default: false },
    filename: { type: String, required: true },
    originalName: { type: String },
    path: { type: String },
    size: { type: Number },
    mimetype: { type: String },
    description: { type: String },
    tags: [{ type: String }],
    uploadDate: { type: Date, default: Date.now },
    // Encodage facial principal (pour compatibilité)
    faceEncoding: {
        type: [Number],
        default: null,
        index: true
    },
    // Historique ou multi-visages (optionnel)
    face_encodings: {
        type: [[Number]],
        default: undefined,
        index: true
    },
    faceModel: {
        type: String,
        default: 'Facenet',
        enum: ['Facenet', 'Facenet512', 'OpenFace', 'DeepFace', 'DeepID', 'Dlib', 'ArcFace', 'fallback']
    },
    // Informations de traitement
    processingStatus: {
        type: String,
        enum: ['pending', 'processing', 'completed', 'failed'],
        default: 'pending'
    },
    processingError: {
        type: String,
        default: null
    },
    processingStartedAt: {
        type: Date,
        default: null
    },
    processingCompletedAt: {
        type: Date,
        default: null
    }
});

// Index pour les performances
photoSchema.index({ eventId: 1, uploadDate: -1 });
photoSchema.index({ processingStatus: 1 });
photoSchema.index({ uploadedAt: -1 });

export default mongoose.model('Photo', photoSchema); 