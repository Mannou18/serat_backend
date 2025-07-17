const mongoose = require('mongoose');

const CategorySchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  added_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  collection: 'categories',
  timestamps: true // Automatically manages createdAt and updatedAt
});

module.exports = mongoose.model('Category', CategorySchema); 