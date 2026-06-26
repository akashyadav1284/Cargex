const Booking = require('../models/Booking');
const Driver = require('../models/Driver');
const Wallet = require('../models/Wallet');
const Payment = require('../models/Payment');

// @desc    Accept a ride (Atomic Distributed Lock)
const acceptRide = async (req, res) => {
  const { bookingId } = req.body;
  try {
    // Atomic lock: Only first driver to match 'requested' wins the race
    const booking = await Booking.findOneAndUpdate(
      { _id: bookingId, status: 'requested' },
      { $set: { driverId: req.driver._id, status: 'accepted' } },
      { new: true }
    );

    if (!booking) {
      return res.status(400).json({ message: 'Ride no longer available or already accepted.' });
    }

    await Driver.findByIdAndUpdate(req.driver._id, { isOnline: false });
    
    await booking.populate('driverId', 'fullName phone vehicleDetails');

    if (req.io) {
      // Targeted emission to the User's private room
      req.io.to(`user_${booking.userId}`).emit('driver_assigned', booking);
      // Also emit to the booking room for any listeners
      req.io.to(booking._id.toString()).emit('ride_status_update', { 
        bookingId: booking._id, status: 'accepted', driver: booking.driverId 
      });
    }

    res.json(booking);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Start a ride (Driver arrived and begins trip)
const startRide = async (req, res) => {
  const { bookingId } = req.body;
  try {
    const booking = await Booking.findOneAndUpdate(
      { _id: bookingId, driverId: req.driver._id, status: 'accepted' },
      { $set: { status: 'in_progress', startedAt: new Date() } },
      { new: true }
    );

    if (!booking) {
      return res.status(400).json({ message: 'Cannot start this ride.' });
    }

    if (req.io) {
      req.io.to(`user_${booking.userId}`).emit('ride_status_update', {
        bookingId: booking._id, status: 'in_progress'
      });
    }

    res.json(booking);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Complete a ride
const completeRide = async (req, res) => {
  const { bookingId } = req.body;
  try {
    const booking = await Booking.findOneAndUpdate(
      { _id: bookingId, driverId: req.driver._id, status: 'in_progress' },
      { $set: { status: 'completed', completedAt: new Date() } },
      { new: true }
    );

    if (!booking) {
      return res.status(400).json({ message: 'Cannot complete this ride.' });
    }

    // Use new pricing or fallback to legacy
    const totalAmount = booking.pricing?.totalFare || booking.price?.total || 0;
    const platformCommission = Math.round(totalAmount * 0.2);
    const driverEarning = totalAmount - platformCommission;
    
    await Payment.create({
       bookingId: booking._id,
       userId: booking.userId,
       driverId: req.driver._id,
       amount: totalAmount,
       platformCommission,
       driverEarning,
       paymentMethod: booking.paymentMethod || 'Cash',
       status: 'success'
    });

    await Driver.findByIdAndUpdate(req.driver._id, { 
      isOnline: true, 
      $inc: { completedRides: 1, 'earnings.totalEarnings': driverEarning, 'earnings.todayEarnings': driverEarning }
    });
    
    if (req.io) {
      req.io.to(`user_${booking.userId}`).emit('ride_status_update', {
        bookingId: booking._id, status: 'completed', pricing: booking.pricing, price: booking.price
      });
      req.io.to(`driver_${req.driver._id}`).emit('earnings_update', {
        earned: driverEarning, total: totalAmount
      });
    }

    res.json(booking);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update driver location (high-frequency, in-memory relay)
const updateLocation = async (req, res) => {
  const { lat, lng, bookingId } = req.body;
  try {
    // Update MongoDB for persistence (can be batched later via queue)
    await Driver.findByIdAndUpdate(req.driver._id, {
      currentLocation: { type: 'Point', coordinates: [lng, lat] }
    });

    // Instantly stream to the paired booking room via WebSocket
    if (req.io && bookingId) {
      req.io.to(bookingId).emit('live_location', { 
        lat, lng, driverId: req.driver._id 
      });
    }
    
    res.json({ message: 'Location updated' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Toggle availability
const toggleAvailability = async (req, res) => {
  try {
    const driver = await Driver.findById(req.driver._id);
    driver.isOnline = !driver.isOnline;
    await driver.save();
    res.json({ isOnline: driver.isOnline });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get trip earnings
const getEarnings = async (req, res) => {
  try {
    const driver = await Driver.findById(req.driver._id).select('earnings completedRides').lean();
    res.json({ earnings: driver.earnings, completedRides: driver.completedRides });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get driver profile (all data)
const getProfile = async (req, res) => {
  try {
    const driver = await Driver.findById(req.driver._id).select('-password').lean();
    res.json(driver);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update editable driver profile fields
const updateProfile = async (req, res) => {
  const { phone, address, city, documents } = req.body;
  try {
    const driver = await Driver.findById(req.driver._id);
    if (!driver) return res.status(404).json({ message: 'Driver not found' });
    
    // Explicitly allow only these fields to be self-edited
    if (phone) driver.phone = phone;
    if (address) driver.address = address;
    if (city) driver.city = city;
    
    // Driver can only update their profilePhoto nested in documents. Other docs strictly locked or handled elsewhere.
    if (documents?.profilePhoto) {
      if (!driver.documents) driver.documents = {};
      driver.documents.profilePhoto = documents.profilePhoto;
    }
    
    await driver.save();
    
    res.json({ message: 'Profile updated successfully', driver });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get past completed rides for the driver
const getRides = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const total = await Booking.countDocuments({ driverId: req.driver._id });
    const rides = await Booking.find({ driverId: req.driver._id })
      .populate('userId', 'fullName phone')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .lean();
    res.json({ rides, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get configured vehicles (usually 1 per driver)
const getVehicles = async (req, res) => {
  try {
    const driver = await Driver.findById(req.driver._id).select('vehicleDetails').lean();
    res.json(driver.vehicleDetails ? [driver.vehicleDetails] : []); // Returns as array to allow 1:N future expansion
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get active/pending booking for the driver
const getActiveRequest = async (req, res) => {
  try {
    // 1. Check for any booking already assigned to this driver that is in progress or accepted
    const activeBooking = await Booking.findOne({
      driverId: req.driver._id,
      status: { $in: ['accepted', 'in_progress', 'arrived'] }
    }).lean();

    if (activeBooking) {
      return res.json({
        booking: activeBooking,
        rideStatus: activeBooking.status
      });
    }

    // 2. If the driver is online, check for any pending 'requested' booking matching their vehicle type
    const driver = await Driver.findById(req.driver._id);
    if (driver && driver.isOnline) {
      const driverVehicleType = driver.vehicleDetails?.type || driver.vehicleDetails?.name;
      const query = { status: 'requested' };
      if (driverVehicleType) {
        query.vehicleType = driverVehicleType;
      }
      const pendingBooking = await Booking.findOne(query).lean();

      if (pendingBooking) {
        const leanBooking = {
          _id: pendingBooking._id,
          pickupLocation: pendingBooking.pickupLocation,
          dropLocation: pendingBooking.dropLocation,
          vehicleType: pendingBooking.vehicleType,
          loadType: pendingBooking.loadType,
          distance: pendingBooking.distance,
          pricing: pendingBooking.pricing,
          price: pendingBooking.price,
          status: pendingBooking.status,
        };
        return res.json({
          booking: leanBooking,
          rideStatus: 'incoming'
        });
      }
    }

    res.json({ booking: null, rideStatus: 'idle' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { 
  acceptRide, startRide, completeRide, updateLocation, 
  toggleAvailability, getEarnings, getProfile, 
  updateProfile, getRides, getVehicles, getActiveRequest
};
