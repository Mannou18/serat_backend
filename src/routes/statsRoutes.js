const express = require('express');
const router = express.Router();
const statsController = require('../controllers/statsController');
const auth = require('../middleware/auth');

/**
 * @swagger
 * /stats/client/{customerId}:
 *   get:
 *     summary: Get statistics for a specific client
 *     tags:
 *       - Stats
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: customerId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the customer
 *     responses:
 *       200:
 *         description: Client statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 voitures:
 *                   type: integer
 *                 neotracks:
 *                   type: integer
 *                 services:
 *                   type: integer
 *                 achatsComptants:
 *                   type: number
 *                 achatsFacilites:
 *                   type: number
 *                 dettes:
 *                   type: number
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 *
 * /stats/global:
 *   get:
 *     summary: Get global statistics for the app
 *     tags:
 *       - Stats
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Global statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalVoitures:
 *                   type: integer
 *                 totalNeotracks:
 *                   type: integer
 *                 totalServices:
 *                   type: integer
 *                 totalAchatsComptants:
 *                   type: number
 *                 totalAchatsFacilites:
 *                   type: number
 *                 totalDettes:
 *                   type: number
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */

// Client-specific stats
router.get('/client/:customerId', auth, statsController.getClientStats);
// Global stats
router.get('/global', auth, statsController.getGlobalStats);

module.exports = router; 