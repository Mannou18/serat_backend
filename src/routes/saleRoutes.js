const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { requireEmployee } = require('../middleware/roleAuth');
const {
  createSale,
  getAllSales,
  getSale,
  updateSale,
  deleteSale,
  getSalesByCustomer,
  getSalesReports
} = require('../controllers/saleController');

/**
 * @swagger
 * /sales:
 *   post:
 *     summary: Create a new sale
 *     tags:
 *       - Sales
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               customer:
 *                 type: string
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     product:
 *                       type: string
 *                     quantity:
 *                       type: number
 *               paymentMethod:
 *                 type: string
 *                 enum: [cash, card, check, transfer]
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Sale created successfully
 *       400:
 *         description: Validation error or insufficient stock
 *       404:
 *         description: Customer or product not found
 *
 *   get:
 *     summary: Get all sales with pagination and filters
 *     tags:
 *       - Sales
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: customer
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: paymentMethod
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of sales
 *       500:
 *         description: Server error
 *
 * /sales/{id}:
 *   get:
 *     summary: Get a specific sale by ID
 *     tags:
 *       - Sales
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Sale details
 *       404:
 *         description: Sale not found
 *
 *   put:
 *     summary: Update a sale
 *     tags:
 *       - Sales
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               paymentStatus:
 *                 type: string
 *                 enum: [pending, paid, partial, cancelled]
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Sale updated successfully
 *       404:
 *         description: Sale not found
 *
 *   delete:
 *     summary: Delete a sale (soft delete)
 *     tags:
 *       - Sales
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Sale deleted successfully
 *       404:
 *         description: Sale not found
 *
 * /sales/customer/{customerId}:
 *   get:
 *     summary: Get sales by customer
 *     tags:
 *       - Sales
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: customerId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Customer sales list
 *       500:
 *         description: Server error
 *
 * /sales/reports:
 *   get:
 *     summary: Get sales reports and statistics
 *     tags:
 *       - Sales
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: groupBy
 *         schema:
 *           type: string
 *           enum: [day, month, year]
 *     responses:
 *       200:
 *         description: Sales reports and statistics
 *       500:
 *         description: Server error
 */

// Apply authentication and role middleware to all routes
router.use(auth, requireEmployee);

// Sales CRUD routes
router.post('/', createSale);
router.get('/', getAllSales);
router.get('/:id', getSale);
router.put('/:id', updateSale);
router.delete('/:id', deleteSale);

// Customer-specific sales
router.get('/customer/:customerId', getSalesByCustomer);

// Reports
router.get('/reports', getSalesReports);

module.exports = router; 