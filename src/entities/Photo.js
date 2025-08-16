// Photo.js
import { getToken, isTokenExpired } from '@/utils/auth';

class Photo {
  static async create(file, eventId, description = '') {
    // Validation des paramètres
    if (!file) {
      throw new Error('Aucun fichier fourni');
    }
    if (!eventId) {
      throw new Error('EventId manquant');
    }
    
    // Vérifier l'authentification
    const token = getToken();
    if (!token) {
      throw new Error('Session expirée. Veuillez vous reconnecter.');
    }
    
    if (isTokenExpired(token)) {
      throw new Error('Token expiré. Veuillez vous reconnecter.');
    }
    
    const formData = new FormData();
    formData.append('photo', file);
    formData.append('eventId', eventId);
    formData.append('description', description);
    
    // Debug : log FormData et token
    console.log('FormData créé:', {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      eventId: eventId,
      description: description
    });
    console.log('Token disponible:', !!token);
    console.log('Headers envoyés:', {
      'Authorization': token ? `Bearer ${token.substring(0, 20)}...` : 'ABSENT'
    });
    
    try {
      const response = await fetch('/api/upload/photo', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        // Gestion spécifique des erreurs d'authentification
        if (response.status === 401) {
          throw new Error('Session expirée. Veuillez vous reconnecter.');
        }
        
        throw new Error(errorData.message || `Erreur ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Erreur lors de la création de la photo:', error);
      throw error;
    }
  }

  static async getAll(eventsId) {
    try {
      // Utiliser fetch directement au lieu de require
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Token d\'authentification manquant');
      }

      const url = eventsId ? `/api/photos?eventsId=${eventsId}` : '/api/photos';
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        // Utiliser errorData.message en priorité
        throw new Error(errorData.message || errorData.error || `Erreur ${response.status}`);
      }

      const photos = await response.json();
      
      // Adapter les champs pour l'UI
      return photos.map(photo => {
        const id = photo._id || photo.id || photo.filename || (photo.url ? photo.url.split('/').pop() : Math.random().toString(36).slice(2));
        const url = photo.url || getPhotoUrl(photo.filename || id);
        const event_name = photo.event_name || photo.eventName || photo.events_id || photo.eventsId || 'Événement inconnu';
        const date = photo.date || photo.created_date || photo.uploadedAt || null;
        const confidence = typeof photo.confidence === 'number'
          ? photo.confidence
          : (typeof photo.similarity === 'number' ? photo.similarity : 0.7);
        return {
          id,
          url,
          event_name,
          date,
          confidence,
          ...photo
        };
      });
    } catch (error) {
      console.error('Erreur dans Photo.getAll:', error);
      throw error;
    }
  }

  static async delete(photoId) {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/photos/${photoId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        // Utiliser errorData.message en priorité
        throw new Error(errorData.message || errorData.error || 'Erreur lors de la suppression');
      }

      return await response.json();
    } catch (error) {
      console.error('Erreur dans Photo.delete:', error);
      throw error;
    }
  }

  static async list(param) {
    // Si le paramètre commence par '-', c'est un tri, pas un filtre
    if (typeof param === 'string' && param.startsWith('-')) {
      return this.getAll(); // Pas de filtre, retourne tout
    }
    return this.getAll(param);
  }
}

// Helper pour corriger l'URL de l'image
const BACKEND_URL = 'http://localhost:5000';
function getPhotoUrl(url) {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  // Si l'URL est relative (juste le nom du fichier), préfixer par BACKEND_URL + /uploads/photos/
  return `${BACKEND_URL}/uploads/photos/${url.replace(/^\/+/, '')}`;
}

export default Photo;