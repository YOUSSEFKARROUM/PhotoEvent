// src/integrations/Core.js
import apiService from '@/services/api.js';

export const UploadFile = async (file, eventId, metadata = {}) => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('eventId', eventId);
    formData.append('metadata', JSON.stringify(metadata));

    const response = await apiService.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  } catch (error) {
    throw new Error(error.message || 'Erreur lors de l\'upload');
  }
};

export const DeleteFile = async (fileId) => {
  try {
    const response = await apiService.delete(`/files/${fileId}`);
    return response.data;
  } catch (error) {
    throw new Error(error.message || 'Erreur lors de la suppression');
  }
};