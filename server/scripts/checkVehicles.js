const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const connectDB = require('../config/db');
const VehicleType = require('../models/VehicleType');
const PricingConfig = require('../models/PricingConfig');

const run = async () => {
  try {
    await connectDB();
    
    const vehicleTypes = await VehicleType.find().lean();
    const pricingConfigs = await PricingConfig.find().lean();
    
    console.log('=== VEHICLE TYPES IN DATABASE ===');
    console.log(`Total count: ${vehicleTypes.length}`);
    const vtNames = new Set();
    vehicleTypes.forEach(vt => {
      vtNames.add(vt.name);
      console.log(`- Name: ${vt.name}, Capacity: ${vt.capacityKg}kg, Active: ${vt.isActive}, BaseFare: ${vt.baseFare}, PerKmRate: ${vt.perKmRate}`);
    });
    console.log('Unique names in VehicleType:', Array.from(vtNames));

    console.log('\n=== PRICING CONFIGS IN DATABASE ===');
    console.log(`Total count: ${pricingConfigs.length}`);
    const pcNames = new Set();
    pricingConfigs.forEach(pc => {
      pcNames.add(pc.vehicleName);
      console.log(`- Name: ${pc.vehicleName}, Base: ${pc.baseFare}, PerKm: ${pc.perKmRate}, Active: ${pc.isActive}`);
    });

    console.log('\n=== MISMATCH ANALYSIS ===');
    const missingInPc = Array.from(vtNames).filter(name => !pcNames.has(name));
    const extraInPc = Array.from(pcNames).filter(name => !vtNames.has(name));
    
    console.log('Vehicle names in VehicleType but missing in PricingConfig:', missingInPc);
    console.log('Vehicle names in PricingConfig but NOT in VehicleType:', extraInPc);

  } catch (err) {
    console.error('Error running script:', err);
  } finally {
    mongoose.connection.close();
  }
};

run();
