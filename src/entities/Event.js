class Event {
  static async list() {
    const token = localStorage.getItem('token');
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
    return await res.json();
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
    const token = localStorage.getItem('token');
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
    return data.events;
  }

  static async update(eventId, eventData) {
    const token = localStorage.getItem('token');
    const res = await fetch(`/api/events/${eventId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: JSON.stringify({ ...eventData, status: eventData.status }) // Ajout du statut
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Erreur lors de la mise à jour de l\'événement');
    }
    return await res.json();
  }

  static async delete(eventId) {
    const token = localStorage.getItem('token');
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