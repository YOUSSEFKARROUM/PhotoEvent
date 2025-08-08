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
} from "@/components/ui/dialog";

// Remplacer le composant PhotoGallery par la version robuste
export default function PhotoGallery({ photos = [], onPhotoSelect }) {
  if (!Array.isArray(photos) || photos.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>Aucune photo à afficher</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {photos.map((photo, index) => (
        <PhotoCard 
          key={photo._id || photo.id || index} 
          photo={photo} 
          onSelect={onPhotoSelect}
        />
      ))}
    </div>
  );
}

// Nouveau composant PhotoCard robuste
const PhotoCard = ({ photo, onSelect }) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  // Construction URL sécurisée
  const getImageUrl = (photo) => {
    if (!photo) return null;
    if (photo.url && photo.url.startsWith('/api/uploads/')) {
      return photo.url;
    }
    if (photo.filename) {
      return `/api/uploads/photos/${photo.filename}`;
    }
    if (photo.path) {
      const filename = photo.path.split('/').pop();
      return `/api/uploads/photos/${filename}`;
    }
    return null;
  };

  const imageUrl = getImageUrl(photo);

  const handleImageLoad = () => {
    setImageLoading(false);
    setImageError(false);
  };

  const handleImageError = () => {
    setImageLoading(false);
    setImageError(true);
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="aspect-square relative bg-gray-100">
        {imageUrl && !imageError ? (
          <>
            {imageLoading && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="animate-pulse bg-gray-200 w-full h-full"></div>
              </div>
            )}
            <img
              src={imageUrl}
              alt={photo.originalname || 'Photo'}
              className="w-full h-full object-cover"
              onLoad={handleImageLoad}
              onError={handleImageError}
              style={{ display: imageLoading ? 'none' : 'block' }}
            />
          </>
        ) : (
          // Placeholder statique SVG
          <div className="w-full h-full flex items-center justify-center bg-gray-200">
            <svg className="w-12 h-12 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
            </svg>
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-medium text-gray-900">
          {photo.eventName || photo.event_name || 'Événement inconnu'}
        </h3>
        <p className="text-sm text-gray-500">
          {photo.uploadDate || photo.date ? new Date(photo.uploadDate || photo.date).toLocaleDateString() : 'Date inconnue'}
        </p>
        <div className="mt-2 flex space-x-2">
          <button 
            onClick={() => onSelect && onSelect(photo)}
            className="flex-1 bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
          >
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