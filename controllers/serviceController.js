const Service = require('../models/Service');
const Customer = require('../models/Customer');
const Car = require('../models/Car');
const User = require('../models/User');
const mongoose = require('mongoose');
const Log = require('../models/Log');

// Create a new service
exports.createService = async (req, res) => {
  try {
    const {
      customer,
      car,
      serviceType,
      description,
      estimatedCost,
      priority,
      notes
    } = req.body;

    // Validate ObjectId format for customer
    if (!mongoose.Types.ObjectId.isValid(customer)) {
      return res.status(400).json({ 
        message: 'Invalid customer ID format. Please provide a valid customer ID.' 
      });
    }

    // Validate ObjectId format for car
    if (!mongoose.Types.ObjectId.isValid(car)) {
      return res.status(400).json({ 
        message: 'Invalid car ID format. Please provide a valid car ID.' 
      });
    }

    // Validate serviceType
    const validServiceTypes = ['repair', 'maintenance', 'inspection', 'installation', 'other'];
    if (!validServiceTypes.includes(serviceType)) {
      return res.status(400).json({ 
        message: `Invalid serviceType. Must be one of: ${validServiceTypes.join(', ')}` 
      });
    }

    // Validate priority
    const validPriorities = ['low', 'medium', 'high', 'urgent'];
    if (priority && !validPriorities.includes(priority)) {
      return res.status(400).json({ 
        message: `Invalid priority. Must be one of: ${validPriorities.join(', ')}` 
      });
    }

    // Validate customer exists
    const customerExists = await Customer.findById(customer);
    if (!customerExists) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    // Validate car exists
    const carExists = await Car.findById(car);
    if (!carExists) {
      return res.status(404).json({ message: 'Car not found' });
    }

    const service = new Service({
      customer,
      car,
      serviceType,
      description,
      estimatedCost,
      priority,
      notes,
      createdBy: req.user.id
    });

    await service.save();

    // Log creation
    console.log('Current user (service create):', req.user);
    console.log('About to create log (service create):', {
      user: req.user && req.user._id,
      action: 'create_service',
      entityType: 'Service',
      entityId: service._id,
      details: { ...service.toObject(), customer: service.customer }
    });
    const log = await Log.create({
      user: req.user._id,
      action: 'create_service',
      entityType: 'Service',
      entityId: service._id,
      details: { ...service.toObject(), customer: service.customer }
    });
    console.log('Log created (service create):', log);

    // Populate references for response
    await service.populate([
      { path: 'customer', select: 'fname lname phoneNumber' },
      { path: 'car', select: 'brand model_name matricule plate_number' },
      { path: 'createdBy', select: 'name' }
    ]);

    res.status(201).json({
      message: 'Service created successfully',
      service
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get all services with pagination and filters
exports.getAllServices = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      customer, 
      car, 
      serviceType, 
      status, 
      priority,
      assignedTo 
    } = req.query;
    const skip = (page - 1) * limit;

    const filter = { isDeleted: false };

    if (customer) filter.customer = customer;
    if (car) filter.car = car;
    if (serviceType) filter.serviceType = serviceType;
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (assignedTo) filter.assignedTo = assignedTo;

    const services = await Service.find(filter)
      .populate('customer', 'fname lname phoneNumber')
      .populate('car', 'brand model_name matricule plate_number')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Service.countDocuments(filter);

    res.json({
      services,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / limit),
        totalRecords: total
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get a single service by ID
exports.getService = async (req, res) => {
  try {
    const service = await Service.findById(req.params.id)
      .populate('customer', 'fname lname phoneNumber cin')
      .populate('car', 'brand model_name matricule plate_number')
      .populate('createdBy', 'name');

    if (!service || service.isDeleted) {
      return res.status(404).json({ message: 'Service not found' });
    }

    res.json(service);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update a service
exports.updateService = async (req, res) => {
  try {
    const {
      serviceType,
      description,
      status,
      estimatedCost,
      actualCost,
      completionDate,
      assignedTo,
      priority,
      notes
    } = req.body;

    const updateData = {};

    if (serviceType) updateData.serviceType = serviceType;
    if (description) updateData.description = description;
    if (status) updateData.status = status;
    if (estimatedCost !== undefined) updateData.estimatedCost = estimatedCost;
    if (actualCost !== undefined) updateData.actualCost = actualCost;
    if (assignedTo !== undefined) updateData.assignedTo = assignedTo;
    if (priority) updateData.priority = priority;
    if (notes !== undefined) updateData.notes = notes;

    // Set completion date when status is completed
    if (status === 'completed' && !req.body.completionDate) {
      updateData.completionDate = new Date();
    } else if (completionDate) {
      updateData.completionDate = completionDate;
    }

    const service = await Service.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).populate([
      { path: 'customer', select: 'fname lname phoneNumber' },
      { path: 'car', select: 'brand model_name matricule plate_number' },
      { path: 'createdBy', select: 'name' }
    ]);

    if (!service || service.isDeleted) {
      return res.status(404).json({ message: 'Service not found' });
    }

    // Log update
    console.log('Current user (service update):', req.user);
    console.log('About to create log (service update):', {
      user: req.user && req.user._id,
      action: 'update_service',
      entityType: 'Service',
      entityId: service._id,
      details: { ...service.toObject(), customer: service.customer }
    });
    const logUpdate = await Log.create({
      user: req.user._id,
      action: 'update_service',
      entityType: 'Service',
      entityId: service._id,
      details: { ...service.toObject(), customer: service.customer }
    });
    console.log('Log created (service update):', logUpdate);

    res.json({
      message: 'Service updated successfully',
      service
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete a service (soft delete)
exports.deleteService = async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);
    if (!service || service.isDeleted) {
      return res.status(404).json({ message: 'Service not found' });
    }

    service.isDeleted = true;
    await service.save();

    // Log delete
    console.log('Current user (service delete):', req.user);
    console.log('About to create log (service delete):', {
      user: req.user && req.user._id,
      action: 'delete_service',
      entityType: 'Service',
      entityId: service._id,
      details: { ...service.toObject(), customer: service.customer }
    });
    const logDelete = await Log.create({
      user: req.user._id,
      action: 'delete_service',
      entityType: 'Service',
      entityId: service._id,
      details: { ...service.toObject(), customer: service.customer }
    });
    console.log('Log created (service delete):', logDelete);

    res.json({ message: 'Service deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get services by customer
exports.getServicesByCustomer = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const skip = (page - 1) * limit;

    const filter = {
      customer: req.params.customerId,
      isDeleted: false
    };

    if (status) filter.status = status;

    const services = await Service.find(filter)
      .populate('car', 'brand model_name matricule plate_number')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Service.countDocuments(filter);

    res.json({
      services,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / limit),
        totalRecords: total
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get services by car
exports.getServicesByCar = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const skip = (page - 1) * limit;

    const filter = {
      car: req.params.carId,
      isDeleted: false
    };

    if (status) filter.status = status;

    const services = await Service.find(filter)
      .populate('customer', 'fname lname phoneNumber')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Service.countDocuments(filter);

    res.json({
      services,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / limit),
        totalRecords: total
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get service statistics
exports.getServiceStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const matchStage = { isDeleted: false };
    if (startDate || endDate) {
      matchStage.createdAt = {};
      if (startDate) matchStage.createdAt.$gte = new Date(startDate);
      if (endDate) matchStage.createdAt.$lte = new Date(endDate);
    }

    const stats = await Service.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalServices: { $sum: 1 },
          pendingServices: {
            $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
          },
          inProgressServices: {
            $sum: { $cond: [{ $eq: ['$status', 'in_progress'] }, 1, 0] }
          },
          completedServices: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          },
          cancelledServices: {
            $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] }
          },
          totalEstimatedCost: { $sum: '$estimatedCost' },
          totalActualCost: { $sum: '$actualCost' },
          avgEstimatedCost: { $avg: '$estimatedCost' },
          avgActualCost: { $avg: '$actualCost' }
        }
      }
    ]);

    // Get service type distribution
    const serviceTypeStats = await Service.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$serviceType',
          count: { $sum: 1 },
          avgCost: { $avg: '$actualCost' }
        }
      },
      { $sort: { count: -1 } }
    ]);

    res.json({
      summary: stats[0] || {
        totalServices: 0,
        pendingServices: 0,
        inProgressServices: 0,
        completedServices: 0,
        cancelledServices: 0,
        totalEstimatedCost: 0,
        totalActualCost: 0,
        avgEstimatedCost: 0,
        avgActualCost: 0
      },
      serviceTypeStats
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}; 