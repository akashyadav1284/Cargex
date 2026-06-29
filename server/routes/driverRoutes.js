const express = require('express');
const router = express.Router();
const {
  acceptRide,
  startRide,
  completeRide,
  updateLocation,
  toggleAvailability,
  getEarnings,
  getProfile,
  updateProfile,
  getRides,
  getVehicles,
  getActiveRequest,
  getAvailableJobs
} = require('../controllers/driverController');
const { protectDriver } = require('../middleware/authMiddleware');

router.post('/accept', protectDriver, acceptRide);
router.post('/start', protectDriver, startRide);
router.post('/complete', protectDriver, completeRide);
router.post('/location', protectDriver, updateLocation);
router.put('/availability', protectDriver, toggleAvailability);
router.get('/earnings', protectDriver, getEarnings);

// Core Data Sync Routes
router.get('/profile', protectDriver, getProfile);
router.put('/update-profile', protectDriver, updateProfile);
router.get('/rides', protectDriver, getRides);
router.get('/vehicles', protectDriver, getVehicles);
router.get('/active-request', protectDriver, getActiveRequest);
router.get('/jobs', protectDriver, getAvailableJobs);

module.exports = router;
