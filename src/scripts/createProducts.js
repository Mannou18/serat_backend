const mongoose = require('mongoose');
const Product = require('../models/Product');
const User = require('../models/User');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const createProducts = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error('MONGO_URI is not defined in .env file');
    }
    
    await mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('MongoDB connected');

    // First, get an admin user to use as added_by
    const admin = await User.findOne({ role: 'admin' });
    if (!admin) {
      console.log('No admin user found. Please create an admin first.');
      return;
    }

    const sampleProducts = [
      {
        title: 'Product 1',
        b_price: 100.50,
        s_price: 150.75,
        stock: 50,
        added_by: admin._id,
        isDeleted: false
      },
      {
        title: 'Product 2',
        b_price: 200.25,
        s_price: 300.99,
        stock: 30,
        added_by: admin._id,
        isDeleted: false
      },
      {
        title: 'Product 3',
        b_price: 75.80,
        s_price: 120.50,
        stock: 100,
        added_by: admin._id,
        isDeleted: false
      }
    ];

    // Check if products already exist
    const existingProducts = await Product.find({});
    if (existingProducts.length > 0) {
      console.log('Products already exist');
      return;
    }

    // Insert all products
    await Product.insertMany(sampleProducts);
    console.log('Sample products created successfully');
  } catch (error) {
    console.error('Error creating products:', error);
  } finally {
    mongoose.disconnect();
  }
};

createProducts(); 