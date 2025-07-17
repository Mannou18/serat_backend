const mongoose = require('mongoose');
const User = require('../models/User');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const getUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('MongoDB connected');

    const users = await User.find({})
      .select('_id name role email');

    console.log('\n=== Available Users ===');
    users.forEach((user, index) => {
      console.log(`${index + 1}. User ID: ${user._id}`);
      console.log(`   Name: ${user.name}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Email: ${user.email}`);
      console.log('');
    });

    if (users.length === 0) {
      console.log('No users found in the database.');
    }

  } catch (error) {
    console.error('Error getting users:', error);
  } finally {
    mongoose.disconnect();
  }
};

getUsers(); 