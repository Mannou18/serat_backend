const mongoose = require('mongoose');

const ServiceSchema = new mongoose.Schema({
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  car: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Car',
    required: true
  },
  serviceType: {
    type: String,
    enum: ['repair', 'maintenance', 'inspection', 'installation', 'other'],
    required: true
  },
  description: {
    type: String,
    required: true,
    maxlength: 1000
  },
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'completed', 'cancelled'],
    default: 'pending'
  },
  estimatedCost: {
    type: mongoose.Schema.Types.Decimal128,
    min: 0
  },
  actualCost: {
    type: mongoose.Schema.Types.Decimal128,
    min: 0
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  completionDate: {
    type: Date
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  notes: {
    type: String,
    maxlength: 1000
  },
  isDeleted: {
    type: Boolean,
    default: false
  }
}, {
  collection: 'services',
  timestamps: true
});

module.exports = mongoose.model('Service', ServiceSchema); 