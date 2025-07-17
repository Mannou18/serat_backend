const mongoose = require('mongoose');

const LogSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  action: {
    type: String,
    required: true
  },
  entityType: {
    type: String,
    required: true
  },
  entityId: {
    type: mongoose.Schema.Types.ObjectId,
    required: false
  },
  details: {
    type: Object,
    required: false
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, {
  collection: 'logs',
  timestamps: false
});

module.exports = mongoose.model('Log', LogSchema); 