const Product = require('../models/Product');

// Create a new product
exports.createProduct = async (req, res) => {
  try {
    const product = new Product({
      ...req.body,
      added_by: req.user._id
    });
    await product.save();
    res.status(201).json(product);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Update a product
exports.updateProduct = async (req, res) => {
  try {
    const product = await Product.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      req.body,
      { new: true, runValidators: true }
    );

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json(product);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete a product (soft delete)
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      { isDeleted: true },
      { new: true }
    );

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Restore a deleted product
exports.restoreProduct = async (req, res) => {
  try {
    const product = await Product.findOneAndUpdate(
      { _id: req.params.id, isDeleted: true },
      { isDeleted: false },
      { new: true }
    );

    if (!product) {
      return res.status(404).json({ message: 'Product not found or is not deleted' });
    }

    res.json({ 
      message: 'Product restored successfully',
      product
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Get all products with pagination
exports.getAllProducts = async (req, res) => {
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
      filter.isDeleted = false;
    }
    // Filter by category (single or comma-separated list)
    if (req.query.category) {
      const categories = req.query.category.split(',');
      filter.categories = { $in: categories };
    }
    // Filter by product name (case-insensitive search)
    if (req.query.search) {
      filter.title = { $regex: req.query.search, $options: 'i' };
    }

    const products = await Product.find(filter)
      .populate('added_by', 'name')
      .populate('categories', 'title isDeleted')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await Product.countDocuments(filter);

    res.json({
      products,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalProducts: total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get a specific product
exports.getProduct = async (req, res) => {
  try {
    const product = await Product.findOne({ 
      _id: req.params.id,
      isDeleted: false 
    })
      .populate('added_by', 'name')
      .populate('categories', 'title isDeleted');

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get products with low stock
exports.getLowStockProducts = async (req, res) => {
  try {
    const { threshold = 10, page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const filter = {
      isDeleted: false,
      stock: { $lte: parseInt(threshold) }
    };

    const products = await Product.find(filter)
      .populate('added_by', 'name')
      .populate('categories', 'title')
      .sort({ stock: 1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Product.countDocuments(filter);

    res.json({
      products,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / limit),
        totalRecords: total
      },
      threshold: parseInt(threshold)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update product stock
exports.updateStock = async (req, res) => {
  try {
    const { stock, operation = 'set' } = req.body; // operation: 'set', 'add', 'subtract'
    
    if (stock === undefined || stock < 0) {
      return res.status(400).json({ message: 'Invalid stock value' });
    }

    const product = await Product.findById(req.params.id);
    if (!product || product.isDeleted) {
      return res.status(404).json({ message: 'Product not found' });
    }

    let newStock;
    switch (operation) {
      case 'set':
        newStock = stock;
        break;
      case 'add':
        newStock = product.stock + stock;
        break;
      case 'subtract':
        newStock = product.stock - stock;
        if (newStock < 0) {
          return res.status(400).json({ message: 'Insufficient stock' });
        }
        break;
      default:
        return res.status(400).json({ message: 'Invalid operation' });
    }

    product.stock = newStock;
    await product.save();

    await product.populate('added_by', 'name');
    await product.populate('categories', 'title');

    res.json({
      message: 'Stock updated successfully',
      product,
      previousStock: product.stock - (operation === 'add' ? stock : operation === 'subtract' ? -stock : 0)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get stock alerts
exports.getStockAlerts = async (req, res) => {
  try {
    const { criticalThreshold = 5, warningThreshold = 15 } = req.query;

    const criticalStock = await Product.find({
      isDeleted: false,
      stock: { $lte: parseInt(criticalThreshold) }
    })
      .populate('added_by', 'name')
      .populate('categories', 'title')
      .sort({ stock: 1 });

    const warningStock = await Product.find({
      isDeleted: false,
      stock: { 
        $gt: parseInt(criticalThreshold), 
        $lte: parseInt(warningThreshold) 
      }
    })
      .populate('added_by', 'name')
      .populate('categories', 'title')
      .sort({ stock: 1 });

    res.json({
      critical: {
        count: criticalStock.length,
        products: criticalStock,
        threshold: parseInt(criticalThreshold)
      },
      warning: {
        count: warningStock.length,
        products: warningStock,
        threshold: parseInt(warningThreshold)
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}; 