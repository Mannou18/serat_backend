const mongoose = require('mongoose');
const Car = require('../models/Car');
const User = require('../models/User');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const createCars = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('MongoDB connected');

    // Find an admin user
    const admin = await User.findOne({ role: 'admin' });
    if (!admin) {
      console.log('No admin user found. Please create an admin first.');
      return;
    }

    const sampleCars = [
      {
        model: 'Corolla',
        brand: 'Toyota',
        matricule: 'RS-123-TN',
        plate_number: '123TUN4321',
        added_by: admin._id
      },
      {
        model: 'Civic',
        brand: 'Honda',
        matricule: 'RS-456-TN',
        plate_number: '456TUN7890',
        added_by: admin._id
      },
      {
        model: '3 Series',
        brand: 'BMW',
        matricule: 'RS-789-TN',
        plate_number: '789TUN1234',
        added_by: admin._id
      }
    ];

    // Check if cars already exist
    const existing = await Car.find({});
    if (existing.length > 0) {
      console.log('Cars already exist');
      return;
    }

    await Car.insertMany(sampleCars);
    console.log('Sample cars created successfully');
  } catch (error) {
    console.error('Error creating cars:', error);
  } finally {
    mongoose.disconnect();
  }
};

createCars(); 