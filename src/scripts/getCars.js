const mongoose = require('mongoose');
const Car = require('../models/Car');
const CarBrand = require('../models/CarBrand');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const getCars = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('MongoDB connected');

    const cars = await Car.find({ isDeleted: false })
      .populate('brand', 'brand_name')
      .select('_id model_name matricule plate_number brand');

    console.log('\n=== Available Cars ===');
    console.log('Use these car IDs in your service creation request:\n');
    
    cars.forEach((car, index) => {
      console.log(`${index + 1}. Car ID: ${car._id}`);
      console.log(`   Brand: ${car.brand ? car.brand.brand_name : 'N/A'}`);
      console.log(`   Model: ${car.model_name}`);
      console.log(`   Matricule: ${car.matricule}`);
      console.log(`   Plate Number: ${car.plate_number}`);
      console.log('');
    });

    if (cars.length === 0) {
      console.log('No cars found in the database.');
      console.log('Please create some cars first using the createCars.js script.');
    }

  } catch (error) {
    console.error('Error getting cars:', error);
  } finally {
    mongoose.disconnect();
  }
};

getCars(); 