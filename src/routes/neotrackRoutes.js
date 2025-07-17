const express = require('express');
const router = express.Router();
const neotrackController = require('../controllers/neotrackController');
const axios = require('axios');
const Neotrack = require('../models/Neotrack');

/**
 * @swagger
 * tags:
 *   name: Neotracks
 *   description: CRUD operations for Neotrack GPS devices
 *
 * components:
 *   schemas:
 *     Neotrack:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         serialNumber:
 *           type: string
 *         customer:
 *           $ref: '#/components/schemas/Customer'
 *         car:
 *           $ref: '#/components/schemas/Car'
 *         carCategory:
 *           $ref: '#/components/schemas/Category'
 *         isActive:
 *           type: boolean
 *         price:
 *           type: number
 *         purchaseDate:
 *           type: string
 *           format: date
 *         activatedBy:
 *           $ref: '#/components/schemas/User'
 *         activatedAt:
 *           type: string
 *           format: date-time
 *         notes:
 *           type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *
 * /neotracks:
 *   post:
 *     summary: Create a new Neotrack (calls external API and saves response)
 *     tags: [Neotracks]
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
 *                 type: integer
 *               dob:
 *                 type: string
 *                 format: date
 *               phone:
 *                 type: string
 *               profile_photo:
 *                 type: string
 *               plate_number:
 *                 type: string
 *               brand:
 *                 type: string
 *               model:
 *                 type: string
 *               year:
 *                 type: integer
 *               imei:
 *                 type: string
 *               sim_device:
 *                 type: string
 *             required:
 *               - fname
 *               - lname
 *               - cin
 *               - dob
 *               - phone
 *               - plate_number
 *               - brand
 *               - model
 *               - year
 *               - imei
 *               - sim_device
 *     responses:
 *       201:
 *         description: Neotrack created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Neotrack'
 *   get:
 *     summary: Get all Neotracks
 *     tags: [Neotracks]
 *     responses:
 *       200:
 *         description: List of Neotracks
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 neotracks:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Neotrack'
 *
 * /neotracks/{id}:
 *   get:
 *     summary: Get a Neotrack by ID
 *     tags: [Neotracks]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Neotrack details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Neotrack'
 *       404:
 *         description: Neotrack not found
 *   put:
 *     summary: Update a Neotrack
 *     tags: [Neotracks]
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
 *             $ref: '#/components/schemas/Neotrack'
 *     responses:
 *       200:
 *         description: Neotrack updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Neotrack'
 *       404:
 *         description: Neotrack not found
 *   delete:
 *     summary: Delete a Neotrack
 *     tags: [Neotracks]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Neotrack deleted successfully
 *       404:
 *         description: Neotrack not found
 */

// Create
router.post('/', neotrackController.createNeotrack);
// List all
router.get('/', neotrackController.getAllNeotracks);
// Get one
router.get('/:id', neotrackController.getNeotrack);
// Update
router.put('/:id', neotrackController.updateNeotrack);
// Delete
router.delete('/:id', neotrackController.deleteNeotrack);

module.exports = router; 