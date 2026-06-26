const express = require('express');
const router = express.Router();
const {
  getStats, getLiveStats, getAnalytics,
  getAllBookings, getBookingById, adminCancelBooking, adminForceAssign,
  getAllDrivers, getDriverById, verifyDriverKYC, blockDriver, unblockDriver, createDriver, updateDriver, deleteDriver,
  getAllUsers, getUserById, blockUser, deleteUser,
  getAllVehicleTypes, createVehicleType, updateVehiclePricing, toggleVehicleStatus,
  setSurgeMultiplier,
  createAgency, getAllAgencies, getAgencyById, updateAgency, deleteAgency,
} = require('../controllers/adminController');
const { protectAdmin } = require('../middleware/authMiddleware');

// Stats & Analytics
router.get('/stats',      protectAdmin, getStats);
router.get('/live-stats', protectAdmin, getLiveStats);
router.get('/analytics',  protectAdmin, getAnalytics);

// Bookings
router.get('/bookings',                 protectAdmin, getAllBookings);
router.get('/bookings/:id',             protectAdmin, getBookingById);
router.put('/bookings/:id/cancel',      protectAdmin, adminCancelBooking);
router.put('/bookings/:id/assign',      protectAdmin, adminForceAssign);

// Drivers
router.get('/drivers',                  protectAdmin, getAllDrivers);
router.get('/drivers/:id',              protectAdmin, getDriverById);
router.post('/drivers',                 protectAdmin, createDriver);
router.put('/drivers/:id/update',       protectAdmin, updateDriver);
router.put('/drivers/:id/approve',      protectAdmin, verifyDriverKYC);
router.put('/drivers/:id/block',        protectAdmin, blockDriver);
router.put('/drivers/:id/unblock',      protectAdmin, unblockDriver);
router.delete('/drivers/:id',           protectAdmin, deleteDriver);

// Users
router.get('/users',                    protectAdmin, getAllUsers);
router.get('/users/:id',                protectAdmin, getUserById);
router.put('/users/:id/block',          protectAdmin, blockUser);
router.delete('/users/:id',             protectAdmin, deleteUser);

// Agencies
router.post('/agencies',                protectAdmin, createAgency);
router.get('/agencies',                 protectAdmin, getAllAgencies);
router.get('/agencies/:id',             protectAdmin, getAgencyById);
router.put('/agencies/:id',             protectAdmin, updateAgency);
router.delete('/agencies/:id',          protectAdmin, deleteAgency);

// Vehicles
router.get('/vehicles',                 protectAdmin, getAllVehicleTypes);
router.post('/vehicles',                protectAdmin, createVehicleType);
router.put('/vehicles/:id/pricing',     protectAdmin, updateVehiclePricing);
router.put('/vehicles/:id/status',      protectAdmin, toggleVehicleStatus);

// Surge
router.post('/surge',                   protectAdmin, setSurgeMultiplier);

module.exports = router;
