import React, { useState, useEffect } from "react";
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

export default function MyPhotos() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState("");
  const [foundPhotos, setFoundPhotos] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasConsent, setHasConsent] = useState(false);
  const [hasReferencePhoto, setHasReferencePhoto] = useState(false);
  const [hasSelectedEvent, setHasSelectedEvent] = useState(false);
  // Ajout d'un nouvel état pour contrôler l'étape courante
  const [step, setStep] = useState('consent'); // 'consent' | 'event' | 'gallery' | 'reference'

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

  const simulatePhotoSearch = async () => {
    if (!selectedEventId) return;
    
    setIsSearching(true);
    // Simulation d'une recherche IA avec DeepFace
    setTimeout(() => {
      const selectedEvent = events.find(e => e.id === selectedEventId);
      const eventName = selectedEvent ? selectedEvent.name : "Événement";
      
      setFoundPhotos([
        {
          id: "1",
          url: "https://images.unsplash.com/photo-1583394838336-acd977736f90?w=400",
          thumbnail_url: "https://images.unsplash.com/photo-1583394838336-acd977736f90?w=200",
          event_name: eventName,
          confidence: 0.95,
          date: selectedEvent?.date || "2024-01-15"
        },
        {
          id: "2", 
          url: "https://images.unsplash.com/photo-1511578314322-379afb476865?w=400",
          thumbnail_url: "https://images.unsplash.com/photo-1511578314322-379afb476865?w=200",
          event_name: eventName,
          confidence: 0.92,
          date: selectedEvent?.date || "2024-01-10"
        },
        {
          id: "3",
          url: "https://images.unsplash.com/photo-1464207687429-7505649dae38?w=400", 
          thumbnail_url: "https://images.unsplash.com/photo-1464207687429-7505649dae38?w=200",
          event_name: eventName,
          confidence: 0.89,
          date: selectedEvent?.date || "2024-01-08"
        }
      ]);
      setIsSearching(false);
    }, 3000); // Plus long pour simuler l'IA
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

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
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

      {/* Étapes */}
      <div className="space-y-8">
        {step === 'consent' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <ConsentForm onConsentGiven={handleConsentGiven} />
          </motion.div>
        )}
        {step === 'event' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <EventSelector events={events} onEventSelected={handleEventSelected} />
          </motion.div>
        )}
        {step === 'gallery' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <PhotoGallery photos={foundPhotos} />
            <Button className="mt-6" onClick={handleGalleryFinished}>Continuer</Button>
          </motion.div>
        )}
        {step === 'reference' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <ReferencePhotoUpload onPhotoUploaded={handleReferencePhotoUploaded} currentUser={currentUser} />
          </motion.div>
        )}
      </div>
    </div>
  );
} 