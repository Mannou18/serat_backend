const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  b_price: {
    type: mongoose.Schema.Types.Decimal128,
    required: true,
    min: 0
  },
  s_price: {
    type: mongoose.Schema.Types.Decimal128,
    required: true,
    min: 0
  },
  stock: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  added_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  categories: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
  }]
}, { 
  collection: 'products',
  timestamps: true // This will automatically manage createdAt and updatedAt
});

module.exports = mongoose.model('Product', ProductSchema); 