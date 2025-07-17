const mongoose = require('mongoose');
const Category = require('../models/Category');
const User = require('../models/User');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const createCategory = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('MongoDB connected');

    // Find an admin user
    const admin = await User.findOne({ role: 'admin' });
    if (!admin) {
      console.log('No admin user found. Please create an admin first.');
      return;
    }

    const sampleCategories = [
      { title: 'Electronics', added_by: admin._id },
      { title: 'Books', added_by: admin._id },
      { title: 'Clothing', added_by: admin._id }
    ];

    // Check if categories already exist
    const existing = await Category.find({});
    if (existing.length > 0) {
      console.log('Categories already exist');
      return;
    }

    await Category.insertMany(sampleCategories);
    console.log('Sample categories created successfully');
  } catch (error) {
    console.error('Error creating categories:', error);
  } finally {
    mongoose.disconnect();
  }
};

createCategory(); 