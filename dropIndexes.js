const mongoose = require('mongoose');
require('dotenv').config();

async function dropIndexes() {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error('MONGO_URI is not defined in .env file');
    }

    await mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    const collection = db.collection('cars');

    // Get all indexes
    const indexes = await collection.indexes();
    console.log('Current indexes:', indexes);

    // Drop the specific indexes if they exist
    try {
      await collection.dropIndex('matricule_1');
      console.log('Dropped matricule_1 index');
    } catch (e) {
      console.log('matricule_1 index not found or already dropped');
    }

    try {
      await collection.dropIndex('plate_number_1');
      console.log('Dropped plate_number_1 index');
    } catch (e) {
      console.log('plate_number_1 index not found or already dropped');
    }

    // Show updated indexes
    const updatedIndexes = await collection.indexes();
    console.log('Updated indexes:', updatedIndexes);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Disconnected from MongoDB');
  }
}

dropIndexes(); 