import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Photo, Event, User } from "@/entities/all";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu.jsx";
import { 
  Search, 
  Filter, 
  MoreHorizontal, 
  Trash2, 
  Eye, 
  Download,
  ImageIcon,
  Calendar,
  User as UserIcon
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { createPageUrl } from "@/utils";
import { motion, AnimatePresence } from "framer-motion";

export default function AdminPhotos() {
  const navigate = useNavigate();
  const { isAuthenticated, isAdmin, loading } = useAuth();
  const [photos, setPhotos] = useState([]);
  const [events, setevents] = useState([]);
  const [filteredPhotos, setFilteredPhotos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedevents, setSelectedevents] = useState("all");
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [isPhotoDialogOpen, setIsPhotoDialogOpen] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (!isAdmin) {
      navigate(createPageUrl("Home"));
      return;
    }
    loadData();
  }, [navigate, isAuthenticated, isAdmin, loading]);

  useEffect(() => {
    filterPhotos();
  }, [photos, searchTerm, selectedevents]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [photoList, eventsList] = await Promise.all([
        Photo.list("-created_date"),
        Event.list()
      ]);
      setPhotos(photoList);
      setevents(eventsList);
    } catch (error) {
      console.error("Erreur de chargement des données:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterPhotos = () => {
    let filtered = photos;

    if (searchTerm) {
      filtered = filtered.filter(photo =>
        photo.filename.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedevents !== "all") {
      filtered = filtered.filter(photo => photo.events_id === selectedevents);
    }

    setFilteredPhotos(filtered);
  };

  const deletePhoto = async (photoId) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cette photo ? Cette action est irréversible.")) {
      try {
        await Photo.delete(photoId);
        loadData();
      } catch (error) {
        console.error("Erreur lors de la suppression de la photo:", error);
      }
    }
  };

  const viewPhoto = (photo) => {
    setSelectedPhoto(photo);
    setIsPhotoDialogOpen(true);
  };

  const downloadPhoto = (photo) => {
    const link = document.createElement('a');
    link.href = photo.image_url;
    link.download = photo.filename;
    link.click();
  };

  const geteventsName = (eventsId) => {
    const event = events.find(e => e.id === eventsId);
    return event ? event.name : "Événement inconnu";
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Bibliothèque de Photos</h1>
          <p className="text-slate-600">Gérez toutes les photos uploadées sur la plateforme.</p>
        </div>
        {(isLoading || filteredPhotos.length > 0 || searchTerm || selectedevents !== "all") && (
          <div className="flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-full text-sm font-medium">
            <ImageIcon className="w-4 h-4" />
            <span>{filteredPhotos.length} photo{filteredPhotos.length !== 1 ? 's' : ''}</span>
          </div>
        )}
      </div>

      {/* Filters */}
      {isLoading || filteredPhotos.length > 0 || searchTerm || selectedevents !== "all" ? (
        <Card className="border-0 bg-white/70 backdrop-blur-sm shadow-lg mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-blue-600" />
              Filtres
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <Input
                  placeholder="Rechercher par nom de fichier..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={selectedevents} onValueChange={setSelectedevents}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrer par événement" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les événements</SelectItem>
                  {events.map(event => (
                    <SelectItem key={event.id || event._id || event.name} value={event.id}>
                      {event.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {/* Photos Grid */}
      {isLoading ? (
        <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {Array(12).fill(0).map((_, i) => (
            <Card key={i} className="overflow-hidden animate-pulse">
              <div className="aspect-square bg-slate-200"></div>
              <CardContent className="p-4">
                <div className="h-4 bg-slate-200 rounded mb-2"></div>
                <div className="h-3 bg-slate-200 rounded w-2/3"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredPhotos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 w-full border-4 border-red-500">
          <ImageIcon className="w-16 h-16 text-slate-400 mb-4" />
          <h3 className="text-xl font-semibold text-slate-700 mb-2">
            {isLoading ? "Chargement..." : (searchTerm || selectedevents !== "all" ? "Aucune photo trouvée" : "Aucune photo disponible")}
          </h3>
          <p className="text-slate-500">
            {isLoading
              ? "Chargement des photos, veuillez patienter."
              : (searchTerm || selectedevents !== "all" 
                ? "Essayez avec d'autres critères de recherche."
                : "Les photos apparaîtront ici une fois uploadées.")}
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
                      src={photo.thumbnail_url || photo.image_url || photo.url || '/placeholder.jpg'}
                      alt={photo.filename || photo.name || 'Photo'}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={e => { e.target.onerror = null; e.target.src = '/placeholder.jpg'; }}
                    />
                    
                    {/* Overlay with quick actions */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <div className="flex gap-2">
                        <Button
                          size="icon"
                          variant="secondary"
                          className="bg-white/90 hover:bg-white text-slate-800"
                          onClick={() => viewPhoto(photo)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="secondary"
                          className="bg-white/90 hover:bg-white text-slate-800"
                          onClick={() => downloadPhoto(photo)}
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Processing status */}
                    <div className="absolute top-2 left-2">
                      <Badge className={photo.is_processed ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}>
                        {photo.is_processed ? "Traité" : "En attente"}
                      </Badge>
                    </div>

                    {/* Actions menu */}
                    <div className="absolute top-2 right-2">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="bg-white/80 hover:bg-white text-slate-800 h-8 w-8"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => viewPhoto(photo)}>
                            <Eye className="w-4 h-4 mr-2" /> Voir
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => downloadPhoto(photo)}>
                            <Download className="w-4 h-4 mr-2" /> Télécharger
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => deletePhoto(photo.id)} 
                            className="text-red-600"
                          >
                            <Trash2 className="w-4 h-4 mr-2" /> Supprimer
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  {/* Photo Info */}
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-slate-900 mb-1 truncate">
                      {photo.filename}
                    </h3>
                    
                    <div className="space-y-2 text-sm text-slate-600">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>{geteventsName(photo.events_id)}</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <UserIcon className="w-4 h-4" />
                        <span>Uploadé le {format(new Date(photo.created_date), "d MMM yyyy", { locale: fr })}</span>
                      </div>

                      {photo.faces_detected && photo.faces_detected.length > 0 && (
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {photo.faces_detected.length} visage{photo.faces_detected.length !== 1 ? 's' : ''} détecté{photo.faces_detected.length !== 1 ? 's' : ''}
                          </Badge>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Photo Detail Dialog */}
      <Dialog open={isPhotoDialogOpen} onOpenChange={setIsPhotoDialogOpen}>
        <DialogContent className="max-w-4xl p-0 border-0">
          {selectedPhoto && (
            <div className="relative">
              <DialogHeader className="p-6 pb-0">
                <DialogTitle className="flex items-center gap-2">
                  <ImageIcon className="w-5 h-5" />
                  {selectedPhoto.filename}
                </DialogTitle>
              </DialogHeader>
              
              <div className="p-6">
                <div className="grid lg:grid-cols-2 gap-6">
                  {/* Photo */}
                  <div className="relative">
                    <img
                      src={selectedPhoto.image_url}
                      alt={selectedPhoto.filename}
                      className="w-full h-auto max-h-[60vh] object-contain rounded-lg"
                    />
                  </div>
                  
                  {/* Details */}
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-slate-900 mb-2">Informations</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-slate-600">Événement:</span>
                          <span className="font-medium">{geteventsName(selectedPhoto.events_id)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600">Date d'upload:</span>
                          <span className="font-medium">
                            {format(new Date(selectedPhoto.created_date), "d MMMM yyyy à HH:mm", { locale: fr })}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600">Statut:</span>
                          <Badge className={selectedPhoto.is_processed ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}>
                            {selectedPhoto.is_processed ? "Traité par l'IA" : "En attente de traitement"}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {selectedPhoto.faces_detected && selectedPhoto.faces_detected.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-slate-900 mb-2">Visages détectés</h4>
                        <div className="text-sm text-slate-600">
                          {selectedPhoto.faces_detected.length} visage{selectedPhoto.faces_detected.length !== 1 ? 's' : ''} identifié{selectedPhoto.faces_detected.length !== 1 ? 's' : ''} avec confiance moyenne de{' '}
                          {selectedPhoto.faces_detected.length > 0 && (
                            Math.round(selectedPhoto.faces_detected.reduce((acc, face) => acc + (face.confidence || 0), 0) / selectedPhoto.faces_detected.length * 100)
                          )}%
                        </div>
                      </div>
                    )}

                    {selectedPhoto.tags && selectedPhoto.tags.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-slate-900 mb-2">Tags</h4>
                        <div className="flex flex-wrap gap-2">
                          {selectedPhoto.tags.map((tag, index) => (
                            <Badge key={index} variant="secondary">{tag}</Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex gap-3 pt-4">
                      <Button
                        onClick={() => downloadPhoto(selectedPhoto)}
                        className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Télécharger
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => {
                          deletePhoto(selectedPhoto.id);
                          setIsPhotoDialogOpen(false);
                        }}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Supprimer
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}