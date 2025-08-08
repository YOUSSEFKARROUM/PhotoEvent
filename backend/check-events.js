const mongoose = require('mongoose');
const Event = require('./models/Event');

async function checkEvents() {
    try {
        await mongoose.connect('mongodb://localhost:27017/photoevents');
        console.log('Connected to MongoDB');
        
        const events = await Event.find({});
        console.log(`Found ${events.length} events:`);
        
        events.forEach(event => {
            console.log(`- ID: ${event._id}`);
            console.log(`  Title: ${event.title}`);
            console.log(`  Date: ${event.date}`);
            console.log(`  Location: ${event.location}`);
            console.log('---');
        });
        
        if (events.length === 0) {
            console.log('No events found in database!');
        }
        
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.connection.close();
    }
}

checkEvents();
