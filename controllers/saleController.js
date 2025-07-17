const Sale = require('../models/Sale');
const Product = require('../models/Product');
const Customer = require('../models/Customer');
const Log = require('../models/Log');

// Utility to convert Decimal128 fields to numbers and ensure proper JSON structure
function saleToJSON(sale) {
  const obj = sale.toObject ? sale.toObject() : sale;
  return {
    ...obj,
    totalAmount: obj.totalAmount ? parseFloat(obj.totalAmount.toString()) : 0,
    items: (obj.items || []).map(item => ({
      ...item,
      unitPrice: item.unitPrice ? parseFloat(item.unitPrice.toString()) : 0,
      totalPrice: item.totalPrice ? parseFloat(item.totalPrice.toString()) : 0,
      product: item.product && item.product.title ? item.product : undefined // populated product
    })),
    customer: obj.customer && obj.customer.fname ? obj.customer : undefined, // populated customer
    createdBy: obj.createdBy && obj.createdBy.name ? obj.createdBy : undefined // populated user
  };
}

// Create a new sale
exports.createSale = async (req, res) => {
  try {
    console.log('Request body:', req.body); // Debug log
    
    const { customer, products, items, totalAmount, paymentMethod, notes } = req.body;

    // Validate customer exists
    const customerExists = await Customer.findById(customer);
    if (!customerExists) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    // Validate and process items (handle both 'items' and 'products' field names)
    const itemsArray = items || products || [];
    if (!Array.isArray(itemsArray) || itemsArray.length === 0) {
      return res.status(400).json({ message: 'At least one product is required' });
    }

    const processedItems = [];
    let calculatedTotalAmount = 0;

    for (const item of itemsArray) {
      const product = await Product.findById(item.product);
      if (!product) {
        return res.status(404).json({ message: `Product ${item.product} not found` });
      }
      if (product.stock < item.quantity) {
        return res.status(400).json({ message: `Insufficient stock for product ${product.title}` });
      }

      const unitPrice = parseFloat(product.s_price);
      const totalPrice = unitPrice * item.quantity;
      calculatedTotalAmount += totalPrice;

      processedItems.push({
        product: item.product,
        quantity: parseInt(item.quantity),
        unitPrice: unitPrice,
        totalPrice: totalPrice
      });

      // Update product stock
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: -parseInt(item.quantity) }
      });
    }

    // Ensure paymentMethod is valid and has a default
    const validPaymentMethods = ['cash', 'card', 'check', 'transfer'];
    const finalPaymentMethod = validPaymentMethods.includes(paymentMethod) ? paymentMethod : 'cash';

    // Use provided totalAmount or calculated amount
    const finalTotalAmount = totalAmount && parseFloat(totalAmount) > 0 ? parseFloat(totalAmount) : calculatedTotalAmount;

    const saleData = {
      customer,
      items: processedItems,
      totalAmount: finalTotalAmount,
      paymentMethod: finalPaymentMethod,
      notes: notes || '',
      createdBy: req.user.id,
      paymentStatus: 'en_cours'
    };

    console.log('Sale data to save:', saleData); // Debug log

    let sale = new Sale(saleData);
    await sale.save();

    // Log creation
    console.log('Current user (achat create):', req.user);
    console.log('About to create log (achat create):', {
      user: req.user && req.user._id,
      action: 'create_achat',
      entityType: 'Achat',
      entityId: sale._id,
      details: { ...sale.toObject(), customer: sale.customer }
    });
    const log = await Log.create({
      user: req.user._id,
      action: 'create_achat',
      entityType: 'Achat',
      entityId: sale._id,
      details: { ...sale.toObject(), customer: sale.customer }
    });
    console.log('Log created (achat create):', log);

    // Populate references for response
    sale = await sale.populate([
      { path: 'customer', select: 'fname lname phoneNumber' },
      { path: 'items.product', select: 'title' },
      { path: 'createdBy', select: 'name' }
    ]);

    res.status(201).json({
      message: 'Sale created successfully',
      sale: saleToJSON(sale)
    });
  } catch (error) {
    console.error('Sale creation error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get all sales with pagination and filters
exports.getAllSales = async (req, res) => {
  try {
    const { page = 1, limit = 10, customer, status, startDate, endDate, paymentMethod } = req.query;
    const skip = (page - 1) * limit;

    const filter = { isDeleted: false };

    if (customer) filter.customer = customer;
    if (status) filter.paymentStatus = status;
    if (paymentMethod) filter.paymentMethod = paymentMethod;
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    let sales = await Sale.find(filter)
      .populate('customer', 'fname lname phoneNumber')
      .populate('items.product', 'title')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Sale.countDocuments(filter);

    res.json({
      sales: sales.map(saleToJSON),
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

// Get a single sale by ID
exports.getSale = async (req, res) => {
  try {
    let sale = await Sale.findById(req.params.id)
      .populate('customer', 'fname lname phoneNumber cin')
      .populate('items.product', 'title b_price s_price')
      .populate('createdBy', 'name');

    if (!sale || sale.isDeleted) {
      return res.status(404).json({ message: 'Sale not found' });
    }

    res.json(saleToJSON(sale));
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update a sale
exports.updateSale = async (req, res) => {
  try {
    const { customer, items, products, totalAmount, paymentMethod, paymentStatus, notes } = req.body;
    const updateData = {};

    if (customer) updateData.customer = customer;
    if (paymentStatus) updateData.paymentStatus = paymentStatus;
    if (paymentMethod) updateData.paymentMethod = paymentMethod;
    if (notes !== undefined) updateData.notes = notes;
    if (totalAmount) updateData.totalAmount = totalAmount;

    // Handle items/products update
    const itemsArray = items || products;
    if (itemsArray && Array.isArray(itemsArray) && itemsArray.length > 0) {
      updateData.items = [];
      let calculatedTotalAmount = 0;
      for (const item of itemsArray) {
        const product = await Product.findById(item.product);
        if (!product) {
          return res.status(404).json({ message: `Product ${item.product} not found` });
        }
        if (product.stock < item.quantity) {
          return res.status(400).json({ message: `Insufficient stock for product ${product.title}` });
        }
        const unitPrice = parseFloat(product.s_price);
        const totalPrice = unitPrice * item.quantity;
        calculatedTotalAmount += totalPrice;
        updateData.items.push({
          product: item.product,
          quantity: parseInt(item.quantity),
          unitPrice: unitPrice,
          totalPrice: totalPrice
        });
      }
      // If totalAmount not provided, use calculated
      if (!totalAmount) updateData.totalAmount = calculatedTotalAmount;
    }

    const sale = await Sale.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).populate([
      { path: 'customer', select: 'fname lname phoneNumber' },
      { path: 'items.product', select: 'title' },
      { path: 'createdBy', select: 'name' }
    ]);

    if (!sale || sale.isDeleted) {
      return res.status(404).json({ message: 'Sale not found' });
    }

    // Log update
    console.log('Current user (achat update):', req.user);
    console.log('About to create log (achat update):', {
      user: req.user && req.user._id,
      action: 'update_achat',
      entityType: 'Achat',
      entityId: sale._id,
      details: { ...sale.toObject(), customer: sale.customer }
    });
    const logUpdate = await Log.create({
      user: req.user._id,
      action: 'update_achat',
      entityType: 'Achat',
      entityId: sale._id,
      details: { ...sale.toObject(), customer: sale.customer }
    });
    console.log('Log created (achat update):', logUpdate);

    res.json({
      message: 'Sale updated successfully',
      sale: saleToJSON(sale)
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete a sale (soft delete)
exports.deleteSale = async (req, res) => {
  try {
    const sale = await Sale.findById(req.params.id);
    if (!sale || sale.isDeleted) {
      return res.status(404).json({ message: 'Sale not found' });
    }

    // Restore product stock
    for (const item of sale.items) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: item.quantity }
      });
    }

    sale.isDeleted = true;
    await sale.save();

    // Log delete
    console.log('Current user (achat delete):', req.user);
    console.log('About to create log (achat delete):', {
      user: req.user && req.user._id,
      action: 'delete_achat',
      entityType: 'Achat',
      entityId: sale._id,
      details: { ...sale.toObject(), customer: sale.customer }
    });
    const logDelete = await Log.create({
      user: req.user._id,
      action: 'delete_achat',
      entityType: 'Achat',
      entityId: sale._id,
      details: { ...sale.toObject(), customer: sale.customer }
    });
    console.log('Log created (achat delete):', logDelete);

    res.json({ message: 'Sale deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get sales by customer
exports.getSalesByCustomer = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const sales = await Sale.find({
      customer: req.params.customerId,
      isDeleted: false
    })
      .populate('items.product', 'title')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Sale.countDocuments({
      customer: req.params.customerId,
      isDeleted: false
    });

    res.json({
      sales,
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

// Get sales reports
exports.getSalesReports = async (req, res) => {
  try {
    const { startDate, endDate, groupBy = 'day' } = req.query;

    const matchStage = { isDeleted: false };
    if (startDate || endDate) {
      matchStage.createdAt = {};
      if (startDate) matchStage.createdAt.$gte = new Date(startDate);
      if (endDate) matchStage.createdAt.$lte = new Date(endDate);
    }

    let groupStage = {};
    if (groupBy === 'day') {
      groupStage = {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }
      };
    } else if (groupBy === 'month') {
      groupStage = {
        _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } }
      };
    } else if (groupBy === 'year') {
      groupStage = {
        _id: { $dateToString: { format: "%Y", date: "$createdAt" } }
      };
    }

    const reports = await Sale.aggregate([
      { $match: matchStage },
      {
        $group: {
          ...groupStage,
          totalSales: { $sum: "$totalAmount" },
          count: { $sum: 1 },
          avgAmount: { $avg: "$totalAmount" }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Get summary statistics
    const summary = await Sale.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$totalAmount" },
          totalSales: { $sum: 1 },
          avgSaleAmount: { $avg: "$totalAmount" },
          minSaleAmount: { $min: "$totalAmount" },
          maxSaleAmount: { $max: "$totalAmount" }
        }
      }
    ]);

    res.json({
      reports,
      summary: summary[0] || {
        totalRevenue: 0,
        totalSales: 0,
        avgSaleAmount: 0,
        minSaleAmount: 0,
        maxSaleAmount: 0
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}; 