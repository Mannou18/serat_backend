const mongoose = require('mongoose');

const CarSchema = new mongoose.Schema({
  brand: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CarBrand',
    required: true
  },
  model_name: {
    type: String,
    required: true,
    trim: true,
    validate: {
      validator: async function(modelName) {
        // Get the brand document
        const CarBrand = mongoose.model('CarBrand');
        const brand = await CarBrand.findById(this.brand);
        if (!brand) return false;
        // Check if the model_name exists in the brand's model_names array
        return brand.model_names.includes(modelName);
      },
      message: 'Le modèle doit être un modèle valide pour cette marque'
    }
  },
  matricule: {
    type: String,
    required: true,
    trim: true
  },
  plate_number: {
    type: String,
    required: true,
    trim: true
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
  isAssociated: {
    type: Boolean,
    default: false
  }
}, {
  collection: 'cars',
  timestamps: true // This will automatically manage createdAt and updatedAt
});

// Update index to use brand and model_name
CarSchema.index({ brand: 1, model_name: 1 });

module.exports = mongoose.model('Car', CarSchema); 