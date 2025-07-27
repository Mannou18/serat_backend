const Vente = require('../models/Vente');
const Product = require('../models/Product');
const Service = require('../models/Service');
const Customer = require('../models/Customer');
const PDFDocument = require('pdfkit');
const mongoose = require('mongoose'); // Added for database transactions
const puppeteer = require('puppeteer');
const { createInvoiceHTML } = require('../templates/invoiceTemplate');

// Create a new vente
exports.createVente = async (req, res) => {
  try {
    const { customer, articles, services, reduction, reductionType, paymentType, installments, notes } = req.body;
    
    // STEP 1: Validate customer
    const customerExists = await Customer.findById(customer);
    if (!customerExists) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    // STEP 2: Check stock availability FIRST (read-only validation)
    let articlesTotal = 0;
    let processedArticles = [];
    if (Array.isArray(articles)) {
      for (const art of articles) {
        // Normalize: art can be {product: id, ...} or just an id
        let productId;
        let quantity = 1;
        if (typeof art === 'string') {
          productId = art;
        } else if (art && typeof art === 'object') {
          productId = art.product || art._id;
          quantity = art.quantity || 1;
        }
        if (!productId) {
          return res.status(400).json({ message: 'Product ID missing in one of the articles' });
        }
        
        // Check stock availability (read-only)
        const product = await Product.findById(productId);
        if (!product) {
          return res.status(404).json({ message: `Product ${productId} not found` });
        }
        if (product.stock < quantity) {
          return res.status(400).json({ 
            message: `Insufficient stock for product ${product.title}. Available: ${product.stock}, Requested: ${quantity}` 
          });
        }
        
        // Calculate prices (read-only)
        const unitPrice = parseFloat(product.s_price);
        const totalPrice = unitPrice * quantity;
        articlesTotal += totalPrice;
        processedArticles.push({
          product: productId,
          quantity,
          unitPrice,
          totalPrice
        });
      }
    }

    // STEP 3: Process services (read-only validation)
    let processedServices = [];
    let servicesTotal = 0;
    if (Array.isArray(services)) {
      for (const srv of services) {
        // Normalize: srv can be {service: id, ...} or just an id
        let serviceId;
        if (typeof srv === 'string') {
          serviceId = srv;
        } else if (srv && typeof srv === 'object') {
          serviceId = srv.service || srv._id;
        }
        if (!serviceId) {
          return res.status(400).json({ message: 'Service ID missing in one of the services' });
        }
        
        const service = await Service.findById(serviceId);
        if (!service) {
          return res.status(404).json({ message: `Service ${serviceId} not found` });
        }
        const cost = parseFloat(srv.cost || service.actualCost || 0);
        servicesTotal += cost;
        processedServices.push({
          service: serviceId,
          description: srv.description || service.description,
          cost
        });
      }
    }

    // STEP 4: Calculate total and apply reduction
    let totalCost = articlesTotal + servicesTotal;
    let reductionValue = 0;
    if (reduction && reductionType) {
      const reductionNum = Number(reduction);
      if (reductionType === 'amount') {
        // Montant: fixed amount
        reductionValue = Math.min(reductionNum, totalCost);
      } else if (reductionType === 'percent') {
        // Pourcentage: percentage
        if (reductionNum > 0 && reductionNum < 100) {
          reductionValue = (totalCost * reductionNum) / 100;
        }
      }
      totalCost = Math.max(0, totalCost - reductionValue);
    }

    // STEP 5: Validate paymentType and installments
    let processedInstallments = [];
    if (paymentType === 'facilite') {
      if (!Array.isArray(installments) || installments.length === 0) {
        return res.status(400).json({ message: 'Installments required for payment type facilite' });
      }
      let sumInstallments = 0;
      for (const inst of installments) {
        if (!inst.amount || !inst.dueDate) {
          return res.status(400).json({ message: 'Each installment must have amount and dueDate' });
        }
        const instAmount = parseFloat(inst.amount);
        sumInstallments += instAmount;
        processedInstallments.push({
          amount: inst.amount,
          dueDate: new Date(inst.dueDate)
        });
      }
      // Check that sum of installments matches totalCost
      if (Math.abs(sumInstallments - totalCost) > 0.01) {
        return res.status(400).json({ 
          message: 'Sum of installments does not match total cost',
          details: {
            sumInstallments,
            totalCost,
            difference: Math.abs(sumInstallments - totalCost),
            articlesTotal,
            servicesTotal,
            reduction,
            reductionValue
          }
        });
      }
    }

    // STEP 6: Use database transaction to ensure atomicity
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
      // Create vente first
      const vente = new Vente({
        customer,
        articles: processedArticles,
        services: processedServices,
        reduction: reduction || 0,
        totalCost,
        paymentType,
        installments: processedInstallments,
        notes: notes || '',
        createdBy: req.user.id
      });
      await vente.save({ session });

      // Only reduce stock AFTER successful vente creation
      for (const article of processedArticles) {
        await Product.findByIdAndUpdate(
          article.product, 
          { $inc: { stock: -article.quantity } },
          { session }
        );
      }

      // Commit the transaction
      await session.commitTransaction();
      
      res.status(201).json({ message: 'Vente created successfully', vente });
    } catch (error) {
      // Rollback the transaction on any error
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  } catch (err) {
    console.error('Error creating vente:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Get all ventes (with optional customer filter and pagination)
exports.getAllVentes = async (req, res) => {
  try {
    const { customer, page = 1, limit = 20 } = req.query;
    const filter = { isDeleted: false };
    if (customer) filter.customer = customer;
    const ventes = await Vente.find(filter)
      .populate('customer')
      .populate('articles.product')
      .populate('services.service')
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .sort({ createdAt: -1 });
    const total = await Vente.countDocuments(filter);
    res.json({ total, page: Number(page), limit: Number(limit), ventes });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Get a single vente by ID
exports.getVenteById = async (req, res) => {
  try {
    const vente = await Vente.findById(req.params.id)
      .populate('customer')
      .populate('articles.product')
      .populate('services.service');
    if (!vente || vente.isDeleted) {
      return res.status(404).json({ message: 'Vente not found' });
    }
    res.json(vente);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Update a vente (PUT)
exports.updateVente = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const vente = await Vente.findById(req.params.id).session(session);
    if (!vente || vente.isDeleted) {
      await session.abortTransaction();
      return res.status(404).json({ message: 'Vente not found' });
    }

    const { articles, services, reduction, reductionType, paymentType, installments, notes } = req.body;

    // --- 1. Prepare old articles for stock adjustment ---
    const oldArticles = Array.isArray(vente.articles) ? vente.articles.map(a => ({
      product: a.product.toString(),
      quantity: a.quantity
    })) : [];

    // --- 2. Check stock availability for new articles ---
    let articlesTotal = 0;
    let processedArticles = [];
    if (Array.isArray(articles)) {
      for (const art of articles) {
        let productId;
        let quantity = 1;
        if (typeof art === 'string') {
          productId = art;
        } else if (art && typeof art === 'object') {
          productId = art.product || art._id;
          quantity = art.quantity || 1;
        }
        if (!productId) {
          await session.abortTransaction();
          return res.status(400).json({ message: 'Product ID missing in one of the articles' });
        }
        const product = await Product.findById(productId).session(session);
        if (!product) {
          await session.abortTransaction();
          return res.status(404).json({ message: `Product ${productId} not found` });
        }
        // Calculate stock difference for this product
        const oldArticle = oldArticles.find(a => a.product === productId);
        const oldQty = oldArticle ? oldArticle.quantity : 0;
        const qtyDiff = quantity - oldQty;
        if (qtyDiff > 0 && product.stock < qtyDiff) {
          await session.abortTransaction();
          return res.status(400).json({ message: `Insufficient stock for product ${product.title}. Available: ${product.stock}, Requested additional: ${qtyDiff}` });
        }
        const unitPrice = parseFloat(product.s_price);
        const totalPrice = unitPrice * quantity;
        articlesTotal += totalPrice;
        processedArticles.push({
          product: productId,
          quantity,
          unitPrice,
          totalPrice
        });
      }
    }

    // --- 3. Process services ---
    let processedServices = [];
    let servicesTotal = 0;
    if (Array.isArray(services)) {
      for (const srv of services) {
        let serviceId;
        if (typeof srv === 'string') {
          serviceId = srv;
        } else if (srv && typeof srv === 'object') {
          serviceId = srv.service || srv._id;
        }
        if (!serviceId) {
          await session.abortTransaction();
          return res.status(400).json({ message: 'Service ID missing in one of the services' });
        }
        const service = await Service.findById(serviceId).session(session);
        if (!service) {
          await session.abortTransaction();
          return res.status(404).json({ message: `Service ${serviceId} not found` });
        }
        const cost = parseFloat(srv.cost || service.actualCost || 0);
        servicesTotal += cost;
        processedServices.push({
          service: serviceId,
          description: srv.description || service.description,
          cost
        });
      }
    }

    // --- 4. Calculate total and apply reduction ---
    let totalCost = articlesTotal + servicesTotal;
    let reductionValue = 0;
    if (reduction && reductionType) {
      const reductionNum = Number(reduction);
      if (reductionType === 'amount') {
        reductionValue = Math.min(reductionNum, totalCost);
      } else if (reductionType === 'percent') {
        if (reductionNum > 0 && reductionNum < 100) {
          reductionValue = (totalCost * reductionNum) / 100;
        }
      }
      totalCost = Math.max(0, totalCost - reductionValue);
    }

    // --- 5. Validate paymentType and installments ---
    let processedInstallments = [];
    if (paymentType === 'facilite') {
      if (!Array.isArray(installments) || installments.length === 0) {
        await session.abortTransaction();
        return res.status(400).json({ message: 'Installments required for payment type facilite' });
      }
      let sumInstallments = 0;
      for (const inst of installments) {
        if (!inst.amount || !inst.dueDate) {
          await session.abortTransaction();
          return res.status(400).json({ message: 'Each installment must have amount and dueDate' });
        }
        const instAmount = parseFloat(inst.amount);
        sumInstallments += instAmount;
        processedInstallments.push({
          amount: inst.amount,
          dueDate: new Date(inst.dueDate)
        });
      }
      if (Math.abs(sumInstallments - totalCost) > 0.01) {
        await session.abortTransaction();
        return res.status(400).json({ message: 'Sum of installments does not match total cost' });
      }
    }

    // --- 6. Update vente and adjust stock in a transaction ---
    // 6a. Restore stock for old articles
    for (const oldArt of oldArticles) {
      await Product.findByIdAndUpdate(
        oldArt.product,
        { $inc: { stock: oldArt.quantity } },
        { session }
      );
    }
    // 6b. Reduce stock for new articles
    for (const newArt of processedArticles) {
      await Product.findByIdAndUpdate(
        newArt.product,
        { $inc: { stock: -newArt.quantity } },
        { session }
      );
    }
    // 6c. Update vente fields
    vente.articles = processedArticles;
    vente.services = processedServices;
    vente.reduction = reduction || 0;
    vente.paymentType = paymentType;
    vente.installments = processedInstallments;
    vente.notes = notes || '';
    vente.totalCost = totalCost;
    await vente.save({ session });

    await session.commitTransaction();
    session.endSession();
    res.json({ message: 'Vente updated', vente });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Soft delete a vente
exports.deleteVente = async (req, res) => {
  try {
    const vente = await Vente.findById(req.params.id);
    if (!vente || vente.isDeleted) {
      return res.status(404).json({ message: 'Vente not found' });
    }
    vente.isDeleted = true;
    await vente.save();
    res.json({ message: 'Vente deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Generate and download invoice PDF for a vente (Simple & Reliable)
exports.downloadInvoicePdf = async (req, res) => {
  try {
    console.log('Starting PDF generation for vente:', req.params.id);
    
    const vente = await Vente.findById(req.params.id)
      .populate('customer')
      .populate('articles.product')
      .populate('services.service')
      .populate('createdBy');
      
    if (!vente || vente.isDeleted) {
      return res.status(404).json({ message: 'Vente not found' });
    }

    console.log('Vente data retrieved successfully');

    // Create PDF using PDFKit (simple and reliable)
    const doc = new PDFDocument({ 
      margin: 50,
      size: 'A4',
      info: {
        Title: `Facture ${vente._id}`,
        Author: 'Serat Auto',
        Subject: 'Facture de vente'
      }
    });

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=invoice-${vente._id}.pdf`);
    res.setHeader('Cache-Control', 'no-cache');

    // Pipe PDF to response
    doc.pipe(res);

    // Header
    doc.fontSize(24).text('FACTURE DE VENTE', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`N° Facture: ${vente._id}`, { align: 'center' });
    doc.text(`Date: ${new Date(vente.createdAt).toLocaleDateString('fr-FR')}`, { align: 'center' });
    doc.moveDown();

    // Customer Info
    const customerName = vente.customer?.fname && vente.customer?.lname 
      ? `${vente.customer.fname} ${vente.customer.lname}`
      : vente.customer?.name || 'Client';
    
    doc.fontSize(14).text('INFORMATIONS CLIENT', { underline: true });
    doc.fontSize(12).text(`Nom: ${customerName}`);
    doc.text(`CIN: ${vente.customer?.cin || ''}`);
    doc.text(`Téléphone: ${vente.customer?.phoneNumber || ''}`);
    doc.moveDown();

    // Articles Section
    if (vente.articles && vente.articles.length > 0) {
      doc.fontSize(14).text('ARTICLES', { underline: true });
      doc.moveDown(0.5);
      
      vente.articles.forEach((art, idx) => {
        const productTitle = art.product?.title || art.product?.name || 'Produit';
        const unitPrice = parseFloat(art.unitPrice || 0).toFixed(2);
        const totalPrice = parseFloat(art.totalPrice || 0).toFixed(2);
        
        doc.text(`${idx + 1}. ${productTitle}`);
        doc.text(`   Quantité: ${art.quantity} | Prix unitaire: ${unitPrice} DA | Total: ${totalPrice} DA`);
        doc.moveDown(0.3);
      });
      doc.moveDown();
    }

    // Services Section
    if (vente.services && vente.services.length > 0) {
      doc.fontSize(14).text('SERVICES', { underline: true });
      doc.moveDown(0.5);
      
      vente.services.forEach((srv, idx) => {
        const serviceTitle = srv.service?.title || srv.service?.name || 'Service';
        const cost = parseFloat(srv.cost || 0).toFixed(2);
        
        doc.text(`${idx + 1}. ${serviceTitle}`);
        doc.text(`   Coût: ${cost} DA`);
        if (srv.description) {
          doc.text(`   Description: ${srv.description}`);
        }
        doc.moveDown(0.3);
      });
      doc.moveDown();
    }

    // Reduction
    if (vente.reduction && vente.reduction > 0) {
      doc.fontSize(12).text(`Réduction: ${parseFloat(vente.reduction).toFixed(2)} DA`, { align: 'right' });
      doc.moveDown(0.5);
    }

    // Total
    doc.fontSize(16).text(`TOTAL: ${parseFloat(vente.totalCost).toFixed(2)} DA`, { align: 'right' });
    doc.moveDown();

    // Payment Type
    doc.fontSize(12).text(`Type de paiement: ${vente.paymentType === 'comptant' ? 'Comptant' : 'Facilité'}`);
    doc.moveDown(0.5);
    
    // Installments (if facilite)
    if (vente.paymentType === 'facilite' && vente.installments && vente.installments.length > 0) {
      doc.text('Échéances:');
      vente.installments.forEach((inst, idx) => {
        const amount = parseFloat(inst.amount || 0).toFixed(2);
        const dueDate = new Date(inst.dueDate).toLocaleDateString('fr-FR');
        doc.text(`  ${idx + 1}. ${amount} DA - ${dueDate}`);
      });
      doc.moveDown();
    }

    // Notes
    if (vente.notes) {
      doc.fontSize(12).text('Notes:', { underline: true });
      doc.fontSize(10).text(vente.notes);
      doc.moveDown();
    }

    // Footer
    doc.moveDown(2);
    doc.fontSize(10).text('Merci pour votre achat!', { align: 'center' });
    doc.text('Serat Auto - Service de qualité', { align: 'center' });

    // End the PDF
    doc.end();

    console.log('PDF generated successfully');

  } catch (err) {
    console.error('Error generating invoice PDF:', err);
    
    if (!res.headersSent) {
      res.status(500).json({ 
        message: 'Error generating PDF', 
        error: err.message,
        details: 'PDF generation failed. Please try again.'
      });
    }
  }
};

// Get vente data for PDF generation (returns JSON data for frontend PDF generation)
exports.getVenteForPdf = async (req, res) => {
  try {
    const vente = await Vente.findById(req.params.id)
      .populate('customer')
      .populate('articles.product')
      .populate('services.service')
      .populate('createdBy');
      
    if (!vente || vente.isDeleted) {
      return res.status(404).json({ message: 'Vente not found' });
    }

    // Format the data for the frontend PDF generation
    const pdfData = {
      vente: {
        _id: vente._id,
        createdAt: vente.createdAt,
        paymentType: vente.paymentType,
        reduction: vente.reduction,
        totalCost: vente.totalCost,
        notes: vente.notes,
        installments: vente.installments || []
      },
      customer: {
        name: vente.customer?.fname && vente.customer?.lname 
          ? `${vente.customer.fname} ${vente.customer.lname}`
          : vente.customer?.name || 'Client',
        cin: vente.customer?.cin || '',
        phoneNumber: vente.customer?.phoneNumber || ''
      },
      articles: vente.articles?.map(art => ({
        product: {
          title: art.product?.title || art.product?.name || 'Produit',
          s_price: art.unitPrice
        },
        quantity: art.quantity,
        unitPrice: art.unitPrice,
        totalPrice: art.totalPrice
      })) || [],
      services: vente.services?.map(srv => ({
        service: {
          title: srv.service?.title || srv.service?.name || 'Service',
          description: srv.service?.description || ''
        },
        description: srv.description,
        cost: srv.cost
      })) || [],
      createdBy: {
        name: vente.createdBy?.fname && vente.createdBy?.lname
          ? `${vente.createdBy.fname} ${vente.createdBy.lname}`
          : vente.createdBy?.name || 'Utilisateur'
      }
    };

    res.json(pdfData);
  } catch (err) {
    console.error('Error getting vente for PDF:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
}; 