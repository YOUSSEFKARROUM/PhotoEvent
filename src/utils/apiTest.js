// Utilitaire pour tester la connectivité avec le backend
export const testBackendConnection = async () => {
  try {
    // Test de base
    const response = await fetch('http://localhost:3000/api/auth/me', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    console.log('[API TEST] Statut de la réponse:', response.status);
    console.log('[API TEST] Headers de la réponse:', response.headers);
    
    if (response.ok) {
      const data = await response.json();
      console.log('[API TEST] Données reçues:', data);
      return { success: true, data };
    } else {
      console.warn('[API TEST] Réponse non-OK:', response.status, response.statusText);
      return { success: false, status: response.status, statusText: response.statusText };
    }
  } catch (error) {
    console.error('[API TEST] Erreur de connexion:', error);
    return { success: false, error: error.message };
  }
};

export const testUploadEndpoint = async (token) => {
  try {
    const formData = new FormData();
    formData.append('test', 'test');
    
    const response = await fetch('http://localhost:3000/api/upload/photo', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData
    });
    
    console.log('[API TEST] Test upload - Statut:', response.status);
    console.log('[API TEST] Test upload - Headers:', response.headers);
    
    if (response.status === 401) {
      const data = await response.json();
      console.log('[API TEST] Détails de l\'erreur 401:', data);
    }
    
    return { success: response.ok, status: response.status };
  } catch (error) {
    console.error('[API TEST] Erreur test upload:', error);
    return { success: false, error: error.message };
  }
};
