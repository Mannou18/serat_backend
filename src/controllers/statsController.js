const Car = require('../models/Car');
const Neotrack = require('../models/Neotrack');
const Service = require('../models/Service');
const Vente = require('../models/Vente');
const Customer = require('../models/Customer');

// Client-specific stats
exports.getClientStats = async (req, res) => {
  try {
    const { customerId } = req.params;
    
    // Verify customer exists
    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    // Voitures
    const voitures = await Car.countDocuments({ 
      isDeleted: false, 
      _id: { $in: customer.cars || [] } 
    });
    
    // Neotracks
    const neotracks = await Neotrack.countDocuments({ customer: customerId });
    
    // Services
    const services = await Service.countDocuments({ customer: customerId, isDeleted: false });
    
    // Ventes (new system)
    const mongoose = require('mongoose');
    
    // Comptant sales (cash payments)
    const ventesComptants = await Vente.aggregate([
      { 
        $match: { 
          customer: new mongoose.Types.ObjectId(customerId), 
          paymentType: 'comptant', 
          isDeleted: false 
        } 
      },
      { 
        $group: { 
          _id: null, 
          total: { $sum: { $toDouble: '$totalCost' } },
          count: { $sum: 1 }
        } 
      }
    ]);
    
    // Facilite sales (installment payments)
    const ventesFacilites = await Vente.aggregate([
      { 
        $match: { 
          customer: new mongoose.Types.ObjectId(customerId), 
          paymentType: 'facilite', 
          isDeleted: false 
        } 
      },
      { 
        $group: { 
          _id: null, 
          total: { $sum: { $toDouble: '$totalCost' } },
          count: { $sum: 1 }
        } 
      }
    ]);
    
    // Calculate pending installments (dettes)
    const pendingInstallments = await Vente.aggregate([
      { 
        $match: { 
          customer: new mongoose.Types.ObjectId(customerId), 
          paymentType: 'facilite', 
          isDeleted: false,
          'installments.status': { $in: ['pending', 'overdue'] }
        } 
      },
      { $unwind: '$installments' },
      { 
        $match: { 
          'installments.status': { $in: ['pending', 'overdue'] } 
        } 
      },
      { 
        $group: { 
          _id: null, 
          total: { $sum: { $toDouble: '$installments.amount' } },
          count: { $sum: 1 }
        } 
      }
    ]);
    
    // Calculate paid installments
    const paidInstallments = await Vente.aggregate([
      { 
        $match: { 
          customer: new mongoose.Types.ObjectId(customerId), 
          paymentType: 'facilite', 
          isDeleted: false,
          'installments.status': 'paid'
        } 
      },
      { $unwind: '$installments' },
      { 
        $match: { 
          'installments.status': 'paid' 
        } 
      },
      { 
        $group: { 
          _id: null, 
          total: { $sum: { $toDouble: '$installments.amount' } },
          count: { $sum: 1 }
        } 
      }
    ]);

    // Get total ventes count
    const totalVentes = await Vente.countDocuments({ 
      customer: customerId, 
      isDeleted: false 
    });

    res.json({
      voitures,
      neotracks,
      services,
      ventesComptants: ventesComptants[0]?.total || 0,
      ventesFacilites: ventesFacilites[0]?.total || 0,
      totalVentes,
      dettes: pendingInstallments[0]?.total || 0,
      pendingInstallmentsCount: pendingInstallments[0]?.count || 0,
      paidInstallments: paidInstallments[0]?.total || 0,
      paidInstallmentsCount: paidInstallments[0]?.count || 0,
      // Legacy compatibility - keep old field names
      achatsComptants: ventesComptants[0]?.total || 0,
      achatsFacilites: ventesFacilites[0]?.total || 0
    });
  } catch (error) {
    console.error('Error in getClientStats:', error);
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
    const totalClients = await Customer.countDocuments({});
    const Product = require('../models/Product');
    const totalProducts = await Product.countDocuments({});
    
    // Ventes (new system)
    const mongoose = require('mongoose');
    
    const totalVentesComptants = await Vente.aggregate([
      { $match: { paymentType: 'comptant', isDeleted: false } },
      { $group: { _id: null, total: { $sum: { $toDouble: '$totalCost' } } } }
    ]);
    
    const totalVentesFacilites = await Vente.aggregate([
      { $match: { paymentType: 'facilite', isDeleted: false } },
      { $group: { _id: null, total: { $sum: { $toDouble: '$totalCost' } } } }
    ]);
    
    // Calculate total pending installments (dettes)
    const totalDettes = await Vente.aggregate([
      { 
        $match: { 
          paymentType: 'facilite', 
          isDeleted: false,
          'installments.status': { $in: ['pending', 'overdue'] }
        } 
      },
      { $unwind: '$installments' },
      { 
        $match: { 
          'installments.status': { $in: ['pending', 'overdue'] } 
        } 
      },
      { 
        $group: { 
          _id: null, 
          total: { $sum: { $toDouble: '$installments.amount' } }
        } 
      }
    ]);
    
    // Get total ventes count
    const totalVentes = await Vente.countDocuments({ isDeleted: false });
    
    res.json({
      totalVoitures,
      totalNeotracks,
      totalServices,
      categories: totalCategories,
      clients: totalClients,
      products: totalProducts,
      totalVentes,
      totalVentesComptants: totalVentesComptants[0]?.total || 0,
      totalVentesFacilites: totalVentesFacilites[0]?.total || 0,
      totalDettes: totalDettes[0]?.total || 0,
      // Legacy compatibility - keep old field names
      totalAchatsComptants: totalVentesComptants[0]?.total || 0,
      totalAchatsFacilites: totalVentesFacilites[0]?.total || 0
    });
  } catch (error) {
    console.error('Error in getGlobalStats:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}; 