const express = require('express');
const router = express.Router();
const invoiceController = require('../controllers/invoiceController');
const { validateBody } = require('../middleware/validate');
const { authenticateJWT, authorizeRoles } = require('../middleware/auth');
const { paymentSchemas } = require('../validators/schemas');

router.get('/invoices/:id', authenticateJWT, invoiceController.getInvoiceById);
router.get('/invoices/booking/:bookingId', authenticateJWT, invoiceController.getInvoiceByBooking);
router.post('/payments/process', authenticateJWT, authorizeRoles('customer', 'cooperative_admin'), validateBody(paymentSchemas.processPayment), invoiceController.processMockPayment);

module.exports = router;
