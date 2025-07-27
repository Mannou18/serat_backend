const Vente = require('../models/Vente');
const Customer = require('../models/Customer');

// Get all upcoming installments (for dashboard)
exports.getAllUpcomingInstallments = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, sortBy = 'dueDate', sortOrder = 'asc' } = req.query;
    
    // Build query for installments
    const query = {
      'installments.0': { $exists: true }, // Has installments
      isDeleted: false
    };

    // Add status filter if provided
    if (status && status !== 'all') {
      query['installments.status'] = status;
    }

    // Get ventes with installments
    const ventes = await Vente.find(query)
      .populate('customer', 'fname lname name phoneNumber cin')
      .populate('articles.product', 'title name')
      .populate('services.service', 'title name')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    // Flatten installments with vente info
    const installments = [];
    ventes.forEach(vente => {
      if (vente.installments && vente.installments.length > 0) {
        vente.installments.forEach((installment, index) => {
          // Calculate total amount for this vente
          const articlesTotal = vente.articles.reduce((sum, art) => {
            return sum + parseFloat(art.totalPrice || 0);
          }, 0);
          
          const servicesTotal = vente.services.reduce((sum, srv) => {
            return sum + parseFloat(srv.cost || 0);
          }, 0);
          
          const totalAmount = articlesTotal + servicesTotal;

          installments.push({
            _id: `${vente._id}_${index}`, // Unique ID for frontend
            venteId: vente._id,
            installmentIndex: index,
            customer: {
              _id: vente.customer._id,
              name: vente.customer.fname && vente.customer.lname 
                ? `${vente.customer.fname} ${vente.customer.lname}`
                : vente.customer.name || 'Client',
              phoneNumber: vente.customer.phoneNumber,
              cin: vente.customer.cin
            },
            venteInfo: {
              totalAmount: totalAmount,
              paymentType: vente.paymentType,
              createdAt: vente.createdAt,
              articles: vente.articles.map(art => ({
                product: art.product?.title || art.product?.name || 'Produit',
                quantity: art.quantity,
                totalPrice: art.totalPrice
              })),
              services: vente.services.map(srv => ({
                service: srv.service?.title || srv.service?.name || 'Service',
                cost: srv.cost
              }))
            },
            installment: {
              amount: installment.amount,
              dueDate: installment.dueDate,
              status: installment.status,
              paymentDate: installment.paymentDate,
              paymentMethod: installment.paymentMethod,
              notes: installment.notes
            }
          });
        });
      }
    });

    // Sort installments
    installments.sort((a, b) => {
      if (sortBy === 'dueDate') {
        return sortOrder === 'asc' 
          ? new Date(a.installment.dueDate) - new Date(b.installment.dueDate)
          : new Date(b.installment.dueDate) - new Date(a.installment.dueDate);
      }
      if (sortBy === 'amount') {
        return sortOrder === 'asc' 
          ? parseFloat(a.installment.amount) - parseFloat(b.installment.amount)
          : parseFloat(b.installment.amount) - parseFloat(a.installment.amount);
      }
      return 0;
    });

    // Calculate totals
    const totalPending = installments.filter(i => i.installment.status === 'pending').length;
    const totalPaid = installments.filter(i => i.installment.status === 'paid').length;
    const totalOverdue = installments.filter(i => i.installment.status === 'overdue').length;
    const totalAmount = installments.reduce((sum, i) => sum + parseFloat(i.installment.amount), 0);
    const paidAmount = installments
      .filter(i => i.installment.status === 'paid')
      .reduce((sum, i) => sum + parseFloat(i.installment.amount), 0);

    res.json({
      installments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: installments.length
      },
      stats: {
        totalPending,
        totalPaid,
        totalOverdue,
        totalAmount: totalAmount.toFixed(2),
        paidAmount: paidAmount.toFixed(2),
        remainingAmount: (totalAmount - paidAmount).toFixed(2)
      }
    });

  } catch (err) {
    console.error('Error fetching installments:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Get installments for a specific customer
exports.getCustomerInstallments = async (req, res) => {
  try {
    const { customerId } = req.params;
    const { status, sortBy = 'dueDate', sortOrder = 'asc' } = req.query;

    // Verify customer exists
    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    // Build query
    const query = {
      customer: customerId,
      'installments.0': { $exists: true },
      isDeleted: false
    };

    if (status && status !== 'all') {
      query['installments.status'] = status;
    }

    // Get ventes for this customer
    const ventes = await Vente.find(query)
      .populate('articles.product', 'title name')
      .populate('services.service', 'title name')
      .sort({ createdAt: -1 });

    // Flatten installments
    const installments = [];
    ventes.forEach(vente => {
      if (vente.installments && vente.installments.length > 0) {
        vente.installments.forEach((installment, index) => {
          // Calculate total amount
          const articlesTotal = vente.articles.reduce((sum, art) => {
            return sum + parseFloat(art.totalPrice || 0);
          }, 0);
          
          const servicesTotal = vente.services.reduce((sum, srv) => {
            return sum + parseFloat(srv.cost || 0);
          }, 0);
          
          const totalAmount = articlesTotal + servicesTotal;

          installments.push({
            _id: `${vente._id}_${index}`,
            venteId: vente._id,
            installmentIndex: index,
            venteInfo: {
              totalAmount: totalAmount,
              paymentType: vente.paymentType,
              createdAt: vente.createdAt,
              articles: vente.articles.map(art => ({
                product: art.product?.title || art.product?.name || 'Produit',
                quantity: art.quantity,
                totalPrice: art.totalPrice
              })),
              services: vente.services.map(srv => ({
                service: srv.service?.title || srv.service?.name || 'Service',
                cost: srv.cost
              }))
            },
            installment: {
              amount: installment.amount,
              dueDate: installment.dueDate,
              status: installment.status,
              paymentDate: installment.paymentDate,
              paymentMethod: installment.paymentMethod,
              notes: installment.notes
            }
          });
        });
      }
    });

    // Sort installments
    installments.sort((a, b) => {
      if (sortBy === 'dueDate') {
        return sortOrder === 'asc' 
          ? new Date(a.installment.dueDate) - new Date(b.installment.dueDate)
          : new Date(b.installment.dueDate) - new Date(a.installment.dueDate);
      }
      if (sortBy === 'amount') {
        return sortOrder === 'asc' 
          ? parseFloat(a.installment.amount) - parseFloat(b.installment.amount)
          : parseFloat(b.installment.amount) - parseFloat(a.installment.amount);
      }
      return 0;
    });

    // Calculate customer stats
    const totalPending = installments.filter(i => i.installment.status === 'pending').length;
    const totalPaid = installments.filter(i => i.installment.status === 'paid').length;
    const totalOverdue = installments.filter(i => i.installment.status === 'overdue').length;
    const totalAmount = installments.reduce((sum, i) => sum + parseFloat(i.installment.amount), 0);
    const paidAmount = installments
      .filter(i => i.installment.status === 'paid')
      .reduce((sum, i) => sum + parseFloat(i.installment.amount), 0);

    res.json({
      customer: {
        _id: customer._id,
        name: customer.fname && customer.lname 
          ? `${customer.fname} ${customer.lname}`
          : customer.name || 'Client',
        phoneNumber: customer.phoneNumber,
        cin: customer.cin
      },
      installments,
      stats: {
        totalPending,
        totalPaid,
        totalOverdue,
        totalAmount: totalAmount.toFixed(2),
        paidAmount: paidAmount.toFixed(2),
        remainingAmount: (totalAmount - paidAmount).toFixed(2)
      }
    });

  } catch (err) {
    console.error('Error fetching customer installments:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Mark installment as paid
exports.markInstallmentAsPaid = async (req, res) => {
  try {
    const { venteId, installmentIndex } = req.params;
    const { paymentMethod, notes } = req.body;

    // Validate payment method
    const validPaymentMethods = ['cash', 'card', 'transfer', 'check'];
    if (paymentMethod && !validPaymentMethods.includes(paymentMethod)) {
      return res.status(400).json({ 
        message: 'Invalid payment method. Must be one of: cash, card, transfer, check' 
      });
    }

    // Find vente
    const vente = await Vente.findById(venteId);
    if (!vente) {
      return res.status(404).json({ message: 'Vente not found' });
    }

    // Check if installment exists
    if (!vente.installments || !vente.installments[installmentIndex]) {
      return res.status(404).json({ message: 'Installment not found' });
    }

    // Update installment
    vente.installments[installmentIndex].status = 'paid';
    vente.installments[installmentIndex].paymentDate = new Date();
    vente.installments[installmentIndex].paymentMethod = paymentMethod || null;
    vente.installments[installmentIndex].notes = notes || null;

    await vente.save();

    res.json({ 
      message: 'Installment marked as paid successfully',
      installment: vente.installments[installmentIndex]
    });

  } catch (err) {
    console.error('Error marking installment as paid:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Mark installment as unpaid (for corrections)
exports.markInstallmentAsUnpaid = async (req, res) => {
  try {
    const { venteId, installmentIndex } = req.params;

    // Find vente
    const vente = await Vente.findById(venteId);
    if (!vente) {
      return res.status(404).json({ message: 'Vente not found' });
    }

    // Check if installment exists
    if (!vente.installments || !vente.installments[installmentIndex]) {
      return res.status(404).json({ message: 'Installment not found' });
    }

    // Update installment
    vente.installments[installmentIndex].status = 'pending';
    vente.installments[installmentIndex].paymentDate = null;
    vente.installments[installmentIndex].paymentMethod = null;
    vente.installments[installmentIndex].notes = null;

    await vente.save();

    res.json({ 
      message: 'Installment marked as unpaid successfully',
      installment: vente.installments[installmentIndex]
    });

  } catch (err) {
    console.error('Error marking installment as unpaid:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Update overdue installments (cron job or manual trigger)
exports.updateOverdueInstallments = async (req, res) => {
  try {
    const today = new Date();
    
    // Find all pending installments with due dates in the past
    const ventes = await Vente.find({
      'installments.status': 'pending',
      'installments.dueDate': { $lt: today },
      isDeleted: false
    });

    let updatedCount = 0;

    for (const vente of ventes) {
      for (let i = 0; i < vente.installments.length; i++) {
        const installment = vente.installments[i];
        if (installment.status === 'pending' && installment.dueDate < today) {
          installment.status = 'overdue';
          updatedCount++;
        }
      }
      await vente.save();
    }

    res.json({ 
      message: `Updated ${updatedCount} overdue installments`,
      updatedCount
    });

  } catch (err) {
    console.error('Error updating overdue installments:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
}; 

// Dashboard API - Get all clients with upcoming installments (for admin dashboard)
exports.getDashboardUpcomingInstallments = async (req, res) => {
  console.log('=== FUNCTION CALLED ===');
  console.log('Request received at:', new Date().toISOString());
  console.log('Request URL:', req.url);
  console.log('Request method:', req.method);
  console.log('Request headers:', req.headers);
  
  try {
    const { page = 1, limit = 20, daysAhead = 30, includeAll = false } = req.query;
    
    console.log('=== DASHBOARD API DEBUG ===');
    console.log('Query params:', { page, limit, daysAhead, includeAll });
    
    // Calculate date range for upcoming installments
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + parseInt(daysAhead));
    
    console.log('Date range:', {
      today: today.toISOString(),
      futureDate: futureDate.toISOString(),
      daysAhead: parseInt(daysAhead)
    });
    
    // Get all ventes with installments and filter in JavaScript
    const allVentes = await Vente.find({
      'installments.0': { $exists: true },
      isDeleted: false
    })
      .populate('customer', 'fname lname name phoneNumber cin')
      .populate('articles.product', 'title name')
      .populate('services.service', 'title name');

    console.log('Total ventes with installments:', allVentes.length);

    // Filter ventes that have pending/overdue installments
    const ventesWithPendingInstallments = allVentes.filter(vente => {
      if (includeAll === 'true') {
        // Include all pending/overdue installments regardless of date
        return vente.installments.some(inst => ['pending', 'overdue'].includes(inst.status));
      } else {
        // Filter by date range AND status
        return vente.installments.some(inst => {
          const isUpcoming = inst.dueDate >= today && inst.dueDate <= futureDate;
          const isPendingOrOverdue = ['pending', 'overdue'].includes(inst.status);
          return isUpcoming && isPendingOrOverdue;
        });
      }
    });

    console.log('Ventes with pending/overdue installments:', ventesWithPendingInstallments.length);

    // Group by customer and their upcoming installments
    const customerInstallments = {};
    
    ventesWithPendingInstallments.forEach(vente => {
      const customerId = vente.customer._id.toString();
      const customerName = vente.customer.fname && vente.customer.lname 
        ? `${vente.customer.fname} ${vente.customer.lname}`
        : vente.customer.name || 'Client';

      if (!customerInstallments[customerId]) {
        customerInstallments[customerId] = {
          customer: {
            _id: vente.customer._id,
            name: customerName,
            phoneNumber: vente.customer.phoneNumber,
            cin: vente.customer.cin
          },
          upcomingInstallments: [],
          totalUpcomingAmount: 0,
          overdueCount: 0,
          pendingCount: 0
        };
      }

      // Filter upcoming installments for this vente
      const upcomingInstallments = vente.installments.filter(inst => {
        if (includeAll === 'true') {
          // Include all pending/overdue installments regardless of date
          return ['pending', 'overdue'].includes(inst.status);
        } else {
          // Filter by date range AND status
          const isUpcoming = inst.dueDate >= today && inst.dueDate <= futureDate;
          const isPendingOrOverdue = ['pending', 'overdue'].includes(inst.status);
          return isUpcoming && isPendingOrOverdue;
        }
      });

      console.log(`Vente ${vente._id} upcoming installments:`, upcomingInstallments.length);

      upcomingInstallments.forEach((installment, index) => {
        // Calculate total amount for this vente
        const articlesTotal = vente.articles.reduce((sum, art) => {
          return sum + parseFloat(art.totalPrice || 0);
        }, 0);
        
        const servicesTotal = vente.services.reduce((sum, srv) => {
          return sum + parseFloat(srv.cost || 0);
        }, 0);
        
        const totalAmount = articlesTotal + servicesTotal;

        const installmentData = {
          _id: `${vente._id}_${index}`,
          venteId: vente._id,
          installmentIndex: index,
          venteInfo: {
            totalAmount: totalAmount,
            paymentType: vente.paymentType,
            createdAt: vente.createdAt,
            articles: vente.articles.map(art => ({
              product: art.product?.title || art.product?.name || 'Produit',
              quantity: art.quantity,
              totalPrice: art.totalPrice
            })),
            services: vente.services.map(srv => ({
              service: srv.service?.title || srv.service?.name || 'Service',
              cost: srv.cost
            }))
          },
          installment: {
            amount: installment.amount,
            dueDate: installment.dueDate,
            status: installment.status,
            daysUntilDue: Math.ceil((new Date(installment.dueDate) - today) / (1000 * 60 * 60 * 24))
          }
        };

        customerInstallments[customerId].upcomingInstallments.push(installmentData);
        customerInstallments[customerId].totalUpcomingAmount += parseFloat(installment.amount);
        
        if (installment.status === 'overdue') {
          customerInstallments[customerId].overdueCount++;
        } else {
          customerInstallments[customerId].pendingCount++;
        }
      });
    });

    // Convert to array and sort by urgency
    const dashboardData = Object.values(customerInstallments)
      .filter(customer => customer.upcomingInstallments.length > 0)
      .sort((a, b) => {
        // Sort by overdue first, then by earliest due date
        const aHasOverdue = a.overdueCount > 0;
        const bHasOverdue = b.overdueCount > 0;
        
        if (aHasOverdue && !bHasOverdue) return -1;
        if (!aHasOverdue && bHasOverdue) return 1;
        
        // If both have same overdue status, sort by earliest due date
        const aEarliestDue = Math.min(...a.upcomingInstallments.map(i => i.installment.daysUntilDue));
        const bEarliestDue = Math.min(...b.upcomingInstallments.map(i => i.installment.daysUntilDue));
        
        return aEarliestDue - bEarliestDue;
      });

    // Calculate dashboard statistics
    const totalCustomers = dashboardData.length;
    const totalUpcomingAmount = dashboardData.reduce((sum, customer) => sum + customer.totalUpcomingAmount, 0);
    const totalOverdueCount = dashboardData.reduce((sum, customer) => sum + customer.overdueCount, 0);
    const totalPendingCount = dashboardData.reduce((sum, customer) => sum + customer.pendingCount, 0);

    console.log('Final results:', {
      totalCustomers,
      totalUpcomingAmount,
      totalOverdueCount,
      totalPendingCount
    });
    console.log('=== END DASHBOARD API DEBUG ===');

    res.json({
      customers: dashboardData,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalCustomers
      },
      stats: {
        totalCustomers,
        totalUpcomingAmount: totalUpcomingAmount.toFixed(2),
        totalOverdueCount,
        totalPendingCount,
        daysAhead: parseInt(daysAhead)
      }
    });

  } catch (err) {
    console.error('Error fetching dashboard upcoming installments:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Client API - Get specific client's upcoming installments (for client view)
exports.getClientUpcomingInstallments = async (req, res) => {
  try {
    const { customerId } = req.params;
    const { daysAhead = 30 } = req.query;
    
    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + parseInt(daysAhead));

    // Get all ventes for this customer and filter in JavaScript
    const allVentes = await Vente.find({
      customer: customerId,
      'installments.0': { $exists: true },
      isDeleted: false
    })
      .populate('articles.product', 'title name')
      .populate('services.service', 'title name');

    // Filter ventes that have pending/overdue installments within date range
    const ventesWithPendingInstallments = allVentes.filter(vente => 
      vente.installments.some(inst => {
        const isUpcoming = inst.dueDate >= today && inst.dueDate <= futureDate;
        const isPendingOrOverdue = ['pending', 'overdue'].includes(inst.status);
        return isUpcoming && isPendingOrOverdue;
      })
    );

    const upcomingInstallments = [];
    
    ventesWithPendingInstallments.forEach(vente => {
      // Filter installments for this specific customer within date range
      const customerInstallments = vente.installments.filter(inst => {
        const isUpcoming = inst.dueDate >= today && inst.dueDate <= futureDate;
        const isPendingOrOverdue = ['pending', 'overdue'].includes(inst.status);
        return isUpcoming && isPendingOrOverdue;
      });

      customerInstallments.forEach((installment, index) => {
        // Calculate total amount for this vente
        const articlesTotal = vente.articles.reduce((sum, art) => {
          return sum + parseFloat(art.totalPrice || 0);
        }, 0);
        
        const servicesTotal = vente.services.reduce((sum, srv) => {
          return sum + parseFloat(srv.cost || 0);
        }, 0);
        
        const totalAmount = articlesTotal + servicesTotal;

        const installmentData = {
          _id: `${vente._id}_${index}`,
          venteId: vente._id,
          installmentIndex: index,
          venteInfo: {
            totalAmount: totalAmount,
            paymentType: vente.paymentType,
            createdAt: vente.createdAt,
            articles: vente.articles.map(art => ({
              product: art.product?.title || art.product?.name || 'Produit',
              quantity: art.quantity,
              totalPrice: art.totalPrice
            })),
            services: vente.services.map(srv => ({
              service: srv.service?.title || srv.service?.name || 'Service',
              cost: srv.cost
            }))
          },
          installment: {
            amount: installment.amount,
            dueDate: installment.dueDate,
            status: installment.status,
            daysUntilDue: Math.ceil((new Date(installment.dueDate) - today) / (1000 * 60 * 60 * 24))
          }
        };

        upcomingInstallments.push(installmentData);
      });
    });

    // Sort by urgency (overdue first, then by due date)
    upcomingInstallments.sort((a, b) => {
      if (a.installment.status === 'overdue' && b.installment.status !== 'overdue') return -1;
      if (a.installment.status !== 'overdue' && b.installment.status === 'overdue') return 1;
      return a.installment.daysUntilDue - b.installment.daysUntilDue;
    });

    // Calculate statistics
    const totalUpcomingAmount = upcomingInstallments.reduce((sum, inst) => sum + parseFloat(inst.installment.amount), 0);
    const overdueCount = upcomingInstallments.filter(inst => inst.installment.status === 'overdue').length;
    const pendingCount = upcomingInstallments.filter(inst => inst.installment.status === 'pending').length;

    res.json({
      customer: {
        _id: customer._id,
        name: customer.fname && customer.lname ? `${customer.fname} ${customer.lname}` : customer.name,
        phoneNumber: customer.phoneNumber,
        cin: customer.cin
      },
      upcomingInstallments,
      stats: {
        totalInstallments: upcomingInstallments.length,
        totalUpcomingAmount: totalUpcomingAmount.toFixed(2),
        overdueCount,
        pendingCount,
        daysAhead: parseInt(daysAhead)
      }
    });

  } catch (err) {
    console.error('Error fetching client upcoming installments:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
}; 