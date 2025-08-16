import React, { useState, useRef } from "react";
import { useLocation, Navigate } from "react-router-dom";
import { Event, Photo } from "@/entities/all";
import { UploadFile } from "@/integrations/Core";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import {
  Upload as UploadIcon,
  Camera,
  Image,
  X,
  CheckCircle,
  AlertCircle,
  Plus,
  FolderOpen
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import UploadProgress from "@/components/photos/UploadProgress";
import { compressImage } from "@/utils/imageUtils";
import { getToken, isTokenExpired, checkAuthBeforeOperation } from "@/utils/auth";
import { DebugPanel } from "@/components/ui/debug-panel";

export default function Upload() {
  const location = useLocation();
  const { user, isAdmin, loading } = useAuth();
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploadProgress, setUploadProgress] = useState({});
  const [isUploading, setIsUploading] = useState(false);
  const [events, seteventss] = useState([]);
  const [selectedeventsId, setSelectedeventsId] = useState("");
  const [showNeweventsForm, setShowNeweventsForm] = useState(false);
  const [newevents, setNewevents] = useState({
    name: "",
    description: "",
    date: "",
    location: "",
    photographer_email: ""
  });
  const fileInputRef = useRef(null);
  const dragCounter = useRef(0);
  const [isDragActive, setIsDragActive] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [progressStep, setProgressStep] = useState({});

  React.useEffect(() => {
    loadeventss();
  }, []);

  // Pré-sélectionner l'événement si paramètre events dans l'URL
  React.useEffect(() => {
    const params = new URLSearchParams(location.search);
    const eventsId = params.get("events");
    if (eventsId) {
      setSelectedeventsId(eventsId);
    }
  }, [location.search]);

  const loadeventss = async () => {
    try {
      const eventsList = await Event.list();
      seteventss(eventsList);
    } catch (error) {
      console.error("Erreur lors du chargement des événements:", error);
    }
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current++;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragActive(true);
    }
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setIsDragActive(false);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    dragCounter.current = 0;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const files = Array.from(e.dataTransfer.files).filter(file =>
        file.type.startsWith('image/')
      );
      addFiles(files);
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      addFiles(files);
    }
  };

  const addFiles = (files) => {
    const newFiles = files.map(file => ({
      file,
      id: Math.random().toString(36).substr(2, 9),
      preview: URL.createObjectURL(file),
      status: 'pending',
      error: null, // Ajout du champ pour le message d'erreur
    }));
    setSelectedFiles(prev => [...prev, ...newFiles]);
  };

  const removeFile = (id) => {
    setSelectedFiles(prev => {
      const file = prev.find(f => f.id === id);
      if (file) {
        URL.revokeObjectURL(file.preview);
      }
      return prev.filter(f => f.id !== id);
    });
  };

  const createNewevents = async () => {
    try {
      // Adapter les champs pour l'API backend
      const eventsToSend = {
        name: newevents.name,
        description: newevents.description,
        date: newevents.date,
        location: newevents.location,
        photographerEmail: newevents.photographer_email
      };
      const events = await Event.create(eventsToSend);
      seteventss(prev => [events, ...prev]);
      setSelectedeventsId(events.id);
      setShowNeweventsForm(false);
      setNewevents({
        name: "",
        description: "",
        date: "",
        location: "",
        photographer_email: ""
      });
      return events;
    } catch (error) {
      console.error("Erreur lors de la création de l'événement:", error);
      throw error;
    }
  };

  const uploadFiles = async () => {
    if (selectedFiles.length === 0) return;
    
    // Vérifier l'authentification avant l'upload
    try {
      checkAuthBeforeOperation();
    } catch (error) {
      setErrorMessage(error.message);
      return;
    }
    
    let eventsId = selectedeventsId;
    
    // Create new events if needed
    if (showNeweventsForm) {
      try {
        const events = await createNewevents();
        eventsId = events.id;
      } catch (error) {
        setErrorMessage("Erreur lors de la création de l'événement");
        return;
      }
    }

    if (!eventsId) {
      setErrorMessage("Veuillez sélectionner un événement");
      return;
    }

    setIsUploading(true);

    for (const fileData of selectedFiles) {
      let progressInterval; // Déclarer la variable ici
      try {
        setUploadProgress(prev => ({ ...prev, [fileData.id]: 0 }));
        setProgressStep(prev => ({ ...prev, [fileData.id]: 0 }));
        // Compression côté client
        setProgressStep(prev => ({ ...prev, [fileData.id]: 0 }));
        setUploadProgress(prev => ({ ...prev, [fileData.id]: 10 }));
        const compressedBlob = await compressImage(fileData.file);
        const compressedFile = new File([compressedBlob], fileData.file.name, { type: 'image/jpeg' });
        setUploadProgress(prev => ({ ...prev, [fileData.id]: 20 }));
        setProgressStep(prev => ({ ...prev, [fileData.id]: 1 }));
        // Simulate progress
        progressInterval = setInterval(() => {
          setUploadProgress(prev => ({
            ...prev,
            [fileData.id]: Math.min(90, (prev[fileData.id] || 0) + 10)
          }));
        }, 200);
        // Upload file
        const { file_url } = await UploadFile(compressedFile, eventsId, {});
        setProgressStep(prev => ({ ...prev, [fileData.id]: 2 }));
        // Create photo record
        try {
          const result = await Photo.create(compressedFile, eventsId, '');
          setErrorMessage(''); // Clear previous errors
        } catch (error) {
          console.error('Erreur détaillée:', error);
          setErrorMessage(error.message || "Erreur lors de l'upload"); // Affiche le message détaillé du backend
        }

        clearInterval(progressInterval);
        setUploadProgress(prev => ({ ...prev, [fileData.id]: 100 }));
        setProgressStep(prev => ({ ...prev, [fileData.id]: 3 }));
        
        setSelectedFiles(prev =>
          prev.map(f => f.id === fileData.id ? { ...f, status: 'completed' } : f)
        );

      } catch (error) {
        if (progressInterval) {
          clearInterval(progressInterval);
        }
        console.error('Erreur upload:', error);
        
        // Gestion spécifique des erreurs d'authentification
        if (error.message && (error.message.includes('Session expirée') || error.message.includes('Token expiré'))) {
          setErrorMessage(error.message);
          setSelectedFiles(prev =>
            prev.map(f => f.id === fileData.id ? { ...f, status: 'error', error: 'Erreur d\'authentification' } : f)
          );
        } else {
          setErrorMessage(error.message || "Erreur lors de l'upload");
          setSelectedFiles(prev =>
            prev.map(f => f.id === fileData.id ? { ...f, status: 'error', error: error.message } : f)
          );
        }
      }
    }
    
    setIsUploading(false);
  };

  if (!loading && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
          Upload de Photos
        </h1>
        <p className="text-xl text-slate-600 max-w-3xl mx-auto">
          Uploadez vos photos d'événement. Notre IA analysera automatiquement les visages 
          pour permettre aux participants de retrouver leurs photos.
        </p>
      </div>

      {/* Affichage des erreurs */}
      {errorMessage && (
        <Alert variant={errorMessage.includes('Session expirée') || errorMessage.includes('Token expiré') ? 'destructive' : 'warning'} className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {errorMessage}
            {(errorMessage.includes('Session expirée') || errorMessage.includes('Token expiré')) && (
              <div className="mt-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => window.location.href = '/login'}
                  className="text-xs"
                >
                  Se reconnecter
                </Button>
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid lg:grid-cols-2 gap-8">
        {/* events Selection */}
        <Card className="border-0 bg-white/70 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="w-6 h-6 text-blue-600" />
              Sélectionner un événement
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!showNeweventsForm ? (
              <>
                <div>
                  {/* Suppression de l'affichage debug JSON */}
                  <Label htmlFor="events-select">Événement existant</Label>
                  <select
                    id="events-select"
                    value={selectedeventsId}
                    onChange={e => setSelectedeventsId(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    required
                  >
                    <option value="" disabled>-- Sélectionner un événement --</option>
                    {events.map(event => (
                      <option key={event._id || event.id} value={event._id || event.id}>
                        {event.name} - {event.date ? new Date(event.date).toLocaleDateString() : ''}
                      </option>
                    ))}
                  </select>
                </div>
                
                <Button
                  variant="outline"
                  onClick={() => setShowNeweventsForm(true)}
                  className="w-full"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Créer un nouvel événement
                </Button>
              </>
            ) : (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="events-name">Nom de l'événement *</Label>
                  <Input
                    id="events-name"
                    value={newevents.name}
                    onChange={(e) => setNewevents(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Ex: Mariage Sarah & Tom"
                  />
                </div>

                <div>
                  <Label htmlFor="events-date">Date *</Label>
                  <Input
                    id="events-date"
                    type="date"
                    value={newevents.date}
                    onChange={(e) => setNewevents(prev => ({ ...prev, date: e.target.value }))}
                  />
                </div>

                <div>
                  <Label htmlFor="events-location">Lieu</Label>
                  <Input
                    id="events-location"
                    value={newevents.location}
                    onChange={(e) => setNewevents(prev => ({ ...prev, location: e.target.value }))}
                    placeholder="Ex: Château de Versailles"
                  />
                </div>

                <div>
                  <Label htmlFor="photographer-email">Email du photographe *</Label>
                  <Input
                    id="photographer-email"
                    type="email"
                    value={newevents.photographer_email}
                    onChange={(e) => setNewevents(prev => ({ ...prev, photographer_email: e.target.value }))}
                    placeholder="photographe@example.com"
                  />
                </div>

                <div>
                  <Label htmlFor="events-description">Description</Label>
                  <Textarea
                    id="events-description"
                    value={newevents.description}
                    onChange={(e) => setNewevents(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Description de l'événement..."
                    rows={3}
                  />
                </div>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setShowNeweventsForm(false)}
                    className="flex-1"
                  >
                    Annuler
                  </Button>
                  <Button
                    onClick={async () => {
                      if (newevents.name && newevents.date && newevents.photographer_email) {
                        try {
                          const events = await createNewevents();
                          setSelectedeventsId(events.id || events._id);
                          setShowNeweventsForm(false);
                        } catch (error) {
                          alert("Erreur lors de la création de l'événement");
                        }
                      }
                    }}
                    disabled={!newevents.name || !newevents.date || !newevents.photographer_email}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                  >
                    Valider
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* File Upload */}
        <Card className="border-0 bg-white/70 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UploadIcon className="w-6 h-6 text-blue-600" />
              Sélectionner les photos
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Upload Zone */}
            <div
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 ${
                isDragActive
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-slate-300 hover:border-slate-400'
              }`}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              
              <div className="space-y-4">
                <div className="w-16 h-16 mx-auto bg-slate-100 rounded-full flex items-center justify-center">
                  <Image className="w-8 h-8 text-slate-500" />
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">
                    Glissez vos photos ici
                  </h3>
                  <p className="text-slate-600 mb-4">
                    ou cliquez pour sélectionner des fichiers
                  </p>
                </div>
                
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  variant="outline"
                  className="border-blue-300 text-blue-600 hover:bg-blue-50"
                >
                  <FolderOpen className="w-4 h-4 mr-2" />
                  Parcourir les fichiers
                </Button>
                
                <p className="text-xs text-slate-500">
                  Formats supportés: JPG, PNG, WEBP
                </p>
              </div>
            </div>

            {/* Selected Files */}
            <AnimatePresence>
              {selectedFiles.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-6 space-y-3"
                >
                  <h4 className="font-semibold text-slate-900">
                    Photos sélectionnées ({selectedFiles.length})
                  </h4>
                  
                  <div className="max-h-64 overflow-y-auto space-y-2">
                    {selectedFiles.map((fileData) => (
                      <motion.div
                        key={fileData.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg"
                      >
                        <img
                          src={fileData.preview}
                          alt="Preview"
                          className="w-12 h-12 object-cover rounded"
                        />
                        
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-900 truncate">
                            {fileData.file.name}
                          </p>
                          <p className="text-xs text-slate-500">
                            {(fileData.file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                          
                          {fileData.status === 'error' && fileData.error && (
                            <p className="text-xs text-red-600 mt-1">
                              {fileData.error}
                            </p>
                          )}

                          {uploadProgress[fileData.id] !== undefined && (
                            <div className="mt-1">
                              <UploadProgress 
                                step={progressStep[fileData.id] || 0} 
                                progress={uploadProgress[fileData.id]} 
                              />
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {fileData.status === 'completed' && (
                            <CheckCircle className="w-5 h-5 text-green-500" />
                          )}
                          {fileData.status === 'error' && (
                            <AlertCircle className="w-5 h-5 text-red-500" />
                          )}
                          {!isUploading && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeFile(fileData.id)}
                              className="h-8 w-8"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                  
                  <Button
                    onClick={uploadFiles}
                    disabled={isUploading || (!selectedeventsId && !showNeweventsForm)}
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                  >
                    {isUploading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Upload en cours...
                      </>
                    ) : (
                      <>
                        <UploadIcon className="w-4 h-4 mr-2" />
                        Uploader {selectedFiles.length} photo{selectedFiles.length > 1 ? 's' : ''}
                      </>
                    )}
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </div>

      {/* Info Section */}
      <div className="mt-12">
        <Alert className="border-blue-200 bg-blue-50">
          <AlertCircle className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            <strong>Traitement automatique :</strong> Une fois uploadées, vos photos seront automatiquement 
            analysées par notre IA pour détecter les visages. Ce processus peut prendre quelques minutes 
            selon le nombre de photos.
          </AlertDescription>
        </Alert>
      </div>
      
      {/* Debug Panel - visible seulement en mode développement */}
      {import.meta.env.DEV && <DebugPanel isVisible={true} />}
    </div>
  );
}