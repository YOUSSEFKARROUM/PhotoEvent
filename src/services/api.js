import axios from 'axios';
import { getToken, removeToken, getTokenPayload } from '@/utils/auth';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // Augmenté à 30 secondes
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur de requête
api.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      if (import.meta.env.DEV) {
        console.log('[API] Token envoyé:', token.substring(0, 20) + '...');
        console.log('[API] Headers:', config.headers);
      }
    } else {
      if (import.meta.env.DEV) {
        console.warn('[API] Aucun token disponible pour la requête:', config.url);
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Intercepteur de réponse amélioré
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.message || error.message || 'Une erreur est survenue';
    
    if (error.response?.status === 401) {
      // Log détaillé pour le debug
      console.warn('[API] Erreur 401 - Token invalide ou expiré');
      console.warn('[API] URL:', error.config?.url);
      console.warn('[API] Headers envoyés:', error.config?.headers);
      console.warn('[API] Réponse du serveur:', error.response?.data);
      
      // Supprimer le token seulement si c'est une erreur d'authentification claire
      if (error.response?.data?.code === 'TokenExpiredError' || 
          error.response?.data?.message?.includes('Token expiré')) {
        removeToken();
        // Rediriger seulement si c'est clairement un problème de token expiré
        window.location.href = '/login';
      }
    }
    
    if (import.meta.env.DEV) {
      console.error('API Error:', error);
    }
    
    return Promise.reject(new Error(message));
  }
);

export default api; 

// High-level helpers expected by entities
api.getCurrentUser = async () => {
  const res = await api.get('/auth/me');
  return res.data.user || res.data;
};

api.login = async (email, password) => {
  const res = await api.post('/auth/login', { email, password });
  return res.data;
};

api.updateMyProfile = async (data) => {
  const res = await api.put('/users/me', data);
  return res.data;
};