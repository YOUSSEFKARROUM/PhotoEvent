import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Download, 
  Heart, 
  Share2, 
  ZoomIn,
  Calendar,
  Star,
  X
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function PhotoGallery({ photos }) {
  const [favorites, setFavorites] = useState(new Set());
  const [selectedPhoto, setSelectedPhoto] = useState(null);

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
    link.href = photo.url;
    link.download = `photo-${photo.event_name}-${photo.id}.jpg`;
    link.click();
  };

  const sharePhoto = async (photo) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Photo de ${photo.event_name}`,
          text: 'Regardez cette super photo !',
          url: photo.url,
        });
      } catch (error) {
        console.log('Partage annulé');
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(photo.url);
      alert('Lien copié dans le presse-papier !');
    }
  };

  const getConfidenceColor = (confidence) => {
    if (confidence >= 0.9) return "bg-green-100 text-green-800 border-green-200";
    if (confidence >= 0.8) return "bg-yellow-100 text-yellow-800 border-yellow-200";
    return "bg-orange-100 text-orange-800 border-orange-200";
  };

  const getConfidenceText = (confidence) => {
    const percent = Math.round(confidence * 100);
    if (percent >= 90) return `${percent}% - Excellente correspondance`;
    if (percent >= 80) return `${percent}% - Bonne correspondance`;
    return `${percent}% - Correspondance possible`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="border-0 bg-white/70 backdrop-blur-sm shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="w-6 h-6 text-yellow-500" />
            Vos Photos Trouvées ({photos.length})
          </CardTitle>
          <p className="text-slate-600">
            Notre IA a identifié ces photos où vous apparaissez. Les résultats sont triés par niveau de confiance.
          </p>
        </CardHeader>

        <CardContent>
          {photos.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-700 mb-2">
                Aucune photo trouvée
              </h3>
              <p className="text-slate-500">
                Lancez une nouvelle recherche ou vérifiez votre photo de référence.
              </p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {photos.map((photo, index) => (
                <motion.div
                  key={photo.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="group"
                >
                  <div className="relative overflow-hidden rounded-xl bg-white shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                    {/* Photo */}
                    <div className="relative aspect-square overflow-hidden">
                      <img
                        src={photo.thumbnail_url || photo.url}
                        alt={`Photo de ${photo.event_name}`}
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
                                  src={photo.url}
                                  alt={`Photo de ${photo.event_name}`}
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
                    </div>

                    {/* Photo Info */}
                    <div className="p-4 space-y-3">
                      <div>
                        <h3 className="font-semibold text-slate-900 mb-1">
                          {photo.event_name}
                        </h3>
                        
                        <div className="flex items-center gap-2 text-sm text-slate-600 mb-2">
                          <Calendar className="w-4 h-4" />
                          {new Date(photo.date).toLocaleDateString('fr-FR')}
                        </div>
                      </div>

                      {/* Confidence Badge */}
                      <Badge 
                        className={`${getConfidenceColor(photo.confidence)} border text-xs font-medium`}
                      >
                        {getConfidenceText(photo.confidence)}
                      </Badge>

                      {/* Action Buttons */}
                      <div className="flex gap-2 pt-2">
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
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* Summary */}
          {photos.length > 0 && (
            <div className="mt-8 p-4 bg-slate-50 rounded-xl">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-slate-900">{photos.length}</div>
                  <div className="text-sm text-slate-600">Photos trouvées</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">
                    {photos.filter(p => p.confidence >= 0.9).length}
                  </div>
                  <div className="text-sm text-slate-600">Correspondances parfaites</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-red-500">{favorites.size}</div>
                  <div className="text-sm text-slate-600">Favoris</div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
} 