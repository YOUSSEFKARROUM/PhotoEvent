const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config();

exports.getAllEvents = async (req, res) => {
  try {
    const uri = process.env.MONGODB_URI;
    const client = new MongoClient(uri);
    const dbName = uri.split('/').pop();
    await client.connect();
    const db = client.db(dbName);
    const events = db.collection('events');
    const eventsData = await events.find().sort({ date: -1 }).toArray();
    // DEBUG: Log what we get from database
    console.log("=== RAW DATABASE EVENTS ===");
    eventsData.forEach(event => {
        console.log(`Event: ${event.name}`);
        console.log(`coverImageUrl: \"${event.coverImageUrl}\"`);
        console.log(`cover_image_url: \"${event.cover_image_url}\"`);
        console.log("---");
    });
    // Your existing mapping code...
    const mappedEvents = eventsData.map(event => ({
        ...event,
        id: event._id,
        cover_image_url: event.coverImageUrl,
    }));
    console.log("=== MAPPED EVENTS FOR FRONTEND ===");
    mappedEvents.forEach(event => {
        console.log(`Event: ${event.name}`);
        console.log(`cover_image_url: \"${event.cover_image_url}\"`);
        console.log("---");
    });
    await client.close();
    res.json(mappedEvents);
  } catch (err) {
    console.error('Erreur getAllEvents:', err.message);
    res.status(500).json({ error: 'Erreur du serveur', details: err.message });
  }
};

exports.getEventById = async (req, res) => {
  try {
    const { id } = req.params;
    const uri = process.env.MONGODB_URI;
    const client = new MongoClient(uri);
    const dbName = uri.split('/').pop();
    await client.connect();
    const db = client.db(dbName);
    const events = db.collection('events');
    const event = await events.findOne({ _id: new ObjectId(id) });
    await client.close();
    
    if (!event) {
      return res.status(404).json({ error: 'Événement non trouvé' });
    }
    
    res.json(event);
  } catch (err) {
    console.error('Erreur getEventById:', err.message);
    res.status(500).json({ error: 'Erreur du serveur', details: err.message });
  }
};

exports.createEvent = async (req, res) => {
  try {
    const eventData = {
      ...req.body,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const uri = process.env.MONGODB_URI;
    const client = new MongoClient(uri);
    const dbName = uri.split('/').pop();
    await client.connect();
    const db = client.db(dbName);
    const events = db.collection('events');
    const result = await events.insertOne(eventData);
    await client.close();
    
    res.status(201).json({ _id: result.insertedId, ...eventData });
  } catch (err) {
    console.error('Erreur createEvent:', err.message);
    res.status(500).json({ error: 'Erreur du serveur', details: err.message });
  }
};

exports.updateEvent = async (req, res) => {
  try {
    const { id } = req.params;
    // Log de débogage
    console.log(`[UPDATE EVENT] ID: ${id}`);
    console.log(`[UPDATE EVENT] Body:`, req.body);
    console.log(`[UPDATE EVENT] File:`, req.file ? req.file.filename : 'Aucun fichier');

    // Validation de l'ID
    if (!ObjectId.isValid(id)) {
      console.error(`[UPDATE EVENT] ID invalide: ${id}`);
      return res.status(400).json({
        error: "ID d'événement invalide",
        details: "L'ID fourni n'est pas un ObjectId valide"
      });
    }

    // Connexion DB
    const uri = process.env.MONGODB_URI;
    const client = new MongoClient(uri);
    const dbName = uri.split('/').pop();
    await client.connect();
    const db = client.db(dbName);
    const events = db.collection('events');

    // Vérification de l'existence de l'événement
    const existingEvent = await events.findOne({ _id: new ObjectId(id) });
    if (!existingEvent) {
      await client.close();
      console.error(`[UPDATE EVENT] Événement non trouvé: ${id}`);
      return res.status(404).json({
        error: "Événement non trouvé",
        details: `Aucun événement trouvé avec l'ID ${id}`
      });
    }

    // Validation des données critiques
    const updateData = { ...req.body };

    // Validation de la date si présente
    if (updateData.date) {
      const dateObj = new Date(updateData.date);
      if (isNaN(dateObj.getTime())) {
        await client.close();
        console.error(`[UPDATE EVENT] Date invalide: ${updateData.date}`);
        return res.status(400).json({
          error: 'Date invalide',
          details: "Le format de date fourni n'est pas valide"
        });
      }
      updateData.date = dateObj;
    }

    // Validation de l'email photographe si présent
    if (updateData.photographerEmail) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(updateData.photographerEmail)) {
        await client.close();
        console.error(`[UPDATE EVENT] Email invalide: ${updateData.photographerEmail}`);
        return res.status(400).json({
          error: 'Email photographe invalide',
          details: "Le format d'email fourni n'est pas valide"
        });
      }
    }

    // Gestion du fichier d'image
    if (req.file) {
      updateData.coverImageUrl = `/uploads/photos/${req.file.filename}`;
      console.log(`[UPDATE EVENT] Image de couverture mise à jour: ${req.file.filename}`);
    }
    // Nettoyage éventuel
    if (updateData.coverImage) delete updateData.coverImage;

    updateData.updatedAt = new Date();

    // Mise à jour
    const result = await events.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );
    await client.close();
    if (result.matchedCount === 0) {
      return res.status(404).json({
        error: "Événement non trouvé",
        details: `Aucun événement trouvé avec l'ID ${id}`
      });
    }
    console.log(`[UPDATE EVENT] Succès pour l'événement: ${id}`);
    res.json({ _id: id, ...updateData });
  } catch (error) {
    console.error(`[UPDATE EVENT] Erreur serveur:`, {
      message: error.message,
      stack: error.stack,
      eventId: req.params.id,
      body: req.body
    });
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        error: 'Erreur de validation',
        details: error.message
      });
    }
    if (error.name === 'CastError') {
      return res.status(400).json({
        error: 'Erreur de format de données',
        details: `Le champ ${error.path} a une valeur invalide`
      });
    }
    res.status(500).json({
      error: 'Erreur interne du serveur',
      details: error.message
    });
  }
};

exports.deleteEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const uri = process.env.MONGODB_URI;
    const client = new MongoClient(uri);
    const dbName = uri.split('/').pop();
    await client.connect();
    const db = client.db(dbName);
    const events = db.collection('events');
    const result = await events.deleteOne({ _id: new ObjectId(id) });
    await client.close();
    
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Événement non trouvé' });
    }
    
    res.json({ message: 'Événement supprimé avec succès' });
  } catch (err) {
    console.error('Erreur deleteEvent:', err.message);
    res.status(500).json({ error: 'Erreur du serveur', details: err.message });
  }
};
