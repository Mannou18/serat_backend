const mongoose = require('mongoose');
const Car = require('../models/Car');
const Customer = require('../models/Customer');
require('dotenv').config();

async function migrateCarAssociation() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Connected to MongoDB');

    // Get all customers to build a map of car associations
    const customers = await Customer.find({ isDeleted: false });
    const carAssociationMap = new Map();

    // Build a map of which cars are associated with customers
    customers.forEach(customer => {
      customer.cars.forEach(carId => {
        carAssociationMap.set(carId.toString(), true);
      });
    });

    // Get all cars
    const cars = await Car.find({});
    console.log(`Found ${cars.length} cars to process`);

    let updatedCount = 0;
    let skippedCount = 0;

    // Update each car's isAssociated status
    for (const car of cars) {
      const isAssociated = carAssociationMap.has(car._id.toString());
      
      if (car.isAssociated !== isAssociated) {
        car.isAssociated = isAssociated;
        await car.save();
        updatedCount++;
        console.log(`Updated car ${car.matricule} (${car.brand} ${car.model}) - isAssociated: ${isAssociated}`);
      } else {
        skippedCount++;
      }
    }

    console.log('\nMigration completed:');
    console.log(`Total cars processed: ${cars.length}`);
    console.log(`Cars updated: ${updatedCount}`);
    console.log(`Cars skipped (already correct): ${skippedCount}`);

  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    // Close the database connection
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
}

// Run the migration
migrateCarAssociation()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Migration failed:', error);
    process.exit(1);
  }); 