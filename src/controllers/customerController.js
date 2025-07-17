const Customer = require('../models/Customer');

// Get all customers with pagination and filtering
exports.getAllCustomers = async (req, res) => {
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
      filter.isDeleted = false; // Default: show only active customers
    }

    // Filter by search term (search in fname, lname, phoneNumber, or cin)
    if (req.query.search) {
      filter.$or = [
        { fname: { $regex: req.query.search, $options: 'i' } },
        { lname: { $regex: req.query.search, $options: 'i' } },
        { phoneNumber: { $regex: req.query.search, $options: 'i' } },
        { cin: { $regex: req.query.search, $options: 'i' } }
      ];
    }

    const customers = await Customer.find(filter)
      .populate('added_by', 'name')
      .populate('cars', 'brand model matricule plate_number')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await Customer.countDocuments(filter);

    res.json({
      customers,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalCustomers: total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get single customer
exports.getCustomer = async (req, res) => {
  try {
    const customer = await Customer.findOne({ _id: req.params.id, isDeleted: false })
      .populate('added_by', 'name')
      .populate({
        path: 'cars',
        select: 'brand model_name matricule plate_number',
        populate: {
          path: 'brand',
          select: 'brand_name'
        }
      });
    
    if (!customer) {
      return res.status(404).json({ message: 'Client non trouvé' });
    }
    
    res.json(customer);
  } catch (error) {
    if (error.name === 'CastError' && error.kind === 'ObjectId') {
      return res.status(400).json({ message: 'ID client invalide' });
    }
    res.status(500).json({ message: error.message });
  }
};

// Create customer
exports.createCustomer = async (req, res) => {
  try {
    // Check for existing phoneNumber or cin
    const existing = await Customer.findOne({
      $or: [
        { phoneNumber: req.body.phoneNumber },
        { cin: req.body.cin }
      ],
      isDeleted: false
    });
    if (existing) {
      return res.status(400).json({ message: 'Numéro de téléphone ou CIN déjà existant.' });
    }

    const customer = new Customer({
      fname: req.body.fname,
      lname: req.body.lname,
      cin: req.body.cin,
      phoneNumber: req.body.phoneNumber,
      added_by: req.user._id,
      cars: req.body.cars || []
    });

    const newCustomer = await customer.save();
    
    // Populate cars for the response
    const populatedCustomer = await Customer.findById(newCustomer._id)
      .populate('cars', 'brand model matricule plate_number');
    
    res.status(201).json(populatedCustomer);
  } catch (error) {
    if (error.code === 11000) {
      // Duplicate key error
      return res.status(400).json({ message: 'Numéro de téléphone ou CIN déjà existant.' });
    }
    res.status(400).json({ message: error.message });
  }
};

// Update customer
exports.updateCustomer = async (req, res) => {
  try {
    const customer = await Customer.findOne({ _id: req.params.id, isDeleted: false });
    
    if (!customer) {
      return res.status(404).json({ message: 'Client non trouvé' });
    }

    // Check for existing phoneNumber or cin (excluding current customer)
    if (req.body.phoneNumber || req.body.cin) {
      const conflict = await Customer.findOne({
        $or: [
          req.body.phoneNumber ? { phoneNumber: req.body.phoneNumber } : {},
          req.body.cin ? { cin: req.body.cin } : {}
        ],
        _id: { $ne: customer._id },
        isDeleted: false
      });
      if (conflict) {
        return res.status(400).json({ message: 'Numéro de téléphone ou CIN déjà existant.' });
      }
    }

    // Update fields
    if (req.body.fname) customer.fname = req.body.fname;
    if (req.body.lname) customer.lname = req.body.lname;
    if (req.body.cin) customer.cin = req.body.cin;
    if (req.body.phoneNumber) customer.phoneNumber = req.body.phoneNumber;
    if (req.body.cars) customer.cars = req.body.cars;

    const updatedCustomer = await customer.save();
    
    // Populate cars for the response
    const populatedCustomer = await Customer.findById(updatedCustomer._id)
      .populate('cars', 'brand model matricule plate_number');
    
    res.json(populatedCustomer);
  } catch (error) {
    if (error.name === 'CastError' && error.kind === 'ObjectId') {
      return res.status(400).json({ message: 'ID client invalide' });
    }
    if (error.code === 11000) {
      // Duplicate key error
      return res.status(400).json({ message: 'Numéro de téléphone ou CIN déjà existant.' });
    }
    res.status(400).json({ message: error.message });
  }
};

// Delete customer (soft delete)
exports.deleteCustomer = async (req, res) => {
  try {
    const customer = await Customer.findOne({ _id: req.params.id, isDeleted: false });
    
    if (!customer) {
      return res.status(404).json({ message: 'Client non trouvé' });
    }

    customer.isDeleted = true;
    await customer.save();
    
    res.json({ message: 'Client supprimé avec succès' });
  } catch (error) {
    if (error.name === 'CastError' && error.kind === 'ObjectId') {
      return res.status(400).json({ message: 'ID client invalide' });
    }
    res.status(500).json({ message: error.message });
  }
};

// Restore a deleted customer
exports.restoreCustomer = async (req, res) => {
  try {
    const customer = await Customer.findOne({ _id: req.params.id, isDeleted: true });
    
    if (!customer) {
      return res.status(404).json({ message: 'Client non trouvé ou n\'est pas supprimé' });
    }

    customer.isDeleted = false;
    await customer.save();
    
    res.json({ 
      message: 'Client restauré avec succès',
      customer
    });
  } catch (error) {
    if (error.name === 'CastError' && error.kind === 'ObjectId') {
      return res.status(400).json({ message: 'ID client invalide' });
    }
    res.status(500).json({ message: error.message });
  }
};

// Add car to customer
exports.addCarToCustomer = async (req, res) => {
  try {
    const { customerId, carId } = req.params;
    
    const customer = await Customer.findOne({ _id: customerId, isDeleted: false });
    if (!customer) {
      return res.status(404).json({ message: 'Client non trouvé' });
    }
    
    // Check if car exists and is not deleted
    const Car = require('../models/Car');
    const car = await Car.findOne({ _id: carId, isDeleted: false });
    if (!car) {
      return res.status(404).json({ message: 'Voiture non trouvée' });
    }
    
    // Check if car is already assigned to this customer
    if (customer.cars.includes(carId)) {
      return res.status(400).json({ message: 'Cette voiture est déjà assignée à ce client' });
    }

    // Check if car is already associated with another customer
    if (car.isAssociated) {
      return res.status(400).json({ message: 'Cette voiture est déjà associée à un autre client' });
    }
    
    // Add car to customer and update isAssociated status
    customer.cars.push(carId);
    await customer.save();

    // Update car's isAssociated status
    car.isAssociated = true;
    await car.save();
    
    // Return updated customer with populated cars
    const updatedCustomer = await Customer.findById(customerId)
      .populate('cars', 'brand model matricule plate_number');
    
    res.json({
      message: 'Voiture ajoutée avec succès',
      customer: updatedCustomer
    });
  } catch (error) {
    if (error.name === 'CastError' && error.kind === 'ObjectId') {
      return res.status(400).json({ message: 'Format d\'ID invalide' });
    }
    res.status(500).json({ message: error.message });
  }
};

// Remove car from customer
exports.removeCarFromCustomer = async (req, res) => {
  try {
    const { customerId, carId } = req.params;
    
    const customer = await Customer.findOne({ _id: customerId, isDeleted: false });
    if (!customer) {
      return res.status(404).json({ message: 'Client non trouvé' });
    }
    
    // Check if car is assigned to this customer
    if (!customer.cars.includes(carId)) {
      return res.status(400).json({ message: 'Cette voiture n\'est pas assignée à ce client' });
    }

    // Get car and update its isAssociated status
    const Car = require('../models/Car');
    const car = await Car.findOne({ _id: carId, isDeleted: false });
    if (car) {
      car.isAssociated = false;
      await car.save();
    }
    
    // Remove car from customer
    customer.cars = customer.cars.filter(car => car.toString() !== carId);
    await customer.save();
    
    // Return updated customer with populated cars
    const updatedCustomer = await Customer.findById(customerId)
      .populate('cars', 'brand model matricule plate_number');
    
    res.json({
      message: 'Voiture retirée avec succès',
      customer: updatedCustomer
    });
  } catch (error) {
    if (error.name === 'CastError' && error.kind === 'ObjectId') {
      return res.status(400).json({ message: 'Format d\'ID invalide' });
    }
    res.status(500).json({ message: error.message });
  }
}; 