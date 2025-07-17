const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  createProduct,
  updateProduct,
  deleteProduct,
  getAllProducts,
  getProduct,
  restoreProduct,
  getLowStockProducts,
  updateStock,
  getStockAlerts
} = require('../controllers/productController');

/**
 * @swagger
 * /products:
 *   post:
 *     summary: Create a new product
 *     tags:
 *       - Products
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: Product created successfully
 *       400:
 *         description: Validation error
 *
 *   get:
 *     summary: Get all products with pagination
 *     tags:
 *       - Products
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
 *         name: category
 *         schema:
 *           type: string
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
 *         description: List of products
 *       500:
 *         description: Server error
 *
 * /products/{id}:
 *   get:
 *     summary: Get a specific product
 *     tags:
 *       - Products
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
 *         description: Product details
 *       404:
 *         description: Product not found
 *
 *   put:
 *     summary: Update a product
 *     tags:
 *       - Products
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
 *         description: Product updated
 *       400:
 *         description: Validation error
 *       404:
 *         description: Product not found
 *
 *   delete:
 *     summary: Soft delete a product
 *     tags:
 *       - Products
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
 *         description: Product deleted successfully
 *       404:
 *         description: Product not found
 *
 * /products/{id}/restore:
 *   patch:
 *     summary: Restore a deleted product
 *     tags:
 *       - Products
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
 *         description: Product restored successfully
 *       404:
 *         description: Product not found or not deleted
 *
 * /products/low-stock:
 *   get:
 *     summary: Get products with low stock
 *     tags:
 *       - Products
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: threshold
 *         schema:
 *           type: integer
 *           default: 10
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
 *         description: List of products with low stock
 *       500:
 *         description: Server error
 *
 * /products/{id}/stock:
 *   patch:
 *     summary: Update product stock
 *     tags:
 *       - Products
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
 *               stock:
 *                 type: number
 *                 minimum: 0
 *               operation:
 *                 type: string
 *                 enum: [set, add, subtract]
 *                 default: set
 *     responses:
 *       200:
 *         description: Stock updated successfully
 *       400:
 *         description: Invalid stock value or operation
 *       404:
 *         description: Product not found
 *       500:
 *         description: Server error
 *
 * /products/stock-alerts:
 *   get:
 *     summary: Get stock alerts (critical and warning levels)
 *     tags:
 *       - Products
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: criticalThreshold
 *         schema:
 *           type: integer
 *           default: 5
 *       - in: query
 *         name: warningThreshold
 *         schema:
 *           type: integer
 *           default: 15
 *     responses:
 *       200:
 *         description: Stock alerts for critical and warning levels
 *       500:
 *         description: Server error
 */

router.post('/', auth, createProduct);
router.put('/:id', auth, updateProduct);
router.delete('/:id', auth, deleteProduct);
router.patch('/:id/restore', auth, restoreProduct);
router.get('/', auth, getAllProducts);
router.get('/:id', auth, getProduct);

// Stock management routes
router.get('/low-stock', auth, getLowStockProducts);
router.patch('/:id/stock', auth, updateStock);
router.get('/stock-alerts', auth, getStockAlerts);

module.exports = router;
