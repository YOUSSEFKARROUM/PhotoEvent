import React, { useState, useEffect } from "react";
import { Photo, Event } from "@/entities/all";
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
import PhotoCard from "../components/PhotoCard";

// Configuration - adjust these values to match your server setup
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const UPLOADS_PATH = '/uploads'; // Match your actual server path

// Helper pour corriger l'URL de l'image
const getImageUrl = (photoUrl) => {
    if (!photoUrl) return '/placeholder.jpg';
    // Replace example.com with your real server base URL
    if (photoUrl.includes('example.com')) {
        photoUrl = photoUrl.replace('https://example.com', API_BASE_URL).replace('http://example.com', API_BASE_URL);
    }
    // Si l'URL est déjà complète, la retourner telle quelle
    if (photoUrl.startsWith('http://') || photoUrl.startsWith('https://')) {
        return photoUrl;
    }
    // Si l'URL commence par /, c'est un chemin absolu
    if (photoUrl.startsWith('/')) {
        return `${API_BASE_URL}${photoUrl}`;
    }
    // Sinon, construire l'URL complète
    const filename = photoUrl.includes('/') ? photoUrl.split('/').pop() : photoUrl;
    return `${API_BASE_URL}${UPLOADS_PATH}/${filename}`;
};

// Composant Image avec gestion d'erreur améliorée
function ImageWithFallback({ src, alt, className, ...props }) {
    const [imgSrc, setImgSrc] = React.useState(src);
    const [hasError, setHasError] = React.useState(false);
    const [isLoading, setIsLoading] = React.useState(true);
    
    React.useEffect(() => {
        setImgSrc(src);
        setHasError(false);
        setIsLoading(true);
    }, [src]);
    
    const handleError = () => {
        setHasError(true);
        setIsLoading(false);
        setImgSrc('/placeholder.jpg');
    };
    
    const handleLoad = () => {
        setHasError(false);
        setIsLoading(false);
    };
    
    return (
        <div className="relative">
            <img
                src={imgSrc}
                alt={alt}
                onError={handleError}
                onLoad={handleLoad}
                className={className}
                {...props}
            />
            {isLoading && (
                <div className="absolute inset-0 bg-gray-200 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
            )}
            {hasError && (
                <div className="absolute inset-0 bg-gray-200 flex items-center justify-center">
                    <span className="text-gray-500">Image non trouvée</span>
                </div>
            )}
        </div>
    );
}

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
      navigate(createPageUrl("eventss"));
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
      const eventss = await Event.list();
      const currentevents = eventss.find(e => (e.id?.toString() === eventsId || e._id?.toString() === eventsId));
      
      if (!currentevents) {
        navigate(createPageUrl("eventss"));
        return;
      }
      
      setevents(currentevents);

      // Load photos for this events
      const eventsPhotos = await Photo.list(eventsId);
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
    const imageUrl = getImageUrl(photo.url || photo.image_url);
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = photo.filename || 'photo.jpg';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const sharePhoto = async (photo) => {
    const imageUrl = getImageUrl(photo.url || photo.image_url);
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Photo de ${events?.name}`,
          text: 'Regardez cette super photo !',
          url: imageUrl,
        });
      } catch (error) {
        console.log('Partage annulé');
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(imageUrl);
        alert('Lien copié dans le presse-papier !');
      } catch (error) {
        console.error('Erreur lors de la copie:', error);
        alert('Impossible de copier le lien');
      }
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
        <Link to={createPageUrl("eventss")}>
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
        <Link to={createPageUrl("eventss")}> 
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
            {events.status && (
              <Badge className="bg-blue-100 text-blue-800 text-xs font-semibold">
                {events.status}
              </Badge>
            )}
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
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredPhotos.map(photo => (
            <PhotoCard
              key={photo.id || photo._id}
              photo={{
                url: getImageUrl(photo.url || photo.image_url),
                name: photo.filename || photo.name,
                date: photo.createdAt ? format(new Date(photo.createdAt), 'dd MMM yyyy', { locale: fr }) : '',
              }}
              isFavorite={favorites.has(photo.id || photo._id)}
              onFavorite={() => toggleFavorite(photo.id || photo._id)}
              onDownload={() => downloadPhoto(photo)}
              onShare={() => sharePhoto(photo)}
              onZoom={() => setSelectedPhoto(photo)}
            />
          ))}
        </div>
      )}
    </div>
  );
}