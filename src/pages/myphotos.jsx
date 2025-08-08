import React, { useState, useEffect, useCallback } from "react";
import { User, Event, Photo } from "@/entities/all";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Camera, 
  Upload, 
  Search, 
  Download, 
  Heart,
  Shield,
  AlertCircle,
  CheckCircle,
  User as UserIcon,
  Sparkles,
  Calendar
} from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from 'react-router-dom';

import ReferencePhotoUpload from "../components/photos/ReferencePhotoUpload";
import PhotoGallery from "../components/photos/PhotoGallery";
import ConsentForm from "../components/photos/ConsentForm";
import EventSelector from "../components/photos/EventSelector";
import StepIndicator from "@/components/ui/StepIndicator";

const STEPS = [
  { id: 1, label: 'Consentement', key: 'consent' },
  { id: 2, label: 'Selfie de référence', key: 'reference' },
  { id: 3, label: 'Sélection événement', key: 'event' },
  { id: 4, label: 'Recherche IA', key: 'search' }
];

export default function MyPhotos() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState("");
  const [userPhotos, setUserPhotos] = useState([]);
  const [hasConsent, setHasConsent] = useState(false);
  const [hasReferencePhoto, setHasReferencePhoto] = useState(false);
  const [hasSelectedEvent, setHasSelectedEvent] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  // ⭐ ÉTAT PROPRE - pas d'affichage initial
  const [aiSearchState, setAiSearchState] = useState({
    isLaunched: false,        // Contrôle l'affichage
    isSearching: false,       // Loading
    hasSearched: false,       // A déjà cherché
    foundPhotos: [],         // Résultats
    error: null
  });

  // --- Ajout des états UX pour la reconnaissance faciale ---
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [faceRecognitionResults, setFaceRecognitionResults] = useState([]);

  const resetAIResults = useCallback(() => {
    setAiSearchState(prev => ({
      ...prev,
      isLaunched: false,
      isSearching: false,
      hasSearched: false,
      foundPhotos: [],
      error: null
    }));
  }, []);

  // Ajout d'un useEffect pour forcer le reset au chargement initial
  useEffect(() => {
    resetAIResults();
  }, []);

  // Check URL params for pre-selected event
  const urlParams = new URLSearchParams(window.location.search);
  const preSelectedEvent = urlParams.get('selected_event');

  React.useEffect(() => {
    loadUserData();
    loadEvents();
    if (preSelectedEvent) {
      setSelectedEventId(preSelectedEvent);
      setHasSelectedEvent(true);
    }
  }, [preSelectedEvent]);

  const loadUserData = async () => {
    try {
      const user = await User.me();
      setCurrentUser(user);
      setHasConsent(user.consent_given || false);
      setHasReferencePhoto(!!user.reference_face_data?.reference_image_url);
    } catch (error) {
      console.error("Erreur lors du chargement des données utilisateur:", error);
    }
  };

  const loadEvents = async () => {
    try {
      const eventList = await Event.list("-date");
      setEvents(eventList);
    } catch (error) {
      console.error("Erreur lors du chargement des événements:", error);
    }
  };

  const handleConsentGiven = () => {
    setHasConsent(true);
    setStep('event');
  };

  const handleEventSelected = (eventId) => {
    setSelectedEventId(eventId);
    setHasSelectedEvent(true);
    setStep('gallery');
  };

  const handleGalleryFinished = () => {
    setStep('reference');
  };

  const handleReferencePhotoUploaded = () => {
    setHasReferencePhoto(true);
    loadUserData();
  };

  // Charger les photos de l'événement sélectionné (sans filtrer sur l'uploader)
  const loadUserPhotos = async (eventId) => {
    if (!currentUser || !eventId) return;
    try {
      const allPhotos = await Photo.list(eventId);
      console.log('ALL PHOTOS:', allPhotos);
      if (allPhotos.length > 0) {
        console.log('EXEMPLE PHOTO:', allPhotos[0]);
      }
      // Validation et normalisation
      const validPhotos = allPhotos
        .filter(photo =>
          photo &&
          (photo.url || photo.image_url)
        )
        .map(photo => ({
          ...photo,
          id: photo.id || photo._id || Math.random().toString(36).slice(2),
          url: photo.url || photo.image_url || "/placeholder.jpg",
          event_name: photo.event_name || 'Événement inconnu',
          confidence: typeof photo.confidence === "number" ? photo.confidence : 0.7,
          date: photo.date || photo.created_at || null,
        }));
      setUserPhotos(validPhotos);
    } catch (error) {
      console.error('Erreur lors du chargement des photos:', error);
      setUserPhotos([]);
    }
  };

  // Charger les photos quand l'événement est sélectionné
  useEffect(() => {
    if (selectedEventId) {
      resetAIResults();
      loadUserPhotos(selectedEventId);
    }
    // eslint-disable-next-line
  }, [selectedEventId]);

  useEffect(() => {
    return () => {
      resetAIResults();
    };
  }, [resetAIResults]);

  // Remplacer handleLaunchFaceRecognition par la version robuste
  const handleLaunchFaceRecognition = async () => {
    try {
      console.log('🔍 Démarrage reconnaissance faciale...');
      // Validation de l'événement sélectionné
      const selectedEvent = events.find(e => e.id === selectedEventId);
      if (!selectedEvent || !selectedEvent._id) {
        throw new Error('Veuillez sélectionner un événement avant de lancer la reconnaissance faciale');
      }
      const eventId = selectedEvent._id;
      console.log('📁 ID événement:', eventId);
      if (!eventId.match(/^[0-9a-fA-F]{24}$/)) {
        throw new Error(`ID d'événement invalide: ${eventId}. Format attendu: 24 caractères hexadécimaux.`);
      }
      setIsProcessing(true);
      setError(null);
      setSuccessMessage(null);
      setFaceRecognitionResults([]);
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      if (!token) {
        throw new Error('Token d\'authentification manquant. Veuillez vous reconnecter.');
      }
      const url = `/api/photos/search-by-face?eventId=${eventId}`;
      console.log('🌐 URL requête:', url);
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });
      console.log('📡 Statut réponse:', response.status);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: `Erreur HTTP ${response.status}` }));
        console.error('❌ Erreur réponse:', errorData);
        if (response.status === 400) {
          throw new Error(`Paramètres invalides: ${errorData.error || errorData.message}`);
        } else if (response.status === 401) {
          throw new Error('Non autorisé. Veuillez vous reconnecter.');
        } else if (response.status === 500) {
          throw new Error(`Erreur serveur: ${errorData.message || 'Erreur interne'}`);
        } else {
          throw new Error(`Erreur ${response.status}: ${errorData.error || 'Erreur inconnue'}`);
        }
      }
      const result = await response.json();
      console.log('✅ Résultat reconnaissance:', result);
      if (result.success) {
        const photos = result.photos || [];
        setFaceRecognitionResults(photos);
        if (photos.length === 0) {
          if (result.totalPhotos > 0) {
            setError(`Aucune photo avec reconnaissance faciale trouvée dans cet événement. ${result.totalPhotos} photos au total disponibles.`);
          } else {
            setError('Aucune photo trouvée dans cet événement.');
          }
        } else {
          setSuccessMessage(`${photos.length} photos trouvées avec reconnaissance faciale`);
        }
      } else {
        throw new Error(result.error || result.message || 'Reconnaissance faciale échouée');
      }
    } catch (error) {
      console.error('❌ Erreur reconnaissance faciale:', error);
      setError(error.message);
      setFaceRecognitionResults([]);
    } finally {
      setIsProcessing(false);
    }
  };

  // Ajout de la fonction pour déterminer l'étape courante
  function determineCurrentStep({ hasConsent, hasReferencePhoto, hasSelectedEvent }) {
    if (!hasConsent) return 1;
    if (!hasReferencePhoto) return 2;
    if (!hasSelectedEvent) return 3;
    return 4;
  }

  // Gestion de la progression automatique et du localStorage
  useEffect(() => {
    const savedStep = parseInt(localStorage.getItem('myphotos_currentStep'), 10);
    if (savedStep && savedStep >= 1 && savedStep <= 4) {
      setCurrentStep(savedStep);
    }
  }, []);

  useEffect(() => {
    const step = determineCurrentStep({ hasConsent, hasReferencePhoto, hasSelectedEvent });
    setCurrentStep(step);
    localStorage.setItem('myphotos_currentStep', step);
  }, [hasConsent, hasReferencePhoto, hasSelectedEvent]);

  // Gestion du scroll smooth vers la section active
  useEffect(() => {
    const section = document.getElementById(`step-section-${currentStep}`);
    if (section) {
      section.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [currentStep]);

  // Gestion des transitions automatiques
  useEffect(() => {
    if (currentStep === 1 && hasConsent) setCurrentStep(2);
    if (currentStep === 2 && hasReferencePhoto) setCurrentStep(3);
    if (currentStep === 3 && hasSelectedEvent) setCurrentStep(4);
  }, [hasConsent, hasReferencePhoto, hasSelectedEvent]);

  // Fonctions pour revenir à une étape précédente
  const goToStep = (stepId) => {
    setCurrentStep(stepId);
    localStorage.setItem('myphotos_currentStep', stepId);
  };

  if (!currentUser) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <UserIcon className="w-16 h-16 text-slate-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Connexion requise</h2>
          <p className="text-slate-600 mb-6">
            Vous devez être connecté pour rechercher vos photos.
          </p>
          <Button onClick={() => User.login()} className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
            Se connecter
          </Button>
        </div>
      </div>
    );
  }

  console.log('searchState:', aiSearchState);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Bouton Retour */}
      <div className="mb-6">
        <Button variant="outline" onClick={() => navigate(-1)}>
          ← Retour
        </Button>
      </div>
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
          Retrouvez Vos Photos
        </h1>
        <p className="text-xl text-slate-600 max-w-3xl mx-auto">
          Notre IA utilise la reconnaissance faciale pour identifier automatiquement 
          toutes vos photos dans les événements sélectionnés.
        </p>
      </div>
      {/* Step Indicator */}
      <StepIndicator steps={STEPS} currentStep={currentStep} onStepClick={goToStep} />
      {/* Étapes */}
      <div className="space-y-8">
        {currentStep === 1 && (
          <motion.div id="step-section-1" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <ConsentForm onConsentGiven={() => { setHasConsent(true); goToStep(2); }} />
          </motion.div>
        )}
        {currentStep === 2 && (
          <motion.div id="step-section-2" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <ReferencePhotoUpload onPhotoUploaded={() => { setHasReferencePhoto(true); goToStep(3); }} currentUser={currentUser} />
          </motion.div>
        )}
        {currentStep === 3 && (
          <motion.div id="step-section-3" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <EventSelector events={events} onEventSelected={(eventId) => { setSelectedEventId(eventId); setHasSelectedEvent(true); goToStep(4); }} />
          </motion.div>
        )}
        {currentStep === 4 && (
          <motion.div id="step-section-4" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-6 h-6 text-purple-500" />
                <span className="text-lg font-semibold text-slate-800">Recherche IA - DeepFace</span>
              </div>
              <div className="rounded-xl bg-gradient-to-r from-blue-50 to-purple-50 p-6 mb-6 shadow-sm">
                <div className="text-base font-medium text-slate-700 mb-2">
                  <span className="font-semibold">Événement sélectionné:</span> {events.find(e => e.id === selectedEventId)?.name || 'Aucun'}
                </div>
                <div className="text-slate-600 text-sm mb-2">
                  Notre IA va analyser toutes les photos de cet événement pour vous reconnaître
                </div>
                <div className="flex justify-center items-center mt-4">
                  <button 
                    onClick={handleLaunchFaceRecognition}
                    disabled={!selectedEventId || isProcessing}
                    className={`btn ${isProcessing ? 'btn-warning' : 'btn-primary'} bg-gradient-to-r from-purple-500 to-blue-500 text-white px-8 py-3 rounded-lg text-lg font-semibold shadow-md hover:from-purple-600 hover:to-blue-600 disabled:opacity-50`}
                    style={{ opacity: !selectedEventId ? 0.5 : 1, cursor: !selectedEventId ? 'not-allowed' : 'pointer' }}
                  >
                    {isProcessing ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                        🔍 Reconnaissance en cours...
                      </>
                    ) : (
                      '🚀 Lancer la reconnaissance faciale'
                    )}
                  </button>
                </div>
                {!selectedEventId && (
                  <div className="alert alert-info mt-2" style={{ fontSize: '14px' }}>
                    <i className="fas fa-info-circle me-1"></i>
                    Sélectionnez d'abord un événement pour lancer la reconnaissance faciale
                  </div>
                )}
                {successMessage && (
                  <div className="alert alert-success mt-2 d-flex align-items-center">
                    <i className="fas fa-check-circle me-2"></i>
                    {successMessage}
                    <button type="button" className="btn-close ms-auto" onClick={() => setSuccessMessage(null)}></button>
                  </div>
                )}
                {error && (
                  <div className="alert alert-danger mt-2 d-flex align-items-center">
                    <i className="fas fa-exclamation-triangle me-2"></i>
                    <div className="flex-grow-1">
                      <strong>Erreur:</strong> {error}
                      {process.env.NODE_ENV === 'development' && (
                        <small className="d-block mt-1 text-muted">Consultez la console pour plus de détails techniques</small>
                      )}
                    </div>
                    <button type="button" className="btn-close ms-2" onClick={() => setError(null)}></button>
                  </div>
                )}
              </div>
            </div>
            {faceRecognitionResults.length > 0 && (
              <div className="results-section mt-3">
                <h5 className="d-flex align-items-center">
                  <i className="fas fa-images me-2"></i>
                  Photos trouvées ({faceRecognitionResults.length})
                </h5>
                <div className="row g-2 mt-2">
                  {faceRecognitionResults.map((photo, index) => (
                    <div key={photo._id || index} className="col-md-3">
                      <div className="card h-100">
                        <img 
                          src={photo.url} 
                          alt={`Photo ${index + 1}`}
                          className="card-img-top"
                          style={{ height: '150px', objectFit: 'cover', cursor: 'pointer' }}
                          onError={(e) => {
                            e.target.src = '/api/placeholder-image.jpg';
                            console.warn('❌ Image non trouvée:', photo.url);
                          }}
                          // onClick={() => openPhotoModal(photo)} // Optionnel: modal de zoom
                        />
                        <div className="card-body p-2">
                          <small className="text-muted d-block">{photo.filename}</small>
                          {photo.faces && photo.faces.length > 0 && (
                            <small className="badge bg-primary">{photo.faces.length} visage(s)</small>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
} 

// ⭐ COMPOSANT STATIQUE - PAS DE REQUÊTES HTTP
const PhotoCardStatic = ({ photo }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Correction de l'URL d'image
  let imageUrl = photo.url;
  if (imageUrl && imageUrl.startsWith('/api/uploads/photos/')) {
    imageUrl = imageUrl.replace('/api/uploads/photos/', '/uploads/photos/');
  }

  const handleImageLoad = () => {
    setImageLoaded(true);
    setImageError(false);
  };

  const handleImageError = (e) => {
    console.warn('❌ Image non trouvée:', imageUrl);
    setImageError(true);
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="aspect-square relative bg-gray-100">
        {imageUrl && !imageError ? (
          <img
            src={imageUrl}
            alt={photo.originalname || 'Photo'}
            className="w-full h-full object-cover"
            onLoad={handleImageLoad}
            onError={handleImageError}
            style={{ display: imageLoaded ? 'block' : 'none' }}
          />
        ) : null}
        
        {(!imageUrl || imageError) && (
          // ⭐ PLACEHOLDER SVG STATIQUE - PAS DE REQUÊTE
          <div className="w-full h-full flex items-center justify-center bg-gray-200">
            <svg className="w-16 h-16 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
            </svg>
          </div>
        )}
        
        {!imageLoaded && imageUrl && !imageError && (
          <div className="w-full h-full animate-pulse bg-gray-300"></div>
        )}
      </div>
      
      <div className="p-4">
        <h3 className="font-medium text-gray-900">
          {photo.eventName}
        </h3>
        <p className="text-sm text-gray-500">
          {photo.uploadDate ? new Date(photo.uploadDate).toLocaleDateString() : 'Date inconnue'}
        </p>
        {photo.confidence && (
          <div className="mt-2">
            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
              Match: {Math.round(photo.confidence * 100)}%
            </span>
          </div>
        )}
        <div className="mt-3 flex space-x-2">
          <button className="flex-1 bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700">
            ⬇ Télécharger
          </button>
          <button className="flex-1 bg-gray-200 text-gray-700 px-3 py-1 rounded text-sm hover:bg-gray-300">
            📤 Partager  
          </button>
        </div>
      </div>
    </div>
  );
}; 