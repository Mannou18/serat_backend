const mongoose = require('mongoose');

const CustomerSchema = new mongoose.Schema({
  fname: {
    type: String,
    required: true,
    trim: true
  },
  lname: {
    type: String,
    required: true,
    trim: true
  },
  cin: {
    type: String,
    required: true,
    unique: true,
    validate: {
      validator: function(v) {
        return /^\d+$/.test(v);
      },
      message: 'CIN must contain only digits'
    }
  },
  phoneNumber: {
    type: String,
    required: true,
    unique: true,
    validate: {
      validator: function(v) {
        return /^\d{8}$/.test(v);
      },
      message: 'Phone number must be exactly 8 digits'
    }
  },
  added_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  cars: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Car'
  }],
  isDeleted: {
    type: Boolean,
    default: false
  }
}, {
  collection: 'customers',
  timestamps: true // This will automatically manage createdAt and updatedAt
});

// Create a compound index for fname and lname
CustomerSchema.index({ fname: 1, lname: 1 });

module.exports = mongoose.model('Customer', CustomerSchema); 