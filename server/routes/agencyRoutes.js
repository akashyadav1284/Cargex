const express = require('express');
const router = express.Router();
const {
  loginAgency,
  getDashboardData,
  getDrivers,
  getVehicles,
  getBookings,
  createDriver,
  createVehicle,
  getVehicleTypes,
  updateProfile,
  updatePassword,
  assignDriver,
  cancelBooking,
  assignVehicle,
  toggleDriverStatus,
  updateVehicleDocuments,
  logVehicleMaintenance
} = require('../controllers/agencyController');
const { protectAgency } = require('../middleware/authMiddleware');

router.post('/auth/login', loginAgency);

router.route('/dashboard').get(protectAgency, getDashboardData);
router.route('/drivers')
  .get(protectAgency, getDrivers)
  .post(protectAgency, createDriver);
router.route('/drivers/:id/assign-vehicle').post(protectAgency, assignVehicle);
router.route('/drivers/:id/toggle-status').post(protectAgency, toggleDriverStatus);

router.route('/vehicles')
  .get(protectAgency, getVehicles)
  .post(protectAgency, createVehicle);
router.route('/vehicles/:id/documents').put(protectAgency, updateVehicleDocuments);
router.route('/vehicles/:id/maintenance').post(protectAgency, logVehicleMaintenance);

router.route('/bookings').get(protectAgency, getBookings);
router.route('/bookings/:id/assign').post(protectAgency, assignDriver);
router.route('/bookings/:id/cancel').post(protectAgency, cancelBooking);
router.route('/vehicle-types').get(protectAgency, getVehicleTypes);

router.route('/profile').put(protectAgency, updateProfile);
router.route('/password').put(protectAgency, updatePassword);

module.exports = router;
