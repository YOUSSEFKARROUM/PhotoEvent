const mongoose = require('mongoose');
const Event = require('../models/Event');

async function createTestEvent() {
    try {
        // Connect to MongoDB
        await mongoose.connect('mongodb://localhost:27017/photoevents');
        console.log('Connected to MongoDB');

        // Create a test event
        const testEvent = new Event({
            title: 'Test Event',
            description: 'This is a test event for photo uploads',
            date: new Date(),
            location: 'Test Location',
            isActive: true
        });

        // Save the event
        const savedEvent = await testEvent.save();
        console.log('Test event created successfully!');
        console.log('Event ID:', savedEvent._id.toString());
        console.log('Event Title:', savedEvent.title);
        console.log('Event Description:', savedEvent.description);
        console.log('Event Date:', savedEvent.date);
        console.log('Event Location:', savedEvent.location);

        console.log('\nYou can now use this Event ID for photo uploads:', savedEvent._id.toString());

    } catch (error) {
        console.error('Error creating test event:', error);
    } finally {
        mongoose.connection.close();
        console.log('Database connection closed');
    }
}

createTestEvent();
