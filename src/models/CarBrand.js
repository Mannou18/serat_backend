const mongoose = require('mongoose');

const carBrandSchema = new mongoose.Schema({
    brand_name: {
        type: String,
        required: [true, 'Brand name is required'],
        unique: true,
        trim: true
    },
    model_names: [{
        type: String,
        trim: true
    }]
}, {
    timestamps: true
});

// Add index for faster queries on brand_name
carBrandSchema.index({ brand_name: 1 });

const CarBrand = mongoose.model('CarBrand', carBrandSchema);

module.exports = CarBrand; 