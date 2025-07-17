const mongoose = require('mongoose');

const SaleSchema = new mongoose.Schema({
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  items: [{
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
  }],
  totalAmount: {
    type: mongoose.Schema.Types.Decimal128,
    required: true,
    min: 0
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'card', 'check', 'transfer'],
    required: true
  },
  paymentStatus: {
    type: String,
    enum: ['en_cours', 'pending', 'paid', 'partial', 'cancelled'],
    default: 'en_cours'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  notes: {
    type: String,
    maxlength: 500
  },
  isDeleted: {
    type: Boolean,
    default: false
  }
}, {
  collection: 'sales',
  timestamps: true
});

// Calculate total amount before saving
SaleSchema.pre('save', function(next) {
  if (this.items && this.items.length > 0) {
    const calculatedTotal = this.items.reduce((sum, item) => {
      return sum + parseFloat(item.totalPrice || 0);
    }, 0);
    
    // Only set totalAmount if it's not already set or if it's 0
    if (!this.totalAmount || parseFloat(this.totalAmount) === 0) {
      this.totalAmount = calculatedTotal;
    }
  }
  next();
});

module.exports = mongoose.model('Sale', SaleSchema); 