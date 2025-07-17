const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
require('dotenv').config();

const createAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('MongoDB connected');

    const adminData = {
      name: 'Admin',
      phoneNumber: '12345678', // 8-digit phone number
      password: 'admin123', // Replace with the actual password
      role: 'admin'
    };

    const existingAdmin = await User.findOne({ phoneNumber: adminData.phoneNumber });
    if (existingAdmin) {
      console.log('Admin already exists');
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(adminData.password, salt);
    adminData.password = hashedPassword;

    const admin = new User(adminData);
    await admin.save();
    console.log('Admin created successfully');
  } catch (error) {
    console.error('Error creating admin:', error);
  } finally {
    mongoose.disconnect();
  }
};

createAdmin(); 