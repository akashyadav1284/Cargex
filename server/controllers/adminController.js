const User = require('../models/User');
const Driver = require('../models/Driver');
const Booking = require('../models/Booking');
const Agency = require('../models/Agency');

// ─────────────────────────────────────────────
// STATS
// ─────────────────────────────────────────────
const getStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ role: 'user' });
    const totalDrivers = await Driver.countDocuments();
    const completedBookings = await Booking.find({ status: 'completed' }).select('price').lean();
    const totalRevenue = completedBookings.reduce((acc, curr) => acc + (curr.price?.total || 0), 0);
    const platformCommission = totalRevenue * 0.20;
    const pendingApprovals = await Driver.countDocuments({ status: 'pending' });
    const activeBookings = await Booking.countDocuments({ status: { $in: ['requested', 'accepted', 'in_progress'] } });
    res.json({ totalUsers, totalDrivers, totalRevenue, platformCommission, pendingApprovals, activeBookings });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────
// LIVE STATS (real-time counts)
// ─────────────────────────────────────────────
const getLiveStats = async (req, res) => {
  try {
    const onlineDrivers = await Driver.countDocuments({ isOnline: true });
    const activeRides = await Booking.countDocuments({ status: { $in: ['accepted', 'in_progress'] } });
    const pendingRequests = await Booking.countDocuments({ status: 'requested' });
    const totalDrivers = await Driver.countDocuments();
    const totalUsers = await User.countDocuments();
    res.json({ onlineDrivers, activeRides, pendingRequests, totalDrivers, totalUsers });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────
// ANALYTICS
// ─────────────────────────────────────────────
const getAnalytics = async (req, res) => {
  try {
    const { period = 'monthly' } = req.query;
    const now = new Date();
    let startDate;
    let groupFormat;

    if (period === 'daily') {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29);
      groupFormat = { year: { $year: '$createdAt' }, month: { $month: '$createdAt' }, day: { $dayOfMonth: '$createdAt' } };
    } else if (period === 'weekly') {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 83);
      groupFormat = { year: { $year: '$createdAt' }, week: { $week: '$createdAt' } };
    } else {
      startDate = new Date(now.getFullYear() - 1, now.getMonth(), 1);
      groupFormat = { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } };
    }

    // Revenue & rides over time
    const revenueData = await Booking.aggregate([
      { $match: { createdAt: { $gte: startDate }, status: 'completed' } },
      { $group: {
        _id: groupFormat,
        revenue: { $sum: '$price.total' },
        rides: { $sum: 1 },
      }},
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1, '_id.week': 1 } }
    ]);

    // Booking status breakdown
    const statusBreakdown = await Booking.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    // Vehicle type popularity
    const vehicleBreakdown = await Booking.aggregate([
      { $group: { _id: '$vehicleType', count: { $sum: 1 }, revenue: { $sum: '$price.total' } } },
      { $sort: { count: -1 } },
      { $limit: 8 }
    ]);

    // Top drivers by earnings
    const topDrivers = await Driver.find({})
      .select('fullName earnings.totalEarnings completedRides ratings.averageRating')
      .sort({ 'earnings.totalEarnings': -1 })
      .limit(5)
      .lean();

    // Peak hours (last 30 days)
    const peakHours = await Booking.aggregate([
      { $match: { createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } } },
      { $group: { _id: { $hour: '$createdAt' }, count: { $sum: 1 } } },
      { $sort: { '_id': 1 } }
    ]);

    // Monthly user registrations
    const userGrowth = await User.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      { $group: {
        _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
        count: { $sum: 1 }
      }},
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    res.json({ revenueData, statusBreakdown, vehicleBreakdown, topDrivers, peakHours, userGrowth });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────
// BOOKINGS
// ─────────────────────────────────────────────
const getAllBookings = async (req, res) => {
  try {
    const { status, payment, vehicle, from, to, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (status && status !== 'all') filter.status = status;
    if (payment && payment !== 'all') filter.paymentMethod = payment;
    if (vehicle && vehicle !== 'all') filter.vehicleType = { $regex: vehicle, $options: 'i' };
    if (from || to) {
      filter.createdAt = {};
      if (from) filter.createdAt.$gte = new Date(from);
      if (to) filter.createdAt.$lte = new Date(new Date(to).setHours(23, 59, 59));
    }
    const total = await Booking.countDocuments(filter);
    const bookings = await Booking.find(filter)
      .populate('userId', 'fullName phone email')
      .populate('driverId', 'fullName phone vehicleDetails.numberPlate')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .lean();
    res.json({ bookings, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getBookingById = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('userId', 'fullName phone email profileImage')
      .populate('driverId', 'fullName phone email vehicleDetails profileImage')
      .lean();
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    res.json(booking);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const adminCancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    if (['completed', 'cancelled'].includes(booking.status))
      return res.status(400).json({ message: `Booking already ${booking.status}` });
    booking.status = 'cancelled';
    booking.cancellationReason = req.body.reason || 'Cancelled by admin';
    await booking.save();
    if (req.io) {
      req.io.to('available_drivers').emit('ride_cancelled', { bookingId: booking._id.toString() });
      req.io.to(booking._id.toString()).emit('ride_cancelled', { bookingId: booking._id.toString() });
    }
    res.json({ message: 'Booking cancelled by admin', booking });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const adminForceAssign = async (req, res) => {
  try {
    const { driverId } = req.body;
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    const driver = await Driver.findById(driverId);
    if (!driver) return res.status(404).json({ message: 'Driver not found' });
    booking.driverId = driverId;
    booking.status = 'accepted';
    await booking.save();
    if (req.io) {
      req.io.to(`driver_${driverId}`).emit('new_ride_request', booking);
      req.io.to(booking._id.toString()).emit('driver_assigned', await booking.populate('driverId', 'fullName phone vehicleDetails'));
    }
    res.json({ message: 'Driver force-assigned', booking });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────
// DRIVERS
// ─────────────────────────────────────────────
const getAllDrivers = async (req, res) => {
  try {
    const { search, status, online, city, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (status && status !== 'all') filter.status = status;
    if (online === 'online') filter.isOnline = true;
    if (online === 'offline') filter.isOnline = false;
    if (city && city !== 'all') filter.city = { $regex: city, $options: 'i' };
    if (search) {
      filter.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }
    const total = await Driver.countDocuments(filter);
    const drivers = await Driver.find(filter)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .lean();
    res.json({ drivers, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getDriverById = async (req, res) => {
  try {
    const driver = await Driver.findById(req.params.id).select('-password').lean();
    if (!driver) return res.status(404).json({ message: 'Driver not found' });
    const rides = await Booking.find({ driverId: req.params.id })
      .populate('userId', 'fullName phone')
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();
    const completedRides = rides.filter(r => r.status === 'completed');
    const totalEarningsCalc = completedRides.reduce((sum, r) => sum + (r.price?.total || 0), 0);
    const totalDistance = completedRides.reduce((sum, r) => sum + (r.distance || 0), 0);
    res.json({
      driver,
      rides,
      stats: {
        totalRides: rides.length,
        completedRides: completedRides.length,
        cancelledRides: rides.filter(r => r.status === 'cancelled').length,
        activeRides: rides.filter(r => ['accepted', 'in_progress'].includes(r.status)).length,
        totalEarnings: totalEarningsCalc || driver.earnings?.totalEarnings || 0,
        totalDistance,
        acceptanceRate: rides.length > 0 ? Math.round((completedRides.length / rides.length) * 100) : 0,
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const verifyDriverKYC = async (req, res) => {
  const driverId = req.params.id;
  const { status } = req.body;
  try {
    let updateFields = { status };
    if (status === 'approved') updateFields.isApproved = true;
    if (status === 'rejected') updateFields.isApproved = false;
    const driver = await Driver.findByIdAndUpdate(driverId, updateFields, { new: true });
    if (!driver) return res.status(404).json({ message: 'Driver not found' });
    if (req.io) req.io.to(`driver_${driverId}`).emit('driver_updated', driver);
    res.json({ message: `Driver status updated to ${status}`, driver });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const blockDriver = async (req, res) => {
  const driverId = req.params.id;
  try {
    const driver = await Driver.findByIdAndUpdate(
      driverId, { status: 'blocked', isApproved: false, isOnline: false }, { new: true }
    );
    if (!driver) return res.status(404).json({ message: 'Driver not found' });
    if (req.io) req.io.to(`driver_${driverId}`).emit('force_logout', { message: 'Your account has been blocked.' });
    res.json({ message: 'Driver blocked', driver });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const unblockDriver = async (req, res) => {
  const driverId = req.params.id;
  try {
    const driver = await Driver.findByIdAndUpdate(
      driverId, { status: 'approved', isApproved: true }, { new: true }
    );
    if (!driver) return res.status(404).json({ message: 'Driver not found' });
    res.json({ message: 'Driver unblocked', driver });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createDriver = async (req, res) => {
  const { fullName, email, password, phone, address, city, vehicleDetails, documents } = req.body;
  try {
    if (await Driver.findOne({ phone })) return res.status(400).json({ message: 'Phone already exists' });
    if (email && await Driver.findOne({ email })) return res.status(400).json({ message: 'Email already exists' });
    if (vehicleDetails?.numberPlate && await Driver.findOne({ 'vehicleDetails.numberPlate': vehicleDetails.numberPlate }))
      return res.status(400).json({ message: 'Number plate already registered' });
    const driver = await Driver.create({
      fullName, email, password, phone, address, city,
      status: 'approved', isApproved: true, vehicleDetails, documents
    });
    res.status(201).json(driver);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateDriver = async (req, res) => {
  const driverId = req.params.id;
  const { fullName, email, phone, address, city, vehicleDetails, documents, status } = req.body;
  try {
    if (vehicleDetails?.numberPlate) {
      const plateExists = await Driver.findOne({ 'vehicleDetails.numberPlate': vehicleDetails.numberPlate, _id: { $ne: driverId } });
      if (plateExists) return res.status(400).json({ message: 'Number plate registered to another driver' });
    }
    const driver = await Driver.findByIdAndUpdate(
      driverId,
      { fullName, email, phone, address, city, vehicleDetails, documents, ...(status && { status }) },
      { new: true, runValidators: true }
    );
    if (!driver) return res.status(404).json({ message: 'Driver not found' });
    if (req.io) req.io.to(`driver_${driverId}`).emit('driver_updated', driver);
    res.json({ message: 'Driver updated', driver });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteDriver = async (req, res) => {
  try {
    const driver = await Driver.findById(req.params.id);
    if (!driver) return res.status(404).json({ message: 'Driver not found' });
    await driver.deleteOne();
    res.json({ message: 'Driver removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────
// USERS
// ─────────────────────────────────────────────
const getAllUsers = async (req, res) => {
  try {
    const { search, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (search) {
      filter.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }
    const total = await User.countDocuments(filter);
    const users = await User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .lean();
    res.json({ users, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password').lean();
    if (!user) return res.status(404).json({ message: 'User not found' });
    const bookings = await Booking.find({ userId: req.params.id })
      .populate('driverId', 'fullName vehicleDetails.numberPlate')
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();
    const completedBookings = bookings.filter(b => b.status === 'completed');
    const totalSpent = completedBookings.reduce((sum, b) => sum + (b.price?.total || 0), 0);
    const avgBookingValue = completedBookings.length > 0 ? totalSpent / completedBookings.length : 0;
    res.json({
      user,
      bookings,
      stats: {
        totalBookings: bookings.length,
        completedBookings: completedBookings.length,
        cancelledBookings: bookings.filter(b => b.status === 'cancelled').length,
        activeBookings: bookings.filter(b => ['requested', 'accepted', 'in_progress'].includes(b.status)).length,
        totalSpent,
        avgBookingValue: Math.round(avgBookingValue),
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const blockUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id, { isVerified: false }, { new: true }
    );
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'User blocked', user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    await user.deleteOne();
    res.json({ message: 'User deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────
// AGENCIES
// ─────────────────────────────────────────────
const createAgency = async (req, res) => {
  const { name, email, password, phone, ownerName, companyRegistrationNumber, address } = req.body;
  try {
    if (await Agency.findOne({ email })) return res.status(400).json({ message: 'Agency email already exists' });
    const agency = await Agency.create({
      name, email, password, phone, ownerName, companyRegistrationNumber, address, status: 'active'
    });
    res.status(201).json(agency);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getAllAgencies = async (req, res) => {
  try {
    const agencies = await Agency.find({}).select('-password').sort({ createdAt: -1 }).lean();
    res.json(agencies);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getAgencyById = async (req, res) => {
  try {
    const agency = await Agency.findById(req.params.id).select('-password').lean();
    if (!agency) return res.status(404).json({ message: 'Agency not found' });
    
    // Also fetch their drivers and vehicles stats
    const totalDrivers = await Driver.countDocuments({ agencyId: agency._id });
    const totalVehicles = await require('../models/Vehicle').countDocuments({ agencyId: agency._id });
    
    res.json({ agency, stats: { totalDrivers, totalVehicles } });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateAgency = async (req, res) => {
  try {
    // If password is included, hash it or handle separately. Mongoose pre-save handles it if using save().
    // For findByIdAndUpdate, password hashing must be done manually if updating password here.
    const updateData = { ...req.body };
    if (updateData.password) {
      const bcrypt = require('bcryptjs');
      const salt = await bcrypt.genSalt(10);
      updateData.password = await bcrypt.hash(updateData.password, salt);
    }
    const agency = await Agency.findByIdAndUpdate(req.params.id, updateData, { new: true }).select('-password');
    if (!agency) return res.status(404).json({ message: 'Agency not found' });
    res.json(agency);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteAgency = async (req, res) => {
  try {
    const agency = await Agency.findById(req.params.id);
    if (!agency) return res.status(404).json({ message: 'Agency not found' });
    // Soft delete or cascade delete. For now, hard delete.
    await agency.deleteOne();
    res.json({ message: 'Agency deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────
// VEHICLES
// ─────────────────────────────────────────────
const VehicleType = require('../models/VehicleType');

const getAllVehicleTypes = async (req, res) => {
  try {
    const vehicles = await VehicleType.find({}).sort({ category: 1, capacityKg: 1 }).lean();
    res.json(vehicles);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createVehicleType = async (req, res) => {
  try {
    const vehicle = await VehicleType.create(req.body);
    res.status(201).json(vehicle);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateVehiclePricing = async (req, res) => {
  try {
    const vehicle = await VehicleType.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!vehicle) return res.status(404).json({ message: 'Vehicle not found' });
    res.json(vehicle);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const toggleVehicleStatus = async (req, res) => {
  try {
    const vehicle = await VehicleType.findByIdAndUpdate(req.params.id, { isActive: req.body.isActive }, { new: true });
    if (!vehicle) return res.status(404).json({ message: 'Vehicle not found' });
    res.json(vehicle);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const setSurgeMultiplier = async (req, res) => {
  const { isSurgeActive, multiplier } = req.body;
  try {
    res.json({ message: 'Surge settings updated', isSurgeActive, multiplier });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getStats, getLiveStats, getAnalytics,
  getAllBookings, getBookingById, adminCancelBooking, adminForceAssign,
  getAllDrivers, getDriverById, verifyDriverKYC, blockDriver, unblockDriver, createDriver, updateDriver, deleteDriver,
  getAllUsers, getUserById, blockUser, deleteUser,
  getAllVehicleTypes, createVehicleType, updateVehiclePricing, toggleVehicleStatus,
  setSurgeMultiplier,
  createAgency, getAllAgencies, getAgencyById, updateAgency, deleteAgency,
};
