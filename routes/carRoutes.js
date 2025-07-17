const express = require('express');
const router = express.Router();
const carController = require('../controllers/carController');
const auth = require('../middleware/auth');

/**
 * @swagger
 * /cars:
 *   get:
 *     summary: Get all cars
 *     tags:
 *       - Cars
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
 *         description: List of cars with pagination
 *       500:
 *         description: Server error
 *
 *   post:
 *     summary: Create a new car
 *     tags:
 *       - Cars
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               brand:
 *                 type: string
 *               model_name:
 *                 type: string
 *               matricule:
 *                 type: string
 *               plate_number:
 *                 type: string
 *               customerId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Car created successfully
 *       400:
 *         description: Validation error
 *
 * /cars/{id}:
 *   get:
 *     summary: Get a single car by ID
 *     tags:
 *       - Cars
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
 *         description: Car details
 *       404:
 *         description: Car not found
 *
 *   put:
 *     summary: Update car details
 *     tags:
 *       - Cars
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
 *               brand:
 *                 type: string
 *               model_name:
 *                 type: string
 *               matricule:
 *                 type: string
 *               plate_number:
 *                 type: string
 *     responses:
 *       200:
 *         description: Car updated successfully
 *       400:
 *         description: Validation error
 *       404:
 *         description: Car not found
 *
 *   delete:
 *     summary: Soft delete a car
 *     tags:
 *       - Cars
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
 *         description: Car deleted successfully
 *       404:
 *         description: Car not found
 *
 * /cars/{id}/restore:
 *   patch:
 *     summary: Restore a deleted car
 *     tags:
 *       - Cars
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
 *         description: Car restored successfully
 *       404:
 *         description: Car not found or not deleted
 *
 * /cars/{id}/associate:
 *   patch:
 *     summary: Associate a car with a customer
 *     tags:
 *       - Cars
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
 *               customerId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Car associated successfully
 *       400:
 *         description: Validation error or already associated
 *
 * /cars/{id}/disassociate:
 *   patch:
 *     summary: Disassociate car from customer
 *     tags:
 *       - Cars
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
 *         description: Car disassociated successfully
 *       400:
 *         description: Car not associated
 */
router.get('/', auth, carController.getAllCars);
router.get('/:id', auth, carController.getCar);
router.post('/', auth, carController.createCar);
router.put('/:id', auth, carController.updateCar);
router.delete('/:id', auth, carController.deleteCar);
router.patch('/:id/restore', auth, carController.restoreCar);
router.patch('/:id/disassociate', auth, carController.disassociateCar);
router.patch('/:id/associate', auth, carController.associateCar);

module.exports = router;
