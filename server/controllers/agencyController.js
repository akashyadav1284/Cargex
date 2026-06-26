const jwt = require('jsonwebtoken');
const Agency = require('../models/Agency');
const Driver = require('../models/Driver');
const Vehicle = require('../models/Vehicle');
const Booking = require('../models/Booking');

const generateToken = (id) => {
  return jwt.sign({ id, role: 'agency' }, process.env.JWT_SECRET || 'secret123', {
    expiresIn: '30d',
  });
};

// @desc    Auth agency & get token
// @route   POST /api/agency/auth/login
// @access  Public
exports.loginAgency = async (req, res) => {
  try {
    const { email, password } = req.body;

    const agency = await Agency.findOne({ email });

    if (agency && (await agency.matchPassword(password))) {
      if (agency.status !== 'active') {
        return res.status(401).json({ success: false, message: 'Agency account is not active' });
      }

      res.json({
        success: true,
        _id: agency._id,
        name: agency.name,
        email: agency.email,
        phone: agency.phone,
        status: agency.status,
        token: generateToken(agency._id),
      });
    } else {
      res.status(401).json({ success: false, message: 'Invalid email or password' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get agency dashboard overview
// @route   GET /api/agency/dashboard
// @access  Private (Agency)
exports.getDashboardData = async (req, res) => {
  try {
    const agencyId = req.user._id;

    const totalDrivers = await Driver.countDocuments({ agencyId });
    const onlineDrivers = await Driver.countDocuments({ agencyId, isOnline: true });
    const totalVehicles = await Vehicle.countDocuments({ agencyId });
    const activeVehicles = await Vehicle.countDocuments({ agencyId, status: 'active' });

    // Assuming active trips are those in progress
    const activeTrips = await Booking.countDocuments({ 
      agencyId, 
      status: { $in: ['accepted', 'arrived', 'in_progress'] } 
    });

    const agency = await Agency.findById(agencyId).select('financials');
    const revenue = agency.financials.totalEarnings || 0;

    res.json({
      success: true,
      data: {
        totalDrivers,
        onlineDrivers,
        totalVehicles,
        activeVehicles,
        activeTrips,
        revenue
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get agency drivers
// @route   GET /api/agency/drivers
// @access  Private (Agency)
exports.getDrivers = async (req, res) => {
  try {
    const agencyId = req.user._id;
    const drivers = await Driver.find({ agencyId }).populate('assignedVehicleId', 'numberPlate model');
    res.json({ success: true, count: drivers.length, data: drivers });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get agency vehicles
// @route   GET /api/agency/vehicles
// @access  Private (Agency)
exports.getVehicles = async (req, res) => {
  try {
    const agencyId = req.user._id;
    const vehicles = await Vehicle.find({ agencyId }).populate('driverId', 'fullName phone');
    res.json({ success: true, count: vehicles.length, data: vehicles });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get agency bookings
// @route   GET /api/agency/bookings
// @access  Private (Agency)
exports.getBookings = async (req, res) => {
  try {
    const agencyId = req.user._id;
    const bookings = await Booking.find({ agencyId })
      .populate('driverId', 'fullName phone')
      .populate('vehicleId', 'numberPlate')
      .sort({ createdAt: -1 })
      .limit(50);
    res.json({ success: true, count: bookings.length, data: bookings });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
