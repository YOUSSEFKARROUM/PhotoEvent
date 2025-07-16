// Photo.js
class Photo {
  static async create(file, eventsId, description = '') {
    try {
      // Vérifier que le fichier est valide
      if (!file || !(file instanceof File)) {
        throw new Error('Fichier invalide');
      }

      const formData = new FormData();
      formData.append('photo', file);
      formData.append('eventsId', eventsId);
      formData.append('description', description);

      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Token d\'authentification manquant');
      }

      const response = await fetch('/api/upload/photo', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
          // NE PAS définir Content-Type avec FormData
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Erreur ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Erreur dans Photo.create:', error);
      throw error;
    }
  }

  static async getAll(eventsId) {
    try {
      const url = eventsId ? `/api/photos?eventsId=${eventsId}` : '/api/photos';
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des photos');
      }
      const photos = await response.json();
      // Remove or comment out the debug log for PHOTOS API URLs
      // console.log('PHOTOS API URLs:', photos.map(p => p.url));
      // Adapter les champs pour l'UI
      return photos.map(photo => ({
        id: photo._id || photo.id,
        image_url: getPhotoUrl(photo.url),
        events_id: photo.eventsId || photo.events_id,
        created_date: photo.uploadedAt,
        filename: photo.filename || (photo.url ? photo.url.split('/').pop() : ''),
        ...photo
      }));
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
        throw new Error(errorData.error || 'Erreur lors de la suppression');
      }

      return await response.json();
    } catch (error) {
      console.error('Erreur dans Photo.delete:', error);
      throw error;
    }
  }

  static async list(eventsId) {
    return this.getAll(eventsId);
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