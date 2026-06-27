const { MongoClient } = require('mongodb');
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const localUri = 'mongodb://127.0.0.1:27017/cargex';
const remoteUri = process.env.MONGO_URI;

// Import models for seeding
const User = require('../models/User');
const Driver = require('../models/Driver');
const Booking = require('../models/Booking');
const Payment = require('../models/Payment');
const Review = require('../models/Review');
const Wallet = require('../models/Wallet');
const Admin = require('../models/Admin');
const Coupon = require('../models/Coupon');
const Notification = require('../models/Notification');
const Category = require('../models/Category');
const VehicleType = require('../models/VehicleType');
const PricingConfig = require('../models/PricingConfig');

async function run() {
  console.log('Starting DB Migration / Seeding Process...');
  console.log(`Remote URI: ${remoteUri}`);

  let localConnected = false;
  let copiedCount = 0;
  
  try {
    console.log('Attempting to connect to Local MongoDB...');
    const localClient = new MongoClient(localUri, { serverSelectionTimeoutMS: 3000 });
    await localClient.connect();
    localConnected = true;
    console.log('✅ Connected to Local MongoDB');

    const remoteClient = new MongoClient(remoteUri);
    await remoteClient.connect();
    console.log('✅ Connected to Remote Atlas MongoDB');

    const localDb = localClient.db();
    const remoteDb = remoteClient.db();

    const collections = await localDb.listCollections().toArray();
    console.log(`Found ${collections.length} collections locally.`);

    let totalLocalDocs = 0;
    for (const col of collections) {
      const count = await localDb.collection(col.name).countDocuments();
      totalLocalDocs += count;
    }

    if (totalLocalDocs > 0) {
      console.log(`Local DB has ${totalLocalDocs} documents. Commencing direct migration...`);
      for (const col of collections) {
        const colName = col.name;
        // Ignore system collections
        if (colName.startsWith('system.')) continue;

        console.log(`Migrating collection: ${colName}...`);
        const docs = await localDb.collection(colName).find({}).toArray();
        if (docs.length > 0) {
          // Clear remote collection first
          await remoteDb.collection(colName).deleteMany({});
          // Insert into remote
          await remoteDb.collection(colName).insertMany(docs);
          console.log(`  ✅ Migrated ${docs.length} documents for ${colName}`);
          copiedCount += docs.length;
        } else {
          console.log(`  ℹ️ Collection ${colName} is empty. Skipped.`);
        }
      }
      console.log(`🎉 Direct migration completed! Total documents copied: ${copiedCount}`);
      await localClient.close();
      await remoteClient.close();
      process.exit(0);
    } else {
      console.log('Local DB is empty. Proceeding to seed remote Atlas DB with default data...');
      await localClient.close();
      await remoteClient.close();
    }
  } catch (err) {
    console.log(`Could not migrate directly from Local MongoDB (${err.message}).`);
    console.log('Proceeding to seed remote Atlas DB with default data...');
  }

  // Seeding Fallback
  try {
    console.log('Connecting mongoose to Atlas...');
    await mongoose.connect(remoteUri);
    console.log('✅ Connected successfully to Atlas via Mongoose');

    // Clear existing remote data
    console.log('Clearing remote database collections...');
    await Promise.all([
      User.deleteMany(),
      Driver.deleteMany(),
      Booking.deleteMany(),
      Payment.deleteMany(),
      Review.deleteMany(),
      Wallet.deleteMany(),
      Admin.deleteMany(),
      Coupon.deleteMany(),
      Notification.deleteMany(),
      Category.deleteMany(),
      VehicleType.deleteMany(),
      PricingConfig.deleteMany()
    ]);

    // 1. Seed Hierarchy (Categories and VehicleTypes)
    console.log('Seeding Categories & VehicleTypes...');
    // Hierarchy seed data
    const hierarchy = [
      {
        name: "Construction Material",
        icon: "🧱",
        subcategories: [
          { name: "Sand", vehicles: [{ name: "Mini Truck", capacity: "1.5 ton", baseFare: 300, perKmRate: 20 }, { name: "Tipper Truck", capacity: "10 ton", baseFare: 1000, perKmRate: 45 }] },
          { name: "Bricks", vehicles: [{ name: "Mini Truck", capacity: "1.5 ton", baseFare: 300, perKmRate: 20 }, { name: "Tipper Truck", capacity: "10 ton", baseFare: 1000, perKmRate: 45 }] },
          { name: "Cement Bags", vehicles: [{ name: "Pickup", capacity: "800 kg", baseFare: 200, perKmRate: 15 }, { name: "Mini Truck", capacity: "1.5 ton", baseFare: 300, perKmRate: 20 }] },
          { name: "Steel Rods", vehicles: [{ name: "Flatbed", capacity: "15 ton", baseFare: 1500, perKmRate: 60 }] },
          { name: "Gravel", vehicles: [{ name: "Tipper Truck", capacity: "10 ton", baseFare: 1000, perKmRate: 45 }] }
        ]
      },
      {
        name: "Business / Commercial",
        icon: "🏢",
        subcategories: [
          { name: "Office Relocation", vehicles: [{ name: "Mini Truck", capacity: "1.5 ton", baseFare: 400, perKmRate: 25 }, { name: "Closed Truck", capacity: "4 ton", baseFare: 800, perKmRate: 35 }] },
          { name: "Wholesale Stock", vehicles: [{ name: "Pickup", capacity: "800 kg", baseFare: 200, perKmRate: 15 }] }
        ]
      },
      {
        name: "Household Goods",
        icon: "🏠",
        subcategories: [
          { name: "Small Load (1RK)", vehicles: [{ name: "Pickup", capacity: "800 kg", baseFare: 250, perKmRate: 18 }, { name: "Mini Truck", capacity: "1.5 ton", baseFare: 350, perKmRate: 22 }] },
          { name: "Large Load (2BHK+)", vehicles: [{ name: "Closed Truck", capacity: "4 ton", baseFare: 1000, perKmRate: 40 }] }
        ]
      },
      {
        name: "Personal Delivery",
        icon: "📦",
        subcategories: [
          { name: "Documents", vehicles: [{ name: "Bike", capacity: "10 kg", baseFare: 50, perKmRate: 7 }] },
          { name: "Small Parcel", vehicles: [{ name: "Scooter", capacity: "20 kg", baseFare: 60, perKmRate: 8 }] }
        ]
      },
      {
        name: "Heavy Equipment Transport",
        icon: "🚜",
        subcategories: [
          { name: "Crane / Excavator", vehicles: [{ name: "Trailer", capacity: "20 ton", baseFare: 3000, perKmRate: 100 }] },
          { name: "Industrial Gensets", vehicles: [{ name: "Flatbed", capacity: "15 ton", baseFare: 2000, perKmRate: 80 }] }
        ]
      },
      {
        name: "Vehicle Transport",
        icon: "🚗",
        subcategories: [
          { name: "Car Carrier", vehicles: [{ name: "Flatbed", capacity: "5 ton", baseFare: 1500, perKmRate: 50 }] },
          { name: "Bike Transport", vehicles: [{ name: "Pickup", capacity: "800 kg", baseFare: 500, perKmRate: 25 }] }
        ]
      },
      {
        name: "Food & Agriculture",
        icon: "🌾",
        subcategories: [
          { name: "Fresh Produce", vehicles: [{ name: "Pickup", capacity: "800 kg", baseFare: 200, perKmRate: 15 }] },
          { name: "Grain Bags", vehicles: [{ name: "Mini Truck", capacity: "1.5 ton", baseFare: 350, perKmRate: 20 }] }
        ]
      }
    ];

    const parseCapacity = (capStr) => {
      if (capStr.includes("kg")) return parseInt(capStr.replace("kg", "").trim());
      if (capStr.includes("ton")) return parseFloat(capStr.replace("ton", "").trim()) * 1000;
      return 0;
    };

    let totalVehicles = 0;
    for (const catData of hierarchy) {
      const newCategory = new Category({
        name: catData.name,
        icon: catData.icon,
        subcategories: catData.subcategories.map(sub => ({
          name: sub.name,
          description: `Transport specialized for ${sub.name.toLowerCase()}`
        }))
      });
      const savedCategory = await newCategory.save();
      for (const reqSub of catData.subcategories) {
        const validDocSubcategory = savedCategory.subcategories.find(s => s.name === reqSub.name);
        for (const veh of reqSub.vehicles) {
          const vehicleDoc = new VehicleType({
            name: veh.name,
            categoryId: savedCategory._id,
            subcategoryId: validDocSubcategory._id,
            capacityKg: parseCapacity(veh.capacity),
            baseFare: veh.baseFare,
            perKmRate: veh.perKmRate,
            icon: veh.name.includes('Bike') || veh.name.includes('Scooter') ? 'bike' : 'truck'
          });
          await vehicleDoc.save();
          totalVehicles++;
        }
      }
    }
    console.log(`  ✅ Seeded ${hierarchy.length} Categories and ${totalVehicles} VehicleTypes.`);

    // 2. Seed PricingConfigs
    console.log('Seeding PricingConfigs...');
    const configs = [
      { vehicleName: 'Bike',         baseFare: 30,   perKmRate: 5,   vehicleMultiplier: 1.0,  loadCharges: { small: 0, medium: 20, heavy: 40 },   nightSurcharge: 0.15, waitingChargePerMin: 1 },
      { vehicleName: 'Scooter',      baseFare: 40,   perKmRate: 6,   vehicleMultiplier: 1.0,  loadCharges: { small: 0, medium: 25, heavy: 50 },   nightSurcharge: 0.15, waitingChargePerMin: 1 },
      { vehicleName: 'Pickup',       baseFare: 80,   perKmRate: 12,  vehicleMultiplier: 1.2,  loadCharges: { small: 0, medium: 50, heavy: 100 },  nightSurcharge: 0.20, waitingChargePerMin: 2 },
      { vehicleName: 'Mini Truck',   baseFare: 120,  perKmRate: 15,  vehicleMultiplier: 1.4,  loadCharges: { small: 0, medium: 60, heavy: 150 },  nightSurcharge: 0.20, waitingChargePerMin: 2 },
      { vehicleName: 'Closed Truck', baseFare: 200,  perKmRate: 22,  vehicleMultiplier: 1.6,  loadCharges: { small: 0, medium: 80, heavy: 200 },  nightSurcharge: 0.20, waitingChargePerMin: 3 },
      { vehicleName: 'Tipper Truck', baseFare: 250,  perKmRate: 28,  vehicleMultiplier: 1.8,  loadCharges: { small: 0, medium: 100, heavy: 250 }, nightSurcharge: 0.25, waitingChargePerMin: 3 },
      { vehicleName: 'Flatbed',      baseFare: 400,  perKmRate: 35,  vehicleMultiplier: 2.0,  loadCharges: { small: 0, medium: 150, heavy: 350 }, nightSurcharge: 0.25, waitingChargePerMin: 4 },
      { vehicleName: 'Trailer',      baseFare: 800,  perKmRate: 60,  vehicleMultiplier: 2.5,  loadCharges: { small: 0, medium: 200, heavy: 500 }, nightSurcharge: 0.30, waitingChargePerMin: 5 },
    ];
    for (const cfg of configs) {
      await PricingConfig.create(cfg);
    }
    console.log(`  ✅ Seeded ${configs.length} PricingConfigs.`);

    // 3. Seed Users, Drivers, Admins, etc.
    console.log('Seeding Users, Drivers, Admins, etc...');
    
    // Admin
    await Admin.create({
      name: 'Super Admin',
      email: 'admin@cargex.com',
      password: 'password123',
      role: 'superadmin',
      permissions: {
        manageUsers: true,
        manageDrivers: true,
        manageBookings: true,
        managePayments: true
      }
    });

    await Admin.create({
      name: 'System Admin',
      email: 'admin@cargex.local',
      password: 'hashedpasswordadmin',
      role: 'superadmin',
      permissions: {
        manageUsers: true,
        manageDrivers: true,
        manageBookings: true,
        managePayments: true
      }
    });

    // User
    const user = await User.create({
      fullName: 'Rahul Sharma',
      email: 'rahul.s@example.com',
      phone: '+919876543210',
      password: 'hashedpassword123',
      role: 'user',
      isVerified: true,
      walletBalance: 1250,
      defaultPaymentMethod: 'Wallet',
      savedAddresses: [{
        label: 'Home',
        address: 'Andheri West, Mumbai',
        latitude: 19.1136,
        longitude: 72.8297
      }]
    });

    // Driver
    const driver = await Driver.create({
      fullName: 'Amit Kumar',
      phone: '+919988776655',
      email: 'amit.driver@example.com',
      password: 'hashedpassword123',
      isVerified: true,
      isApproved: true,
      isOnline: true,
      currentLocation: {
        type: 'Point',
        coordinates: [72.8297, 19.1136]
      },
      vehicleDetails: {
        type: 'mini truck',
        model: 'Tata Ace',
        numberPlate: 'MH-02-AB-1234',
        capacity: 750
      },
      ratings: {
        averageRating: 4.8,
        totalReviews: 120
      },
      earnings: {
        totalEarnings: 45000,
        todayEarnings: 1500
      },
      completedRides: 110
    });

    // Booking
    const booking = await Booking.create({
      userId: user._id,
      driverId: driver._id,
      pickupLocation: {
        address: 'Andheri West, Mumbai',
        latitude: 19.1136,
        longitude: 72.8297
      },
      dropLocation: {
        address: 'Bandra Kurla Complex, Mumbai',
        latitude: 19.0616,
        longitude: 72.8658
      },
      distance: 12.5,
      duration: 35,
      vehicleType: 'mini truck',
      loadType: 'furniture',
      helpersRequired: true,
      price: {
        baseFare: 150,
        distanceFare: 200,
        surge: 50,
        total: 400
      },
      status: 'completed',
      paymentStatus: 'paid',
      paymentMethod: 'Wallet',
      startedAt: new Date(Date.now() - 3600000),
      completedAt: new Date(Date.now() - 1800000)
    });

    // Update user ride history
    await User.findByIdAndUpdate(user._id, { $push: { rideHistory: booking._id } });

    // Payment
    await Payment.create({
      bookingId: booking._id,
      userId: user._id,
      driverId: driver._id,
      amount: 400,
      platformCommission: 80,
      driverEarning: 320,
      paymentMethod: 'wallet',
      status: 'success'
    });

    // Review
    await Review.create({
      bookingId: booking._id,
      userId: user._id,
      driverId: driver._id,
      rating: 5,
      comment: 'Very polite and helpful with the furniture.'
    });

    // Wallet
    await Wallet.create({
      userId: user._id,
      balance: 850,
      transactions: [{
        type: 'debit',
        amount: 400,
        reason: `Payment for booking ${booking._id}`,
        date: new Date()
      }]
    });

    // Coupon
    await Coupon.create({
      code: 'FIRST50',
      discountType: 'percentage',
      discountValue: 50,
      maxDiscount: 150,
      expiryDate: new Date(Date.now() + 86400000 * 30),
      usageLimit: 1000,
      usedCount: 45
    });

    // Notification
    await Notification.create({
      userId: user._id,
      type: 'payment',
      message: '₹400 was debited from your wallet for your recent ride.',
      isRead: false
    });

    console.log('  ✅ Seeded Admins, Users, Drivers, Bookings, Payments, Reviews, Wallets, Coupons, and Notifications.');
    console.log('🎉 Seeding fallback completed successfully on Atlas!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Fallback seeding failed:', err);
    process.exit(1);
  }
}

run();
