const mongoose = require('mongoose');

const InstallmentSchema = new mongoose.Schema({
  amount: {
    type: mongoose.Schema.Types.Decimal128,
    required: true,
    min: 0
  },
  dueDate: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'paid', 'overdue'],
    default: 'pending'
  },
  paymentDate: {
    type: Date,
    default: null
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'card', 'transfer', 'check'],
    default: null
  },
  notes: {
    type: String,
    maxlength: 200
  }
}, { _id: false });

const ArticleSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  unitPrice: {
    type: mongoose.Schema.Types.Decimal128,
    required: true,
    min: 0
  },
  totalPrice: {
    type: mongoose.Schema.Types.Decimal128,
    required: true,
    min: 0
  }
}, { _id: false });

const ServiceItemSchema = new mongoose.Schema({
  service: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service',
    required: true
  },
  description: {
    type: String
  },
  cost: {
    type: mongoose.Schema.Types.Decimal128,
    required: true,
    min: 0
  }
}, { _id: false });

const VenteSchema = new mongoose.Schema({
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  articles: [ArticleSchema],
  services: [ServiceItemSchema],
  reduction: {
    type: Number, // percentage (0-100) or amount (any positive number)
    min: 0,
    default: 0,
    validate: {
      validator: function(value) {
        // Allow any positive number for reduction
        return value >= 0;
      },
      message: 'Reduction must be a positive number'
    }
  },
  totalCost: {
    type: mongoose.Schema.Types.Decimal128,
    required: true,
    min: 0
  },
  paymentType: {
    type: String,
    enum: ['comptant', 'facilite'],
    required: true
  },
  installments: [InstallmentSchema], // Only for 'facilite'
  notes: {
    type: String,
    maxlength: 500
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isDeleted: {
    type: Boolean,
    default: false
  }
}, {
  collection: 'ventes',
  timestamps: true
});

module.exports = mongoose.model('Vente', VenteSchema); 