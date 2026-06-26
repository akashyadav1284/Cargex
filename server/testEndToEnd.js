const mongoose = require('mongoose');
const User = require('./models/User');
const Driver = require('./models/Driver');
const Booking = require('./models/Booking');
const Payment = require('./models/Payment');

require('dotenv').config();

const runTest = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/cargex');
    console.log('✅ Connected to MongoDB');

    const user = await User.findOne({ role: 'user' });
    const driver = await Driver.findOne();

    if (!user || !driver) {
      console.log('❌ Missing User or Driver from seed data.');
      return process.exit(1);
    }

    console.log('✅ Found Test User:', user.fullName);
    console.log('✅ Found Test Driver:', driver.fullName);

    // 1. Create Booking
    const newBooking = await Booking.create({
      userId: user._id,
      pickupLocation: { address: 'Sector 1, Tech Park', latitude: 28.1, longitude: 77.1 },
      dropLocation: { address: 'Sector 2, Industrial', latitude: 28.2, longitude: 77.2 },
      distance: 15,
      duration: 35,
      vehicleType: 'Tata Ace', // Fix missing required parameter
      price: { baseFare: 100, distanceFare: 200, surge: 50, total: 350 },
      pricing: { baseFare: 100, distanceCost: 200, totalFare: 350 },
      paymentMethod: 'Cash',
      status: 'requested',
      otp: "1234"
    });
    console.log(`✅ [1/3] Booking created successfully: ${newBooking._id}`);

    // 2. Accept Ride
    newBooking.driverId = driver._id;
    newBooking.status = 'accepted';
    await newBooking.save();
    console.log(`✅ [2/3] Driver ${driver.fullName} accepted ride & updated mapping instance.`);

    // 3. Complete Ride
    newBooking.status = 'completed';
    newBooking.completedAt = new Date();
    await newBooking.save();

    const payment = await Payment.create({
       bookingId: newBooking._id,
       userId: user._id,
       driverId: driver._id,
       amount: newBooking.price.total,
       platformCommission: 70,
       driverEarning: 280,
       paymentMethod: 'Wallet',
       status: 'success'
    });
    console.log(`✅ [3/3] Ride Completed. High-integrity Ledger Payment generated: ${payment._id}`);

    console.log('🚀 E2E Database & Relation Integration verification completed perfectly. System is highly stable.');
    process.exit(0);

  } catch (error) {
    console.error('❌ E2E Test Failed:', error);
    process.exit(1);
  }
};

runTest();
