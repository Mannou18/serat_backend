const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Register a new user
exports.register = async (req, res) => {
  try {
    const { name, phoneNumber, password, role } = req.body;
    // Check if user already exists
    const existingUser = await User.findOne({ phoneNumber });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    // Create new user
    const user = new User({
      name,
      phoneNumber,
      password: hashedPassword,
      role: role || 'employee'
    });
    await user.save();
    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Login user
exports.login = async (req, res) => {
  try {
    let { phoneNumber, password } = req.body;
    // Ensure phoneNumber is a string
    phoneNumber = String(phoneNumber);
    // Check if user exists
    const user = await User.findOne({ phoneNumber });
    if (!user || user.active === false) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    // Validate password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    // Generate JWT
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '30d' });
    res.json({ token });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get user profile
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get all users (admin only)
exports.getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, role, active } = req.query;
    const skip = (page - 1) * limit;

    const filter = {};
    if (role) filter.role = role;
    if (active !== undefined) filter.active = active === 'true';

    const users = await User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await User.countDocuments(filter);

    res.json({
      users,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / limit),
        totalRecords: total
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update user
exports.updateUser = async (req, res) => {
  try {
    const { name, phoneNumber, active } = req.body;
    const updateData = {};

    if (name) updateData.name = name;
    if (phoneNumber) updateData.phoneNumber = phoneNumber;
    if (active !== undefined) updateData.active = active;

    // Check if phone number is already taken by another user
    if (phoneNumber) {
      const existingUser = await User.findOne({ 
        phoneNumber, 
        _id: { $ne: req.params.id } 
      });
      if (existingUser) {
        return res.status(400).json({ message: 'Phone number already exists' });
      }
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      message: 'User updated successfully',
      user
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete user (soft delete by setting active to false)
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent deleting the last admin
    if (user.role === 'admin') {
      const adminCount = await User.countDocuments({ role: 'admin', active: true });
      if (adminCount <= 1) {
        return res.status(400).json({ message: 'Cannot delete the last admin user' });
      }
    }

    user.active = false;
    await user.save();

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update user role
exports.updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;

    if (!['admin', 'employee'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent changing role of the last admin
    if (user.role === 'admin' && role === 'employee') {
      const adminCount = await User.countDocuments({ role: 'admin', active: true });
      if (adminCount <= 1) {
        return res.status(400).json({ message: 'Cannot change role of the last admin user' });
      }
    }

    user.role = role;
    await user.save();

    res.json({
      message: 'User role updated successfully',
      user: {
        id: user._id,
        name: user.name,
        phoneNumber: user.phoneNumber,
        role: user.role,
        active: user.active
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}; 