const API_BASE_URL = '/api';

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  // Méthode générique pour les requêtes HTTP
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const token = localStorage.getItem('token');
    
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem('token');
        window.location.href = '/login';
        throw new Error('Session expirée ou accès interdit');
      }
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Méthodes d'authentification
  async login(credentials) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  async register(userData) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async getCurrentUser() {
    return this.request('/auth/me');
  }

  // Méthodes pour les événements
  async geteventss() {
    return this.request('/eventss');
  }

  async getevents(id) {
    return this.request(`/eventss/${id}`);
  }

  async createevents(eventsData) {
    return this.request('/eventss', {
      method: 'POST',
      body: JSON.stringify(eventsData),
    });
  }

  async updateevents(id, eventsData) {
    return this.request(`/eventss/${id}`, {
      method: 'PUT',
      body: JSON.stringify(eventsData),
    });
  }

  async deleteevents(id) {
    return this.request(`/eventss/${id}`, {
      method: 'DELETE',
    });
  }

  // Méthodes pour les photos
  async getPhotos(eventsId = null) {
    const endpoint = eventsId ? `/photos?eventsId=${eventsId}` : '/photos';
    return this.request(endpoint);
  }

  async getPhoto(id) {
    return this.request(`/photos/${id}`);
  }

  async uploadPhoto(formData) {
    const token = localStorage.getItem('token');
    const response = await fetch(`${this.baseURL}/upload/photo`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Upload failed! status: ${response.status}`);
    }

    return await response.json();
  }

  async deletePhoto(id) {
    return this.request(`/photos/${id}`, {
      method: 'DELETE',
    });
  }

  // Méthodes pour les utilisateurs (admin)
  async getUsers() {
    return this.request('/users');
  }

  async getUser(id) {
    return this.request(`/users/${id}`);
  }

  async updateUser(id, userData) {
    return this.request(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  }

  // Méthode pour mettre à jour son propre profil
  async updateMyProfile(data) {
    return this.request('/users/me', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteUser(id) {
    return this.request(`/users/${id}`, {
      method: 'DELETE',
    });
  }

  // Méthode pour vérifier la santé de l'API
  async healthCheck() {
    return this.request('/health');
  }
}

export const apiService = new ApiService();
export default apiService; 