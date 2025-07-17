const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
    createCarBrand,
    getAllCarBrands,
    getCarBrand,
    updateCarBrand,
    deleteCarBrand
} = require('../controllers/carBrandController');

/**
 * @swagger
 * /car-brands:
 *   post:
 *     summary: Create a new car brand
 *     tags:
 *       - CarBrands
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               brand_name:
 *                 type: string
 *               model_names:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Car brand created
 *       400:
 *         description: Brand already exists or validation error
 *
 *   get:
 *     summary: Get all car brands
 *     tags:
 *       - CarBrands
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of car brands
 *       500:
 *         description: Server error
 */
router.post('/', auth, createCarBrand);
router.get('/', auth, getAllCarBrands);

/**
 * @swagger
 * /car-brands/{id}:
 *   get:
 *     summary: Get a car brand by ID
 *     tags:
 *       - CarBrands
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
 *         description: Car brand details
 *       404:
 *         description: Car brand not found
 *       500:
 *         description: Server error
 *
 *   put:
 *     summary: Update a car brand
 *     tags:
 *       - CarBrands
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
 *               brand_name:
 *                 type: string
 *               model_names:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Car brand updated
 *       400:
 *         description: Validation error or duplicate brand
 *       404:
 *         description: Car brand not found
 *
 *   delete:
 *     summary: Delete a car brand
 *     tags:
 *       - CarBrands
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
 *         description: Car brand deleted successfully
 *       400:
 *         description: Cannot delete brand, associated cars exist
 *       404:
 *         description: Car brand not found
 */
router.get('/:id', auth, getCarBrand);
router.put('/:id', auth, updateCarBrand);
router.delete('/:id', auth, deleteCarBrand);

module.exports = router;
