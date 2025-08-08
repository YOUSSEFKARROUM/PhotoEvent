import { getToken, removeToken, isTokenExpired } from './auth';

export const cleanupExpiredTokens = () => {
  const token = getToken();
  
  if (token && isTokenExpired(token)) {
    console.warn('[TOKEN_CLEANUP] Token expiré détecté, nettoyage automatique');
    removeToken();
    return true; // Token was expired and removed
  }
  
  return false; // Token is still valid or doesn't exist
};

export const validateTokenBeforeRequest = () => {
  const token = getToken();
  
  if (!token) {
    console.warn('[TOKEN_VALIDATION] Aucun token disponible');
    return false;
  }
  
  if (isTokenExpired(token)) {
    console.warn('[TOKEN_VALIDATION] Token expiré, nettoyage requis');
    removeToken();
    return false;
  }
  
  return true; // Token is valid
};

// Fonction utilitaire pour afficher les détails du token (pour debug)
export const getTokenDetails = () => {
  const token = getToken();
  
  if (!token) {
    return { hasToken: false, details: null };
  }
  
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Date.now() / 1000;
    const timeUntilExpiry = payload.exp - currentTime;
    
    return {
      hasToken: true,
      isExpired: timeUntilExpiry <= 0,
      timeUntilExpiry: Math.max(0, timeUntilExpiry),
      expiryDate: new Date(payload.exp * 1000).toLocaleString(),
      userId: payload.userId,
      email: payload.email,
      role: payload.role
    };
  } catch (error) {
    console.error('[TOKEN_DETAILS] Erreur lors du décodage du token:', error);
    return { hasToken: true, details: null, error: error.message };
  }
};
