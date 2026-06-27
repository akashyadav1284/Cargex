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
    const vehicles = await Vehicle.find({ agencyId }).populate('driverId', 'fullName phone').populate('typeId');
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

    // Find all drivers belonging to this agency
    const drivers = await Driver.find({ agencyId }).select('_id');
    const driverIds = drivers.map(d => d._id);

    const bookings = await Booking.find({
      $or: [
        { agencyId },
        { driverId: { $in: driverIds } },
        { status: 'requested' }
      ]
    })
      .populate('driverId', 'fullName phone')
      .populate('vehicleId', 'numberPlate')
      .sort({ createdAt: -1 })
      .limit(100);

    res.json({ success: true, count: bookings.length, data: bookings });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Create agency driver
// @route   POST /api/agency/drivers
// @access  Private (Agency)
exports.createDriver = async (req, res) => {
  try {
    const { fullName, phone, email, password } = req.body;
    const agencyId = req.user._id;

    if (!fullName || !phone) {
      return res.status(400).json({ success: false, message: 'Please provide full name and phone number' });
    }

    // Check if driver exists
    let driver = await Driver.findOne({ phone });
    if (driver) {
      // If driver already belongs to this agency
      if (driver.agencyId && driver.agencyId.toString() === agencyId.toString()) {
        return res.status(400).json({ success: false, message: 'Driver is already registered under your agency.' });
      }
      
      // If driver belongs to another agency
      if (driver.agencyId) {
        return res.status(400).json({ success: false, message: 'Driver is already registered under another agency.' });
      }

      // If driver is independent (no agencyId), assign them to this agency!
      driver.agencyId = agencyId;
      driver.status = 'approved';
      driver.isApproved = true;
      driver.isVerified = true;
      if (fullName) driver.fullName = fullName;
      if (email) driver.email = email;
      // Update password only if provided
      if (password) {
        driver.password = password;
      }
      
      await driver.save();
      return res.status(200).json({ success: true, data: driver, message: 'Driver associated with your agency successfully' });
    }

    // If driver does not exist, check email first if provided
    if (email) {
      const emailExists = await Driver.findOne({ email });
      if (emailExists) {
        return res.status(400).json({ success: false, message: 'Driver with this email already exists' });
      }
    }

    if (!password) {
      return res.status(400).json({ success: false, message: 'Please provide a password for new driver registration' });
    }

    driver = await Driver.create({
      fullName,
      phone,
      email,
      password,
      agencyId,
      status: 'approved',
      isApproved: true,
      isVerified: true
    });

    res.status(201).json({ success: true, data: driver });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

// @desc    Create agency vehicle
// @route   POST /api/agency/vehicles
// @access  Private (Agency)
exports.createVehicle = async (req, res) => {
  try {
    const { numberPlate, name, model, typeId, driverId } = req.body;
    const agencyId = req.user._id;

    if (!numberPlate || !typeId) {
      return res.status(400).json({ success: false, message: 'Please provide number plate and vehicle type' });
    }

    // Check if vehicle exists
    const vehicleExists = await Vehicle.findOne({ numberPlate });
    if (vehicleExists) {
      return res.status(400).json({ success: false, message: 'Vehicle with this number plate already exists' });
    }

    // Fetch vehicle type details
    const VehicleType = require('../models/VehicleType');
    const vehicleType = await VehicleType.findById(typeId);
    if (!vehicleType) {
      return res.status(400).json({ success: false, message: 'Invalid vehicle type' });
    }

    const vehicle = await Vehicle.create({
      numberPlate,
      name: name || vehicleType.name,
      model: model || '',
      typeId,
      agencyId,
      capacity: vehicleType.capacityKg,
      status: driverId ? 'active' : 'idle',
      driverId: driverId || null
    });

    // If driver is assigned, update driver too
    if (driverId) {
      await Driver.findByIdAndUpdate(driverId, {
        assignedVehicleId: vehicle._id,
        vehicleDetails: {
          type: vehicleType.name,
          name: name || vehicleType.name,
          model: model || '',
          numberPlate,
          capacity: vehicleType.capacityKg
        }
      });
    }

    res.status(201).json({ success: true, data: vehicle });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

// @desc    Get active vehicle types
// @route   GET /api/agency/vehicle-types
// @access  Private (Agency)
exports.getVehicleTypes = async (req, res) => {
  try {
    const VehicleType = require('../models/VehicleType');
    const types = await VehicleType.find({ isActive: true });
    res.json({ success: true, count: types.length, data: types });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Update agency profile
// @route   PUT /api/agency/profile
// @access  Private (Agency)
exports.updateProfile = async (req, res) => {
  try {
    const agencyId = req.user._id;
    const { name, ownerName, phone } = req.body;

    const agency = await Agency.findById(agencyId);
    if (!agency) {
      return res.status(404).json({ success: false, message: 'Agency not found' });
    }

    if (name) agency.name = name;
    if (ownerName) agency.ownerName = ownerName;
    if (phone) agency.phone = phone;

    await agency.save();

    res.json({
      success: true,
      data: {
        _id: agency._id,
        name: agency.name,
        ownerName: agency.ownerName,
        email: agency.email,
        phone: agency.phone,
        status: agency.status
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

// @desc    Update agency password
// @route   PUT /api/agency/password
// @access  Private (Agency)
exports.updatePassword = async (req, res) => {
  try {
    const agencyId = req.user._id;
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Please provide old and new password' });
    }

    const agency = await Agency.findById(agencyId);
    if (!agency) {
      return res.status(404).json({ success: false, message: 'Agency not found' });
    }

    const isMatch = await agency.matchPassword(oldPassword);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Incorrect old password' });
    }

    agency.password = newPassword;
    await agency.save();

    res.json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

// @desc    Assign driver to booking
// @route   POST /api/agency/bookings/:id/assign
// @access  Private (Agency)
exports.assignDriver = async (req, res) => {
  try {
    const { driverId } = req.body;
    const bookingId = req.params.id;
    const agencyId = req.user._id;

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // Verify driver belongs to this agency
    const driver = await Driver.findOne({ _id: driverId, agencyId });
    if (!driver) {
      return res.status(403).json({ success: false, message: 'Driver does not belong to your agency or does not exist.' });
    }

    // Verify booking is assignable
    if (!['requested', 'pending', 'accepted'].includes(booking.status)) {
      return res.status(400).json({ success: false, message: 'Booking cannot be assigned in its current status.' });
    }

    // Assign driver to booking
    booking.driverId = driverId;
    booking.status = 'accepted';
    
    // Also try to find a vehicle assigned to this driver and attach it
    const Vehicle = require('../models/Vehicle');
    const vehicle = await Vehicle.findOne({ driverId });
    if (vehicle) {
      booking.vehicleId = vehicle._id;
    }

    await booking.save();

    // Broadcast socket event
    if (req.io) {
      req.io.to(`driver_${driverId}`).emit('new_ride_request', booking);
      req.io.to(booking._id.toString()).emit('driver_assigned', await booking.populate('driverId', 'fullName phone vehicleDetails'));
    }

    res.json({ success: true, message: 'Driver assigned successfully', data: booking });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

// @desc    Cancel booking
// @route   POST /api/agency/bookings/:id/cancel
// @access  Private (Agency)
exports.cancelBooking = async (req, res) => {
  try {
    const bookingId = req.params.id;
    const agencyId = req.user._id;

    // Retrieve booking and verify permissions
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // Check if the agency is allowed to cancel: must be owner, or have a driver assigned to it who is in this agency
    let isAuthorized = false;
    if (booking.agencyId && booking.agencyId.toString() === agencyId.toString()) {
      isAuthorized = true;
    } else if (booking.driverId) {
      const driver = await Driver.findOne({ _id: booking.driverId, agencyId });
      if (driver) {
        isAuthorized = true;
      }
    } else if (booking.status === 'requested') {
      // Requested bookings are public and can be cancelled/rejected by the agency
      isAuthorized = true;
    }

    if (!isAuthorized) {
      return res.status(403).json({ success: false, message: 'You are not authorized to cancel this booking.' });
    }

    if (['completed', 'cancelled'].includes(booking.status)) {
      return res.status(400).json({ success: false, message: `Booking already ${booking.status}` });
    }

    booking.status = 'cancelled';
    booking.cancellationReason = req.body.reason || 'Cancelled by agency';
    await booking.save();

    // Broadcast socket event
    if (req.io) {
      req.io.to('available_drivers').emit('ride_cancelled', { bookingId: booking._id.toString() });
      req.io.to(booking._id.toString()).emit('ride_cancelled', { bookingId: booking._id.toString() });
    }

    res.json({ success: true, message: 'Booking cancelled successfully', data: booking });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

// @desc    Assign vehicle to driver
// @route   POST /api/agency/drivers/:id/assign-vehicle
// @access  Private (Agency)
exports.assignVehicle = async (req, res) => {
  try {
    const driverId = req.params.id;
    const { vehicleId } = req.body;
    const agencyId = req.user._id;

    const driver = await Driver.findOne({ _id: driverId, agencyId });
    if (!driver) {
      return res.status(404).json({ success: false, message: 'Driver not found' });
    }

    // If there was a previously assigned vehicle, clear its driverId and set it to idle
    if (driver.assignedVehicleId) {
      await Vehicle.findByIdAndUpdate(driver.assignedVehicleId, { driverId: null, status: 'idle' });
    }

    if (!vehicleId) {
      // Just unassigning
      driver.assignedVehicleId = null;
      driver.vehicleDetails = undefined;
      await driver.save();
      return res.json({ success: true, message: 'Vehicle unassigned successfully', data: driver });
    }

    const vehicle = await Vehicle.findOne({ _id: vehicleId, agencyId }).populate('typeId');
    if (!vehicle) {
      return res.status(404).json({ success: false, message: 'Vehicle not found' });
    }

    // If vehicle was assigned to another driver, clear that driver's vehicle assignments
    if (vehicle.driverId) {
      await Driver.findByIdAndUpdate(vehicle.driverId, { assignedVehicleId: null, vehicleDetails: undefined });
    }

    // Update vehicle association
    vehicle.driverId = driverId;
    vehicle.status = 'active';
    await vehicle.save();

    // Update driver association
    driver.assignedVehicleId = vehicleId;
    driver.vehicleDetails = {
      type: vehicle.typeId?.name || '',
      name: vehicle.name || '',
      model: vehicle.model || '',
      numberPlate: vehicle.numberPlate,
      capacity: vehicle.capacity || vehicle.typeId?.capacityKg || 0
    };
    await driver.save();

    res.json({ success: true, message: 'Vehicle assigned successfully', data: driver });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

// @desc    Toggle driver status (approved vs blocked)
// @route   POST /api/agency/drivers/:id/toggle-status
// @access  Private (Agency)
exports.toggleDriverStatus = async (req, res) => {
  try {
    const driverId = req.params.id;
    const agencyId = req.user._id;

    const driver = await Driver.findOne({ _id: driverId, agencyId });
    if (!driver) {
      return res.status(404).json({ success: false, message: 'Driver not found' });
    }

    const newStatus = driver.status === 'blocked' ? 'approved' : 'blocked';
    driver.status = newStatus;
    driver.isApproved = newStatus === 'approved';
    await driver.save();

    res.json({ success: true, message: `Driver ${newStatus === 'approved' ? 'activated' : 'deactivated'} successfully`, data: driver });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

// @desc    Update vehicle documents verification status
// @route   PUT /api/agency/vehicles/:id/documents
// @access  Private (Agency)
exports.updateVehicleDocuments = async (req, res) => {
  try {
    const vehicleId = req.params.id;
    const agencyId = req.user._id;
    const { rc, insurance, pollution, verifiedStatus } = req.body;

    const vehicle = await Vehicle.findOne({ _id: vehicleId, agencyId });
    if (!vehicle) {
      return res.status(404).json({ success: false, message: 'Vehicle not found' });
    }

    if (rc !== undefined) vehicle.documents.rc = rc;
    if (insurance !== undefined) vehicle.documents.insurance = insurance;
    if (pollution !== undefined) vehicle.documents.pollution = pollution;
    if (verifiedStatus !== undefined) {
      vehicle.documents.verifiedStatus = verifiedStatus;
      vehicle.docsStatus = verifiedStatus;
    }

    await vehicle.save();
    res.json({ success: true, message: 'Vehicle documents updated successfully', data: vehicle });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

// @desc    Log vehicle maintenance
// @route   POST /api/agency/vehicles/:id/maintenance
// @access  Private (Agency)
exports.logVehicleMaintenance = async (req, res) => {
  try {
    const vehicleId = req.params.id;
    const agencyId = req.user._id;
    const { lastServiceDate, nextServiceDate, notes, status } = req.body;

    const vehicle = await Vehicle.findOne({ _id: vehicleId, agencyId });
    if (!vehicle) {
      return res.status(404).json({ success: false, message: 'Vehicle not found' });
    }

    vehicle.maintenance = {
      lastServiceDate: lastServiceDate ? new Date(lastServiceDate) : vehicle.maintenance?.lastServiceDate,
      nextServiceDate: nextServiceDate ? new Date(nextServiceDate) : vehicle.maintenance?.nextServiceDate,
      notes: notes !== undefined ? notes : vehicle.maintenance?.notes
    };

    if (status) {
      vehicle.status = status;
    }

    await vehicle.save();
    res.json({ success: true, message: 'Vehicle maintenance logged successfully', data: vehicle });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};
