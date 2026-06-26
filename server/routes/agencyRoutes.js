const express = require('express');
const router = express.Router();
const {
  loginAgency,
  getDashboardData,
  getDrivers,
  getVehicles,
  getBookings
} = require('../controllers/agencyController');
const { protectAgency } = require('../middleware/authMiddleware');

router.post('/auth/login', loginAgency);

router.route('/dashboard').get(protectAgency, getDashboardData);
router.route('/drivers').get(protectAgency, getDrivers);
router.route('/vehicles').get(protectAgency, getVehicles);
router.route('/bookings').get(protectAgency, getBookings);

module.exports = router;
