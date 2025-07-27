const express = require('express');
const router = express.Router();
const installmentController = require('../controllers/installmentController');
const auth = require('../middleware/auth');

// TEST ROUTE - No authentication required
router.get('/test-dashboard', installmentController.getDashboardUpcomingInstallments);

// Apply authentication to all routes
router.use(auth);

// Get all upcoming installments (for dashboard)
router.get('/all', installmentController.getAllUpcomingInstallments);

// NEW: Dashboard API - Get all clients with upcoming installments (for admin dashboard)
router.get('/dashboard/upcoming', installmentController.getDashboardUpcomingInstallments);

// Get installments for a specific customer
router.get('/customer/:customerId', installmentController.getCustomerInstallments);

// NEW: Client API - Get specific client's upcoming installments (for client view)
router.get('/client/:customerId/upcoming', installmentController.getClientUpcomingInstallments);

// Mark installment as paid
router.put('/:venteId/:installmentIndex/paid', installmentController.markInstallmentAsPaid);

// Mark installment as unpaid (for corrections)
router.put('/:venteId/:installmentIndex/unpaid', installmentController.markInstallmentAsUnpaid);

// Update overdue installments (cron job or manual trigger)
router.put('/update-overdue', installmentController.updateOverdueInstallments);

module.exports = router; 