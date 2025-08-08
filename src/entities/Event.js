import { getToken } from '../utils/auth';

class Event {
  static async list() {
    const token = getToken();
    // Ajout d'un paramètre unique pour éviter le cache
    const url = `/api/events?_=${Date.now()}`;
    const res = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Erreur lors de la récupération des événements');
    }
    const data = await res.json();
    // Extraire la propriété events si elle existe, sinon retourner data directement
    return data.events || data;
  }

  static async getById(id) {
    const events = await this.list();
    return events.find(event => (event.id?.toString() === id || event._id?.toString() === id));
  }

  static async create(event) {
    // Conversion explicite de la date au format ISO si besoin
    let dateISO = event.date;
    if (dateISO && !dateISO.includes('T')) {
      // Si la date est juste YYYY-MM-DD, on ajoute T00:00:00.000Z
      dateISO = `${dateISO}T00:00:00.000Z`;
    }
    const payload = {
      name: event.name,
      description: event.description,
      date: dateISO,
      location: event.location,
      photographerEmail: event.photographerEmail,
      coverImageUrl: event.coverImageUrl || undefined,
      status: event.status // Ajout du statut
    };
    const token = getToken();
    const res = await fetch('/api/events', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Erreur lors de la création de l\'événement');
    }
    const data = await res.json();
    // Force _id to string if present
    if (data && data._id && typeof data._id !== 'string') {
      data._id = data._id.toString();
    }
    // Retourne l'objet événement complet avec _id
    return data;
  }

  static async update(id, eventData) {
    try {
      // Remove _id from the data before sending
      const { _id, ...dataWithoutId } = eventData;
      const response = await fetch(`/api/events/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getToken()}`
        },
        body: JSON.stringify(dataWithoutId)
      });
      let responseData;
      try {
        responseData = await response.json();
      } catch (e) {
        responseData = { error: 'Réponse non JSON', details: e.message };
      }
      if (!response.ok) {
        console.error(`[FRONTEND] Erreur ${response.status}:`, responseData);
        throw new Error(responseData.details || responseData.error || 'Erreur inconnue');
      }
      console.log(`[FRONTEND] Succès mise à jour:`, responseData);
      return responseData;
    } catch (error) {
      console.error('[FRONTEND] Erreur réseau ou parsing:', error);
      throw new Error(`Erreur de communication: ${error.message}`);
    }
  }

  static async delete(eventId) {
    const token = getToken();
    const res = await fetch(`/api/events/${eventId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      }
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Erreur lors de la suppression de l\'événement');
    }
    return true;
  }
}

export default Event;
export { Event }; 