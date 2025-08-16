import { TOKEN_CONFIG, TIMEOUTS, ERROR_MESSAGES } from '@/config/constants';

/**
 * Utilitaires pour la gestion de l'authentification
 */

const TOKEN_KEY = TOKEN_CONFIG.STORAGE_KEY;
const AUTH_TOKEN_KEY = TOKEN_CONFIG.BACKUP_STORAGE_KEY;

export const getToken = () => {
  return localStorage.getItem(TOKEN_KEY) || localStorage.getItem(AUTH_TOKEN_KEY);
};

export const setToken = (token) => {
  if (!token) {
    console.warn('[AUTH] Tentative de sauvegarde d\'un token vide');
    return;
  }
  
  localStorage.setItem(TOKEN_KEY, token);
  // Nettoyer l'ancien token si présent
  localStorage.removeItem(AUTH_TOKEN_KEY);
};

export const removeToken = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(AUTH_TOKEN_KEY);
};

export const isTokenExpired = (token) => {
  if (!token) return true;
  
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Date.now() / 1000;
    
    // Vérifier si le token a une date d'expiration
    if (!payload.exp) {
      return true;
    }
    
    // Ajouter une marge de sécurité configurable
    const safetyMargin = TIMEOUTS.TOKEN_SAFETY_MARGIN;
    return payload.exp < (currentTime + safetyMargin);
  } catch (error) {
    console.error('[AUTH] Erreur lors de la validation du token:', error);
    return true;
  }
};

export const getTokenPayload = (token) => {
  if (!token) return null;
  
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch (error) {
    console.error('[AUTH] Erreur lors du décodage du token:', error);
    return null;
  }
};

export const isTokenValid = (token) => {
  return !isTokenExpired(token);
};

// Nouvelle fonction pour vérifier l'authentification avant les opérations sensibles
export const checkAuthBeforeOperation = () => {
  const token = getToken();
  
  if (!token) {
    throw new Error(ERROR_MESSAGES.SESSION_EXPIRED);
  }
  
  if (isTokenExpired(token)) {
    removeToken(); // Nettoyer le token expiré
    throw new Error(ERROR_MESSAGES.TOKEN_EXPIRED);
  }
  
  return token;
};

// Fonction pour rafraîchir automatiquement le token si nécessaire
export const refreshTokenIfNeeded = async () => {
  const token = getToken();
  
  if (!token) {
    return false;
  }
  
  const payload = getTokenPayload(token);
  if (!payload) {
    return false;
  }
  
  const currentTime = Date.now() / 1000;
  const timeUntilExpiry = payload.exp - currentTime;
  
  // Si le token expire dans moins de 10 minutes, essayer de le rafraîchir
  if (timeUntilExpiry < TIMEOUTS.TOKEN_REFRESH_WARNING) {
    try {
      // Ici vous pourriez appeler une route de rafraîchissement de token
      // Pour l'instant, on retourne false pour forcer une nouvelle connexion
      console.warn('[AUTH] Token expire bientôt, rafraîchissement recommandé');
      return false;
    } catch (error) {
      console.error('[AUTH] Erreur lors du rafraîchissement du token:', error);
      return false;
    }
  }
  
  return true;
};
