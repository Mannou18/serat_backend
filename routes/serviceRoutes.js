const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { requireEmployee } = require('../middleware/roleAuth');
const {
  createService,
  getAllServices,
  getService,
  updateService,
  deleteService,
  getServicesByCustomer,
  getServicesByCar,
  getServiceStats
} = require('../controllers/serviceController');

/**
 * @swagger
 * /services:
 *   post:
 *     summary: Create a new service
 *     tags:
 *       - Services
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
 *               car:
 *                 type: string
 *               serviceType:
 *                 type: string
 *                 enum: [repair, maintenance, inspection, installation, other]
 *               description:
 *                 type: string
 *               estimatedCost:
 *                 type: number
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high, urgent]
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Service created successfully
 *       400:
 *         description: Validation error
 *       404:
 *         description: Customer or car not found
 *
 *   get:
 *     summary: Get all services with pagination and filters
 *     tags:
 *       - Services
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
 *         name: car
 *         schema:
 *           type: string
 *       - in: query
 *         name: serviceType
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *       - in: query
 *         name: assignedTo
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of services
 *       500:
 *         description: Server error
 *
 * /services/{id}:
 *   get:
 *     summary: Get a specific service by ID
 *     tags:
 *       - Services
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
 *         description: Service details
 *       404:
 *         description: Service not found
 *
 *   put:
 *     summary: Update a service
 *     tags:
 *       - Services
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
 *               serviceType:
 *                 type: string
 *               description:
 *                 type: string
 *               status:
 *                 type: string
 *               estimatedCost:
 *                 type: number
 *               actualCost:
 *                 type: number
 *               completionDate:
 *                 type: string
 *                 format: date
 *               assignedTo:
 *                 type: string
 *               priority:
 *                 type: string
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Service updated successfully
 *       404:
 *         description: Service not found
 *
 *   delete:
 *     summary: Delete a service (soft delete)
 *     tags:
 *       - Services
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
 *         description: Service deleted successfully
 *       404:
 *         description: Service not found
 *
 * /services/customer/{customerId}:
 *   get:
 *     summary: Get services by customer
 *     tags:
 *       - Services
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
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Customer services list
 *       500:
 *         description: Server error
 *
 * /services/car/{carId}:
 *   get:
 *     summary: Get services by car
 *     tags:
 *       - Services
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: carId
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
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Car services list
 *       500:
 *         description: Server error
 *
 * /services/stats:
 *   get:
 *     summary: Get service statistics
 *     tags:
 *       - Services
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
 *     responses:
 *       200:
 *         description: Service statistics
 *       500:
 *         description: Server error
 */

// Apply authentication and role middleware to all routes
router.use(auth, requireEmployee);

// Services CRUD routes
router.post('/', createService);
router.get('/', getAllServices);
router.get('/:id', getService);
router.put('/:id', updateService);
router.delete('/:id', deleteService);

// Customer-specific services
router.get('/customer/:customerId', getServicesByCustomer);

// Car-specific services
router.get('/car/:carId', getServicesByCar);

// Statistics
router.get('/stats', getServiceStats);

module.exports = router; 