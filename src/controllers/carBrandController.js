const CarBrand = require('../models/CarBrand');
const Car = require('../models/Car');

// Create a new car brand
exports.createCarBrand = async (req, res) => {
    try {
        const { brand_name, model_names } = req.body;
        
        // Check if brand already exists
        const existingBrand = await CarBrand.findOne({ brand_name });
        if (existingBrand) {
            return res.status(400).json({
                success: false,
                message: 'Brand name already exists'
            });
        }

        const carBrand = await CarBrand.create({
            brand_name,
            model_names: model_names || []
        });

        res.status(201).json({
            success: true,
            data: carBrand
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// Get all car brands
exports.getAllCarBrands = async (req, res) => {
    try {
        const carBrands = await CarBrand.find().sort({ brand_name: 1 });
        
        res.status(200).json({
            success: true,
            count: carBrands.length,
            data: carBrands
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Get single car brand by ID
exports.getCarBrand = async (req, res) => {
    try {
        const carBrand = await CarBrand.findById(req.params.id);
        
        if (!carBrand) {
            return res.status(404).json({
                success: false,
                message: 'Car brand not found'
            });
        }

        res.status(200).json({
            success: true,
            data: carBrand
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Update car brand
exports.updateCarBrand = async (req, res) => {
    try {
        const { brand_name, model_names } = req.body;
        
        // If brand_name is being updated, check for duplicates
        if (brand_name) {
            const existingBrand = await CarBrand.findOne({ 
                brand_name, 
                _id: { $ne: req.params.id } 
            });
            
            if (existingBrand) {
                return res.status(400).json({
                    success: false,
                    message: 'Brand name already exists'
                });
            }
        }

        const carBrand = await CarBrand.findByIdAndUpdate(
            req.params.id,
            { brand_name, model_names },
            { 
                new: true,
                runValidators: true
            }
        );

        if (!carBrand) {
            return res.status(404).json({
                success: false,
                message: 'Car brand not found'
            });
        }

        res.status(200).json({
            success: true,
            data: carBrand
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// Delete car brand
exports.deleteCarBrand = async (req, res) => {
    try {
        // Check if there are any cars associated with this brand
        const associatedCars = await Car.find({ 
            brand: req.params.id,
            isDeleted: false 
        });

        if (associatedCars.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete brand: There are cars associated with this brand',
                associatedCarsCount: associatedCars.length,
                associatedCars: associatedCars.map(car => ({
                    id: car._id,
                    model_name: car.model_name,
                    matricule: car.matricule,
                    plate_number: car.plate_number
                }))
            });
        }

        const carBrand = await CarBrand.findByIdAndDelete(req.params.id);

        if (!carBrand) {
            return res.status(404).json({
                success: false,
                message: 'Car brand not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Car brand deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
}; 