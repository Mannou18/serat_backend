const mongoose = require('mongoose');
const Customer = require('../models/Customer');
const User = require('../models/User');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const createCustomers = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('MongoDB connected');

    // Find an admin user
    const admin = await User.findOne({ role: 'admin' });
    if (!admin) {
      console.log('No admin user found. Please create an admin first.');
      return;
    }

    const sampleCustomers = [
      {
        fname: 'John',
        lname: 'Doe',
        cin: '12345678',
        phoneNumber: '12345678',
        added_by: admin._id
      },
      {
        fname: 'Jane',
        lname: 'Smith',
        cin: '87654321',
        phoneNumber: '87654321',
        added_by: admin._id
      },
      {
        fname: 'Mohammed',
        lname: 'Ali',
        cin: '11223344',
        phoneNumber: '11223344',
        added_by: admin._id
      }
    ];

    // Check if customers already exist
    const existing = await Customer.find({});
    if (existing.length > 0) {
      console.log('Customers already exist');
      return;
    }

    await Customer.insertMany(sampleCustomers);
    console.log('Sample customers created successfully');
  } catch (error) {
    console.error('Error creating customers:', error);
  } finally {
    mongoose.disconnect();
  }
};

createCustomers(); 