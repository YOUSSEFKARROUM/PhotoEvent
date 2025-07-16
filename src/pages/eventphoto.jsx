import React, { useState, useEffect } from "react";
import { Photo, events } from "@/entities/all";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  ArrowLeft, 
  Search, 
  Download, 
  Heart, 
  Share2, 
  ZoomIn,
  Camera,
  Calendar,
  MapPin,
  Users,
  X
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion, AnimatePresence } from "framer-motion";

export default function eventsPhotos() {
  const navigate = useNavigate();
  const [events, setevents] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [filteredPhotos, setFilteredPhotos] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [favorites, setFavorites] = useState(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState(null);

  // Get events ID from URL params
  const urlParams = new URLSearchParams(window.location.search);
  const eventsId = urlParams.get('events_id');

  useEffect(() => {
    if (!eventsId) {
      navigate(createPageUrl("events"));
      return;
    }
    loadeventsData();
  }, [eventsId, navigate]);

  useEffect(() => {
    filterPhotos();
  }, [photos, searchTerm]);

  const loadeventsData = async () => {
    setIsLoading(true);
    try {
      // Load events details
      const eventss = await events.list();
      const currentevents = eventss.find(e => e.id === eventsId);
      
      if (!currentevents) {
        navigate(createPageUrl("events"));
        return;
      }
      
      setevents(currentevents);

      // Load photos for this events
      const allPhotos = await Photo.list("-created_date");
      const eventsPhotos = allPhotos.filter(photo => photo.events_id === eventsId);
      setPhotos(eventsPhotos);
    } catch (error) {
      console.error("Erreur lors du chargement des données de l'événement:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterPhotos = () => {
    if (!searchTerm) {
      setFilteredPhotos(photos);
    } else {
      const filtered = photos.filter(photo =>
        photo.filename.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (photo.tags && photo.tags.some(tag => 
          tag.toLowerCase().includes(searchTerm.toLowerCase())
        ))
      );
      setFilteredPhotos(filtered);
    }
  };

  const toggleFavorite = (photoId) => {
    setFavorites(prev => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(photoId)) {
        newFavorites.delete(photoId);
      } else {
        newFavorites.add(photoId);
      }
      return newFavorites;
    });
  };

  const downloadPhoto = (photo) => {
    const link = document.createElement('a');
    link.href = photo.image_url;
    link.download = photo.filename;
    link.click();
  };

  const sharePhoto = async (photo) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Photo de ${events?.name}`,
          text: 'Regardez cette super photo !',
          url: photo.image_url,
        });
      } catch (error) {
        console.log('Partage annulé');
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(photo.image_url);
      alert('Lien copié dans le presse-papier !');
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="animate-pulse">
          <div className="h-8 bg-slate-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-slate-200 rounded w-1/2 mb-8"></div>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {Array(12).fill(0).map((_, i) => (
              <div key={i} className="aspect-square bg-slate-200 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!events) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
        <Camera className="w-16 h-16 text-slate-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-slate-900 mb-4">Événement introuvable</h2>
        <p className="text-slate-600 mb-6">
          L'événement que vous recherchez n'existe pas ou a été supprimé.
        </p>
        <Link to={createPageUrl("events")}>
          <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
            Retour aux événements
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link to={createPageUrl("events")}>
          <Button variant="outline" size="icon">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">
            {events.name}
          </h1>
          <div className="flex flex-wrap items-center gap-4 text-slate-600">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>{format(new Date(events.date), "d MMMM yyyy", { locale: fr })}</span>
            </div>
            {events.location && (
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                <span>{events.location}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span>{events.photographer_email}</span>
            </div>
          </div>
        </div>
      </div>

      {/* events Description */}
      {events.description && (
        <Card className="border-0 bg-white/70 backdrop-blur-sm shadow-lg mb-8">
          <CardContent className="p-6">
            <p className="text-slate-700">{events.description}</p>
          </CardContent>
        </Card>
      )}

      {/* Search */}
      <Card className="border-0 bg-white/70 backdrop-blur-sm shadow-lg mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5 text-blue-600" />
            Rechercher dans les photos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
            <Input
              placeholder="Rechercher par nom de fichier ou tags..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Photos Count */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Camera className="w-5 h-5 text-slate-600" />
          <span className="text-slate-700 font-medium">
            {filteredPhotos.length} photo{filteredPhotos.length !== 1 ? 's' : ''} 
            {searchTerm && ` trouvée${filteredPhotos.length !== 1 ? 's' : ''}`}
          </span>
        </div>
        {favorites.size > 0 && (
          <Badge className="bg-red-100 text-red-800">
            {favorites.size} favori{favorites.size !== 1 ? 's' : ''}
          </Badge>
        )}
      </div>

      {/* Photos Grid */}
      {filteredPhotos.length === 0 ? (
        <div className="text-center py-16">
          <Camera className="w-16 h-16 text-slate-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-slate-700 mb-2">
            {searchTerm ? "Aucune photo trouvée" : "Aucune photo disponible"}
          </h3>
          <p className="text-slate-500">
            {searchTerm 
              ? "Essayez avec d'autres termes de recherche." 
              : "Les photos de cet événement apparaîtront ici une fois uploadées."}
          </p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          <AnimatePresence>
            {filteredPhotos.map((photo, index) => (
              <motion.div
                key={photo.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <Card className="group overflow-hidden border-0 bg-white/70 backdrop-blur-sm hover:bg-white hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                  {/* Photo */}
                  <div className="relative aspect-square overflow-hidden">
                    <img
                      src={photo.thumbnail_url || photo.image_url}
                      alt={photo.filename}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    
                    {/* Overlay with actions */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <div className="flex gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              size="icon"
                              variant="secondary"
                              className="bg-white/90 hover:bg-white text-slate-800"
                              onClick={() => setSelectedPhoto(photo)}
                            >
                              <ZoomIn className="w-4 h-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl p-0 border-0">
                            <div className="relative">
                              <img
                                src={photo.image_url}
                                alt={photo.filename}
                                className="w-full h-auto max-h-[80vh] object-contain"
                              />
                              <Button
                                size="icon"
                                variant="secondary"
                                className="absolute top-4 right-4"
                                onClick={() => setSelectedPhoto(null)}
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>

                        <Button
                          size="icon"
                          variant="secondary"
                          className="bg-white/90 hover:bg-white text-slate-800"
                          onClick={() => downloadPhoto(photo)}
                        >
                          <Download className="w-4 h-4" />
                        </Button>

                        <Button
                          size="icon"
                          variant="secondary"
                          className="bg-white/90 hover:bg-white text-slate-800"
                          onClick={() => sharePhoto(photo)}
                        >
                          <Share2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Favorite button */}
                    <Button
                      size="icon"
                      variant="ghost"
                      className={`absolute top-3 right-3 ${
                        favorites.has(photo.id)
                          ? 'text-red-500 bg-white/80'
                          : 'text-white bg-black/20 hover:bg-black/40'
                      }`}
                      onClick={() => toggleFavorite(photo.id)}
                    >
                      <Heart className={`w-4 h-4 ${favorites.has(photo.id) ? 'fill-current' : ''}`} />
                    </Button>

                    {/* Processing status */}
                    {photo.is_processed && (
                      <div className="absolute top-3 left-3">
                        <Badge className="bg-green-100 text-green-800 text-xs">
                          IA
                        </Badge>
                      </div>
                    )}
                  </div>

                  {/* Photo Info */}
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-slate-900 mb-2 truncate">
                      {photo.filename}
                    </h3>
                    
                    <div className="text-sm text-slate-600 mb-3">
                      Uploadé le {format(new Date(photo.created_date), "d MMM yyyy", { locale: fr })}
                    </div>

                    {photo.faces_detected && photo.faces_detected.length > 0 && (
                      <Badge variant="outline" className="text-xs mb-3">
                        {photo.faces_detected.length} visage{photo.faces_detected.length !== 1 ? 's' : ''}
                      </Badge>
                    )}

                    {/* Tags */}
                    {photo.tags && photo.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {photo.tags.slice(0, 3).map((tag, tagIndex) => (
                          <Badge key={tagIndex} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {photo.tags.length > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{photo.tags.length - 3}
                          </Badge>
                        )}
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => downloadPhoto(photo)}
                        className="flex-1 text-xs"
                      >
                        <Download className="w-3 h-3 mr-1" />
                        Télécharger
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => sharePhoto(photo)}
                        className="flex-1 text-xs"
                      >
                        <Share2 className="w-3 h-3 mr-1" />
                        Partager
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}