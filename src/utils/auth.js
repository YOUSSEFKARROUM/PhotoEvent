/**
 * Utilitaires pour la gestion de l'authentification
 */

const TOKEN_KEY = 'token';
const AUTH_TOKEN_KEY = 'authToken';

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
    
    // Ajouter une marge de sécurité de 5 minutes
    const safetyMargin = 5 * 60; // 5 minutes en secondes
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
