const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');
const auth = require('../middleware/auth');

/**
 * @swagger
 * /customers:
 *   get:
 *     summary: Get all customers with pagination
 *     tags:
 *       - Customers
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
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: isDeleted
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: List of customers
 *       500:
 *         description: Server error
 *
 *   post:
 *     summary: Create a new customer
 *     tags:
 *       - Customers
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fname:
 *                 type: string
 *               lname:
 *                 type: string
 *               cin:
 *                 type: string
 *               phoneNumber:
 *                 type: string
 *               cars:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Customer created successfully
 *       400:
 *         description: Validation error
 *
 * /customers/{id}:
 *   get:
 *     summary: Get a single customer by ID
 *     tags:
 *       - Customers
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
 *         description: Customer details
 *       404:
 *         description: Customer not found
 *
 *   put:
 *     summary: Update customer details
 *     tags:
 *       - Customers
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
 *     responses:
 *       200:
 *         description: Customer updated successfully
 *       400:
 *         description: Validation error
 *       404:
 *         description: Customer not found
 *
 *   delete:
 *     summary: Soft delete a customer
 *     tags:
 *       - Customers
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
 *         description: Customer deleted successfully
 *       404:
 *         description: Customer not found
 *
 * /customers/{id}/restore:
 *   patch:
 *     summary: Restore a deleted customer
 *     tags:
 *       - Customers
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
 *         description: Customer restored successfully
 *       404:
 *         description: Customer not found or not deleted
 *
 * /customers/{customerId}/cars/{carId}:
 *   post:
 *     summary: Associate a car with a customer
 *     tags:
 *       - Customers
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: customerId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: carId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Car associated with customer
 *       400:
 *         description: Validation error
 *       404:
 *         description: Customer or car not found
 *
 *   delete:
 *     summary: Disassociate a car from a customer
 *     tags:
 *       - Customers
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: customerId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: carId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Car disassociated from customer
 *       400:
 *         description: Validation error
 *       404:
 *         description: Customer or car not found
 */

router.get('/', auth, customerController.getAllCustomers);
router.get('/:id', auth, customerController.getCustomer);
router.post('/', auth, customerController.createCustomer);
router.put('/:id', auth, customerController.updateCustomer);
router.delete('/:id', auth, customerController.deleteCustomer);
router.patch('/:id/restore', auth, customerController.restoreCustomer);
router.post('/:customerId/cars/:carId', auth, customerController.addCarToCustomer);
router.delete('/:customerId/cars/:carId', auth, customerController.removeCarFromCustomer);

module.exports = router;
