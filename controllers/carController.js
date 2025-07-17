const Car = require('../models/Car');
const CarBrand = require('../models/CarBrand');
const Log = require('../models/Log');

// Get all cars with pagination and filtering
exports.getAllCars = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Build filter
    const filter = {};

    // Filter by isDeleted
    if (typeof req.query.isDeleted !== 'undefined') {
      filter.isDeleted = req.query.isDeleted === 'true';
    } else {
      filter.isDeleted = false; // Default: show only active cars
    }

    // Filter by search term (search in model_name, brand name, matricule, or plate_number)
    if (req.query.search) {
      // First find matching brands
      const matchingBrands = await CarBrand.find({
        $or: [
          { brand_name: { $regex: req.query.search, $options: 'i' } },
          { model_names: { $regex: req.query.search, $options: 'i' } }
        ]
      }).select('_id');
      
      const brandIds = matchingBrands.map(brand => brand._id);
      
      filter.$or = [
        { model_name: { $regex: req.query.search, $options: 'i' } },
        { brand: { $in: brandIds } },
        { matricule: { $regex: req.query.search, $options: 'i' } },
        { plate_number: { $regex: req.query.search, $options: 'i' } }
      ];
    }

    const cars = await Car.find(filter)
      .populate('added_by', 'name')
      .populate('brand', 'brand_name model_names')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await Car.countDocuments(filter);

    res.json({
      cars,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalCars: total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get single car
exports.getCar = async (req, res) => {
  try {
    const car = await Car.findOne({ _id: req.params.id, isDeleted: false })
      .populate('added_by', 'name')
      .populate('brand', 'brand_name model_names');
    
    if (!car) {
      return res.status(404).json({ message: 'Voiture non trouvée' });
    }
    
    res.json(car);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create car
exports.createCar = async (req, res) => {
  try {
    // Verify brand exists and model_name is valid
    const brand = await CarBrand.findById(req.body.brand);
    if (!brand) {
      return res.status(400).json({ message: 'Marque de voiture non trouvée' });
    }

    if (!brand.model_names.includes(req.body.model_name)) {
      return res.status(400).json({ 
        message: 'Modèle invalide pour cette marque',
        available_models: brand.model_names 
      });
    }

    const car = new Car({
      brand: req.body.brand,
      model_name: req.body.model_name,
      matricule: req.body.matricule,
      plate_number: req.body.plate_number,
      added_by: req.user._id,
      isAssociated: false
    });

    const newCar = await car.save();
    const populatedCar = await Car.findById(newCar._id)
      .populate('brand', 'brand_name model_names')
      .populate('added_by', 'name');

    // Log car creation
    await Log.create({
      user: req.user._id,
      action: 'create_car',
      entityType: 'Car',
      entityId: newCar._id,
      details: newCar.toObject()
    });

    // If customerId is provided, add the car to the customer
    if (req.body.customerId) {
      const Customer = require('../models/Customer');
      const customer = await Customer.findOne({ _id: req.body.customerId, isDeleted: false });
      
      if (!customer) {
        return res.status(404).json({ message: 'Client non trouvé' });
      }

      if (customer.cars.includes(newCar._id)) {
        return res.status(400).json({ message: 'Cette voiture est déjà assignée à ce client' });
      }

      customer.cars.push(newCar._id);
      await customer.save();

      newCar.isAssociated = true;
      await newCar.save();

      const updatedCustomer = await Customer.findById(customer._id)
        .populate({
          path: 'cars',
          populate: {
            path: 'brand',
            select: 'brand_name model_names'
          }
        });

      // Log car association
      await Log.create({
        user: req.user._id,
        action: 'associate_car',
        entityType: 'Car',
        entityId: newCar._id,
        details: { customerId: customer._id, carId: newCar._id }
      });

      return res.status(201).json({
        car: populatedCar,
        customer: updatedCustomer,
        message: 'Voiture créée et ajoutée au client avec succès'
      });
    }

    res.status(201).json(populatedCar);
  } catch (error) {
    if (error.name === 'CastError' && error.kind === 'ObjectId') {
      return res.status(400).json({ message: 'ID invalide' });
    }
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }
    res.status(400).json({ message: error.message });
  }
};

// Update car
exports.updateCar = async (req, res) => {
  try {
    const car = await Car.findOne({ _id: req.params.id, isDeleted: false });
    
    if (!car) {
      return res.status(404).json({ message: 'Voiture non trouvée' });
    }

    // If brand is being updated, verify it exists
    if (req.body.brand) {
      const brand = await CarBrand.findById(req.body.brand);
      if (!brand) {
        return res.status(400).json({ message: 'Marque de voiture non trouvée' });
      }
      
      // If model_name is also being updated, verify it's valid for the new brand
      if (req.body.model_name && !brand.model_names.includes(req.body.model_name)) {
        return res.status(400).json({ 
          message: 'Modèle invalide pour cette marque',
          available_models: brand.model_names 
        });
      }
    } 
    // If only model_name is being updated, verify it's valid for the current brand
    else if (req.body.model_name) {
      const brand = await CarBrand.findById(car.brand);
      if (!brand.model_names.includes(req.body.model_name)) {
        return res.status(400).json({ 
          message: 'Modèle invalide pour cette marque',
          available_models: brand.model_names 
        });
      }
    }

    // Update fields
    if (req.body.brand) car.brand = req.body.brand;
    if (req.body.model_name) car.model_name = req.body.model_name;
    if (req.body.matricule) car.matricule = req.body.matricule;
    if (req.body.plate_number) car.plate_number = req.body.plate_number;
    if (typeof req.body.isAssociated === 'boolean') car.isAssociated = req.body.isAssociated;

    const updatedCar = await car.save();
    const populatedCar = await Car.findById(updatedCar._id)
      .populate('brand', 'brand_name model_names')
      .populate('added_by', 'name');
      
    res.json(populatedCar);
  } catch (error) {
    if (error.name === 'CastError' && error.kind === 'ObjectId') {
      return res.status(400).json({ message: 'ID invalide' });
    }
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }
    res.status(400).json({ message: error.message });
  }
};

// Delete car (soft delete)
exports.deleteCar = async (req, res) => {
  try {
    const car = await Car.findOne({ _id: req.params.id, isDeleted: false });
    
    if (!car) {
      return res.status(404).json({ message: 'Voiture non trouvée' });
    }

    // Dissociate car from customer if associated
    if (car.isAssociated) {
      const Customer = require('../models/Customer');
      const customer = await Customer.findOne({ cars: car._id, isDeleted: false });
      if (customer) {
        customer.cars = customer.cars.filter(c => c.toString() !== car._id.toString());
        await customer.save();
      }
      car.isAssociated = false;
    }

    car.isDeleted = true;
    await car.save();
    
    res.json({ message: 'Voiture supprimée avec succès' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Restore a deleted car
exports.restoreCar = async (req, res) => {
  try {
    const car = await Car.findOne({ _id: req.params.id, isDeleted: true });
    
    if (!car) {
      return res.status(404).json({ message: 'Voiture non trouvée ou n\'est pas supprimée' });
    }

    car.isDeleted = false;
    await car.save();
    
    res.json({ 
      message: 'Voiture restaurée avec succès',
      car
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Disassociate car from customer
exports.disassociateCar = async (req, res) => {
  try {
    const car = await Car.findOne({ _id: req.params.id, isDeleted: false });
    
    if (!car) {
      return res.status(404).json({ message: 'Voiture non trouvée' });
    }

    if (!car.isAssociated) {
      return res.status(400).json({ message: 'Cette voiture n\'est pas associée à un client' });
    }

    // Find the customer that has this car
    const Customer = require('../models/Customer');
    const customer = await Customer.findOne({ 
      cars: car._id,
      isDeleted: false 
    });

    if (customer) {
      // Remove car from customer's cars array
      customer.cars = customer.cars.filter(c => c.toString() !== car._id.toString());
      await customer.save();
    }

    // Update car's isAssociated status
    car.isAssociated = false;
    await car.save();

    res.json({
      message: 'Voiture désassociée avec succès',
      car
    });
  } catch (error) {
    if (error.name === 'CastError' && error.kind === 'ObjectId') {
      return res.status(400).json({ message: 'Format d\'ID invalide' });
    }
    res.status(500).json({ message: error.message });
  }
};

// Associate car with customer
exports.associateCar = async (req, res) => {
  try {
    const car = await Car.findOne({ _id: req.params.id, isDeleted: false });
    if (!car) {
      return res.status(404).json({ message: 'Voiture non trouvée' });
    }
    if (car.isAssociated) {
      return res.status(400).json({ message: 'Cette voiture est déjà associée à un client' });
    }
    const customerId = req.body.customerId;
    if (!customerId) {
      return res.status(400).json({ message: 'customerId requis dans le corps de la requête' });
    }
    const Customer = require('../models/Customer');
    const customer = await Customer.findOne({ _id: customerId, isDeleted: false });
    if (!customer) {
      return res.status(404).json({ message: 'Client non trouvé' });
    }
    if (customer.cars.includes(car._id)) {
      return res.status(400).json({ message: 'Cette voiture est déjà assignée à ce client' });
    }
    // Add car to customer and update isAssociated status
    customer.cars.push(car._id);
    await customer.save();
    car.isAssociated = true;
    await car.save();
    // Log car association
    await Log.create({
      user: req.user._id,
      action: 'associate_car',
      entityType: 'Car',
      entityId: car._id,
      details: { customerId: customer._id, carId: car._id }
    });
    // Return updated customer with populated cars
    const updatedCustomer = await Customer.findById(customerId)
      .populate('cars', 'brand model_name matricule plate_number');
    res.json({
      message: 'Voiture associée avec succès',
      car,
      customer: updatedCustomer
    });
  } catch (error) {
    if (error.name === 'CastError' && error.kind === 'ObjectId') {
      return res.status(400).json({ message: 'Format d\'ID invalide' });
    }
    res.status(500).json({ message: error.message });
  }
}; 