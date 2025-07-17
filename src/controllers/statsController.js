const Car = require('../models/Car');
const Neotrack = require('../models/Neotrack');
const Sale = require('../models/Sale');
const Service = require('../models/Service');

// Client-specific stats
exports.getClientStats = async (req, res) => {
  try {
    const { customerId } = req.params;
    // Voitures
    const voitures = await Car.countDocuments({ isDeleted: false, _id: { $in: (await require('../models/Customer').findById(customerId)).cars } });
    // Neotracks
    const neotracks = await Neotrack.countDocuments({ customer: customerId });
    // Services
    const services = await Service.countDocuments({ customer: customerId, isDeleted: false });
    // Achats
    const mongoose = require('mongoose');
    const achatsComptants = await Sale.aggregate([
      { $match: { customer: new mongoose.Types.ObjectId(customerId), paymentMethod: 'cash', isDeleted: false } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);
    const achatsFacilites = await Sale.aggregate([
      { $match: { customer: new mongoose.Types.ObjectId(customerId), paymentMethod: { $ne: 'cash' }, isDeleted: false } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);
    const dettes = await Sale.aggregate([
      { $match: { customer: new mongoose.Types.ObjectId(customerId), paymentStatus: { $in: ['en_cours', 'pending', 'partial'] }, isDeleted: false } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);
    res.json({
      voitures,
      neotracks,
      services,
      achatsComptants: achatsComptants[0]?.total || 0,
      achatsFacilites: achatsFacilites[0]?.total || 0,
      dettes: dettes[0]?.total || 0
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Global stats
exports.getGlobalStats = async (req, res) => {
  try {
    const totalVoitures = await Car.countDocuments({ isDeleted: false });
    const totalNeotracks = await Neotrack.countDocuments({});
    const totalServices = await Service.countDocuments({ isDeleted: false });
    const Category = require('../models/Category');
    const totalCategories = await Category.countDocuments({});
    const Customer = require('../models/Customer');
    const totalClients = await Customer.countDocuments({});
    const Product = require('../models/Product');
    const totalProducts = await Product.countDocuments({});
    const totalAchatsComptants = await Sale.aggregate([
      { $match: { paymentMethod: 'cash', isDeleted: false } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);
    const totalAchatsFacilites = await Sale.aggregate([
      { $match: { paymentMethod: { $ne: 'cash' }, isDeleted: false } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);
    const totalDettes = await Sale.aggregate([
      { $match: { paymentStatus: { $in: ['en_cours', 'pending', 'partial'] }, isDeleted: false } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);
    res.json({
      totalVoitures,
      totalNeotracks,
      totalServices,
      categories: totalCategories,
      clients: totalClients,
      products: totalProducts,
      totalAchatsComptants: totalAchatsComptants[0]?.total || 0,
      totalAchatsFacilites: totalAchatsFacilites[0]?.total || 0,
      totalDettes: totalDettes[0]?.total || 0
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}; 