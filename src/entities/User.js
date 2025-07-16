import apiService from "@/services/api.js";

class User {
  static async me() {
    // Correction : récupérer l'utilisateur connecté via l'API
    const response = await apiService.getCurrentUser();
    return response.user;
  }

  static async list() {
    // Simulation d'une liste d'utilisateurs
    return [
      {
        id: 1,
        email: 'admin@photoevents.com',
        name: 'Administrateur',
        role: 'admin',
        created_at: new Date().toISOString()
      },
      {
        id: 2,
        email: 'user1@example.com',
        name: 'Utilisateur 1',
        role: 'user',
        created_at: new Date().toISOString()
      },
      {
        id: 3,
        email: 'user2@example.com',
        name: 'Utilisateur 2',
        role: 'user',
        created_at: new Date().toISOString()
      }
    ];
  }

  static async updateMyUserData(data) {
    return apiService.updateMyProfile(data);
  }
}

export default User; 