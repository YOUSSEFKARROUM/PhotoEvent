import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const ProtectedRoute = ({ children, requireAdmin = false }) => {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requireAdmin && !isAdmin) {
    console.log('[PROTECTED ROUTE DEBUG] requireAdmin:', requireAdmin);
    console.log('[PROTECTED ROUTE DEBUG] isAdmin:', isAdmin);
    console.log('[PROTECTED ROUTE DEBUG] isAuthenticated:', isAuthenticated);
    console.log('[PROTECTED ROUTE DEBUG] user:', useAuth().user);
    
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-red-600 text-6xl mb-4">🚫</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Accès refusé</h1>
          <p className="text-gray-600 mb-4">Vous n'avez pas les permissions nécessaires pour accéder à cette page.</p>
          <div className="bg-yellow-100 p-4 rounded mb-4 text-left">
            <h3 className="font-bold">Debug Info:</h3>
            <p>requireAdmin: {requireAdmin.toString()}</p>
            <p>isAdmin: {isAdmin.toString()}</p>
            <p>isAuthenticated: {isAuthenticated.toString()}</p>
            <p>User role: {useAuth().user?.role || 'undefined'}</p>
          </div>
          <Navigate to="/" replace />
        </div>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute; 