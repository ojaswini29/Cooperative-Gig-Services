const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');
const workerRoutes = require('./workerRoutes');
const categoryRoutes = require('./categoryRoutes');
const bookingRoutes = require('./bookingRoutes');
const matchRoutes = require('./matchRoutes');
const allocationRoutes = require('./allocationRoutes');
const jobRoutes = require('./jobRoutes');
const invoiceRoutes = require('./invoiceRoutes');
const ratingRoutes = require('./ratingRoutes');
const welfareRoutes = require('./welfareRoutes');
const forecastRoutes = require('./forecastRoutes');
const adminRoutes = require('./adminRoutes');

router.use('/auth', authRoutes);
router.use('/workers', workerRoutes);
router.use('/', categoryRoutes);
router.use('/bookings', bookingRoutes);
router.use('/match', matchRoutes);
router.use('/allocation', allocationRoutes);
router.use('/jobs', jobRoutes);
router.use('/', invoiceRoutes);
router.use('/ratings', ratingRoutes);
router.use('/welfare', welfareRoutes);
router.use('/forecasting', forecastRoutes);
router.use('/admin', adminRoutes);

module.exports = router;
