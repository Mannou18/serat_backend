const mongoose = require('mongoose');

const NeotrackSchema = new mongoose.Schema({
  serialNumber: {
    type: String,
    required: true,
    unique: true
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  car: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Car'
  },
  plate_number: String,
  brand: String,
  model: String,
  year: Number,
  imei: String,
  sim_device: String,
  password: String,
  isActive: {
    type: Boolean,
    default: false
  },
  price: {
    type: mongoose.Schema.Types.Decimal128,
    required: true,
    min: 0
  },
  purchaseDate: {
    type: Date,
    required: true
  },
  activatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  activatedAt: {
    type: Date
  },
  notes: {
    type: String,
    maxlength: 500
  },
  details: {
    type: Object // Store the full user, car, password, etc.
  }
}, {
  collection: 'neotracks',
  timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' }
});

module.exports = mongoose.model('Neotrack', NeotrackSchema); 