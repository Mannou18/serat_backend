const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { createVente, getAllVentes, getVenteById, updateVente, deleteVente, downloadInvoicePdf, getVenteForPdf } = require('../controllers/venteController');

// POST /ventes - Add a new vente
router.post('/', auth, createVente);
// GET /ventes - Get all ventes
router.get('/', auth, getAllVentes);
// GET /ventes/:id - Get a vente by ID
router.get('/:id', auth, getVenteById);
// PUT /ventes/:id - Update a vente
router.put('/:id', auth, updateVente);
// DELETE /ventes/:id - Soft delete a vente
router.delete('/:id', auth, deleteVente);
// GET /ventes/:id/invoice-pdf - Download invoice as PDF
router.get('/:id/invoice-pdf', auth, downloadInvoicePdf);
// GET /ventes/:id/pdf-data - Get vente data for frontend PDF generation
router.get('/:id/pdf-data', auth, getVenteForPdf);

module.exports = router; 