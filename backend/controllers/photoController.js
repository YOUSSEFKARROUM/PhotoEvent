const { MongoClient } = require('mongodb');
require('dotenv').config();

exports.getAllPhotos = async (req, res) => {
  try {
    const uri = process.env.DATABASE_URL;
    const client = new MongoClient(uri);
    const dbName = uri.split('/').pop();
    await client.connect();
    const db = client.db(dbName);
    const photos = db.collection('photos');
    const events = db.collection('events');
    const allPhotos = await photos.find().sort({ uploadedAt: -1 }).toArray();
    // Enrichir chaque photo avec le nom et la date de l'événement
    const enrichedPhotos = await Promise.all(allPhotos.map(async (photo) => {
      let event = null;
      if (photo.eventId) {
        event = await events.findOne({ _id: photo.eventId }) || await events.findOne({ _id: photo.eventId.toString() });
      }
      return {
        ...photo,
        event_name: event ? (event.title || event.name || 'Événement inconnu') : 'Événement inconnu',
        date: event ? event.date : null
      };
    }));
    await client.close();
    res.json(enrichedPhotos);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Erreur du serveur');
  }
};

exports.getPhotosByEvent = async (req, res) => {
  try {
    const { eventId } = req.query;
    if (!eventId) {
      return res.status(400).json({ error: "Paramètre 'eventId' manquant" });
    }
    const uri = process.env.DATABASE_URL;
    const client = new MongoClient(uri);
    const dbName = uri.split('/').pop();
    await client.connect();
    const db = client.db(dbName);
    const photos = db.collection('photos');
    const events = db.collection('events');
    let results = await photos.find({ eventId }).sort({ uploadedAt: -1 }).toArray();
    if (results.length === 0) {
      const { ObjectId } = require('mongodb');
      try {
        results = await photos.find({ eventId: new ObjectId(eventId) }).sort({ uploadedAt: -1 }).toArray();
      } catch (e) { /* ignore */ }
    }
    // Enrichir chaque photo avec le nom et la date de l'événement
    const event = await events.findOne({ _id: eventId }) || await events.findOne({ _id: eventId.toString() });
    const enrichedResults = results.map(photo => ({
      ...photo,
      event_name: event ? (event.title || event.name || 'Événement inconnu') : 'Événement inconnu',
      date: event ? event.date : null
    }));
    await client.close();
    res.json(enrichedResults);
  } catch (err) {
    console.error('[API] Erreur récupération photos:', err);
    res.status(500).json({ error: "Erreur serveur", details: err.message });
  }
}; 