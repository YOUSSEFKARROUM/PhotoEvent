import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '@/services/api';
import { getToken, setToken, removeToken, isTokenExpired } from '@/utils/auth';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const isDevelopment = import.meta.env.DEV;

  // Vérifier si l'utilisateur est connecté au chargement
  useEffect(() => {
    const checkAuth = async () => {
      const token = getToken();
      if (token) {
        // Vérifier si le token est expiré avant de faire la requête
        if (isTokenExpired(token)) {
          if (isDevelopment) {
            console.warn('[AUTH] Token expiré détecté, nettoyage');
          }
          removeToken();
          setLoading(false);
          return;
        }

        try {
          const response = await api.get('/auth/me');
          const userData = response.data.user || response.data;
          // Correction : forcer le champ role en MAJUSCULES
          if (userData && userData.role) userData.role = userData.role.toUpperCase();
          setUser(userData);
          setIsAuthenticated(true);
          if (isDevelopment) {
            console.log('[AUTH] Utilisateur authentifié:', userData.email);
          }
        } catch (error) {
          if (isDevelopment) {
            console.error('[AUTH] Vérification échouée:', error.message);
          }
          removeToken();
          setUser(null);
          setIsAuthenticated(false);
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, [isDevelopment]);

  const login = async (email, password) => {
    try {
      setLoading(true);
      setError(null);
      
      if (isDevelopment) {
        console.log('[AUTH] Tentative de connexion avec:', email);
      }
      
      const response = await api.post('/auth/login', { email, password });
      const { token, user: userData } = response.data;
      
      if (!token || !userData) {
        throw new Error('Réponse invalide du serveur');
      }
      
      // Correction : forcer le champ role en MAJUSCULES
      if (userData && userData.role) userData.role = userData.role.toUpperCase();
      
      setToken(token);
      setUser(userData);
      setIsAuthenticated(true);
      
      if (isDevelopment) {
        console.log('[AUTH] Connexion réussie pour:', userData.email);
      }
      
      return { success: true };
    } catch (error) {
      const errorMessage = error.message || 'Erreur de connexion';
      if (isDevelopment) {
        console.error('[AUTH] Erreur de connexion:', errorMessage);
      }
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    try {
      setError(null);
      const response = await api.post('/auth/register', userData);
      const { token, user: newUser } = response.data;
      
      setToken(token);
      setUser(newUser);
      setIsAuthenticated(true);
      return { success: true };
    } catch (error) {
      const errorMessage = error.message || 'Erreur d\'inscription';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const logout = () => {
    removeToken();
    setUser(null);
    setIsAuthenticated(false);
    setError(null);
  };

  const clearError = () => {
    setError(null);
  };

  const isAdmin = user?.role?.toUpperCase() === 'ADMIN';
  
  // Debug logs - seulement quand les valeurs changent
  useEffect(() => {
    if (isDevelopment) {
      console.log('[AUTH DEBUG] User:', user);
      console.log('[AUTH DEBUG] User role:', user?.role);
      console.log('[AUTH DEBUG] Is admin:', isAdmin);
      console.log('[AUTH DEBUG] Is authenticated:', isAuthenticated);
    }
  }, [user, isAdmin, isAuthenticated, isDevelopment]);
  
  const value = {
    user,
    loading,
    error,
    login,
    register,
    logout,
    clearError,
    isAuthenticated,
    isAdmin,
  };

  return (
    <AuthContext.Provider value={value}>
      {error && (
        <div className="fixed top-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded z-50">
          {error}
        </div>
      )}
      {children}
    </AuthContext.Provider>
  );
}; 