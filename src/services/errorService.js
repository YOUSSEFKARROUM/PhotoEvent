// Service de gestion d'erreurs
export class ErrorService {
  static handleApiError(error, context = '') {
    console.error(`[API Error] ${context}:`, error);
    
    // Gestion des erreurs de connexion
    if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
      return {
        type: 'CONNECTION_ERROR',
        message: 'Impossible de se connecter au serveur. Vérifiez votre connexion.',
        originalError: error
      };
    }
    
    // Gestion des erreurs HTTP
    if (error.response) {
      const { status, data } = error.response;
      
      switch (status) {
        case 400:
          return {
            type: 'BAD_REQUEST',
            message: data.error || 'Requête invalide',
            originalError: error
          };
        case 401:
          return {
            type: 'UNAUTHORIZED',
            message: 'Session expirée. Veuillez vous reconnecter.',
            originalError: error
          };
        case 403:
          return {
            type: 'FORBIDDEN',
            message: 'Accès interdit. Permissions insuffisantes.',
            originalError: error
          };
        case 404:
          return {
            type: 'NOT_FOUND',
            message: 'Ressource non trouvée',
            originalError: error
          };
        case 500:
          return {
            type: 'SERVER_ERROR',
            message: 'Erreur serveur. Veuillez réessayer plus tard.',
            originalError: error
          };
        default:
          return {
            type: 'UNKNOWN_ERROR',
            message: data.error || 'Une erreur inattendue s\'est produite',
            originalError: error
          };
      }
    }
    
    // Erreur générique
    return {
      type: 'GENERIC_ERROR',
      message: error.message || 'Une erreur inattendue s\'est produite',
      originalError: error
    };
  }
  
  static handleAuthError(error) {
    const processedError = this.handleApiError(error, 'Authentication');
    
    if (processedError.type === 'UNAUTHORIZED') {
      // Nettoyer le localStorage et rediriger
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    
    return processedError;
  }
  
  static handleUploadError(error) {
    const processedError = this.handleApiError(error, 'Upload');
    
    if (error.name === 'PayloadTooLargeError') {
      return {
        type: 'FILE_TOO_LARGE',
        message: 'Le fichier est trop volumineux (max 10MB)',
        originalError: error
      };
    }
    
    return processedError;
  }
  
  static showUserFriendlyError(error) {
    const message = error.message || 'Une erreur s\'est produite';
    
    // Vous pouvez personnaliser cette fonction pour utiliser votre système de notifications
    // Pour l'instant, on utilise une simple alerte
    if (typeof window !== 'undefined' && window.alert) {
      window.alert(message);
    } else {
      console.error('User Error:', message);
    }
  }
}

export default ErrorService;
