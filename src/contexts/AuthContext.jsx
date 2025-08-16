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
          // Normaliser le rôle
          if (userData && userData.role) userData.role = String(userData.role).trim().toUpperCase();
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
      
      // Normaliser le rôle
      if (userData && userData.role) userData.role = String(userData.role).trim().toUpperCase();
      
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

  const normalizedRole = (user?.role ? String(user.role) : '').trim().toUpperCase();
  const isAdmin = normalizedRole === 'ADMIN';
  
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
        <div className="fixed top-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded z-50 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span className="font-medium">{error}</span>
            </div>
            <button
              onClick={clearError}
              className="ml-4 text-red-500 hover:text-red-700"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      )}
      {children}
    </AuthContext.Provider>
  );
}; 