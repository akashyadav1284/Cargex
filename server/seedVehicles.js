require('dotenv').config();
const mongoose = require('mongoose');
const VehicleType = require('./models/VehicleType');
const connectDB = require('./config/db');

const vehicleData = [
  // 1. HOUSEHOLD GOODS
  { name: "Bike Courier (small items)", category: "Household Goods", subCategory: "Small Load", capacityKg: 20, volume: "1 ft", baseFare: 50, perKmRate: 10, helperAllowed: false, description: "Quick delivery for small household items", icon: "bike", isActive: true },
  { name: "Auto Loader", category: "Household Goods", subCategory: "Medium Load", capacityKg: 500, volume: "5 ft", baseFare: 150, perKmRate: 15, helperAllowed: true, description: "Perfect for few furniture pieces", icon: "auto_rickshaw", isActive: true },
  { name: "Tata Ace / Chota Hathi", category: "Household Goods", subCategory: "Medium Load", capacityKg: 750, volume: "7 ft", baseFare: 250, perKmRate: 18, helperAllowed: true, description: "Standard 1BHK shifting", icon: "mini_truck", isActive: true },
  { name: "Pickup Truck", category: "Household Goods", subCategory: "Large Load", capacityKg: 1000, volume: "8 ft", baseFare: 300, perKmRate: 20, helperAllowed: true, description: "1-2 BHK shifting", icon: "pickup", isActive: true },
  { name: "Mini Truck (14 ft)", category: "Household Goods", subCategory: "Large Load", capacityKg: 1500, volume: "14 ft", baseFare: 400, perKmRate: 22, helperAllowed: true, description: "Ideal for 2-3 BHK shifting", icon: "truck_14ft", isActive: true },
  { name: "Medium Truck (17 ft)", category: "Household Goods", subCategory: "Extra Large Load", capacityKg: 2500, volume: "17 ft", baseFare: 550, perKmRate: 25, helperAllowed: true, description: "Full 3BHK or large household shifting", icon: "truck_17ft", isActive: true },
  { name: "Large Truck (20 ft)", category: "Household Goods", subCategory: "Massive Load", capacityKg: 4000, volume: "20 ft", baseFare: 800, perKmRate: 30, helperAllowed: true, description: "4BHK+ and distant relocation", icon: "truck_20ft", isActive: true },
  { name: "Container Truck", category: "Household Goods", subCategory: "Massive Load", capacityKg: 5000, volume: "22 ft", baseFare: 1000, perKmRate: 35, helperAllowed: false, description: "Weather-proof secure shifting", icon: "container", isActive: true },

  // 2. PERSONAL DELIVERY
  { name: "Bike Courier", category: "Personal Delivery", subCategory: "Documents/Parcels", capacityKg: 20, volume: "Bag", baseFare: 40, perKmRate: 8, helperAllowed: false, description: "Instant courier and documents", icon: "bike", isActive: true },
  { name: "Scooter Delivery", category: "Personal Delivery", subCategory: "Documents/Parcels", capacityKg: 15, volume: "Bag", baseFare: 35, perKmRate: 7, helperAllowed: false, description: "Budget friendly small parcels", icon: "scooter", isActive: true },
  { name: "Electric Bike", category: "Personal Delivery", subCategory: "Eco-friendly", capacityKg: 20, volume: "Bag", baseFare: 30, perKmRate: 6, helperAllowed: false, description: "Eco-friendly personal deliveries", icon: "ebike", isActive: true },
  { name: "Auto Rickshaw Cargo", category: "Personal Delivery", subCategory: "Oversized Parcels", capacityKg: 300, volume: "3 ft", baseFare: 100, perKmRate: 12, helperAllowed: true, description: "Large parcels that don't fit on a bike", icon: "auto", isActive: true },

  // 3. BUSINESS / COMMERCIAL
  { name: "Tata Ace", category: "Business / Commercial", subCategory: "B2B Local", capacityKg: 750, volume: "7 ft", baseFare: 220, perKmRate: 16, helperAllowed: true, description: "Local commercial goods transport", icon: "tata_ace", isActive: true },
  { name: "Pickup Truck", category: "Business / Commercial", subCategory: "B2B Local", capacityKg: 1000, volume: "8 ft", baseFare: 280, perKmRate: 18, helperAllowed: true, description: "Hardware and supplies transport", icon: "pickup", isActive: true },
  { name: "Mini Truck", category: "Business / Commercial", subCategory: "B2B Regional", capacityKg: 1500, volume: "14 ft", baseFare: 380, perKmRate: 20, helperAllowed: true, description: "FMCG wholesale transport", icon: "mini_truck", isActive: true },
  { name: "E-commerce Van", category: "Business / Commercial", subCategory: "Last Mile", capacityKg: 600, volume: "Van", baseFare: 200, perKmRate: 14, helperAllowed: false, description: "Dedicated van for online store deliveries", icon: "van", isActive: true },
  { name: "Parcel Delivery Van", category: "Business / Commercial", subCategory: "Last Mile", capacityKg: 800, volume: "Large Van", baseFare: 250, perKmRate: 15, helperAllowed: false, description: "High volume parcel routing", icon: "large_van", isActive: true },
  { name: "Box Truck", category: "Business / Commercial", subCategory: "Secure Transit", capacityKg: 2000, volume: "16 ft", baseFare: 500, perKmRate: 24, helperAllowed: false, description: "Enclosed secure commercial transport", icon: "box_truck", isActive: true },

  // 4. FOOD & AGRICULTURE
  { name: "Pickup Truck", category: "Food & Agriculture", subCategory: "Farm to Market", capacityKg: 1000, volume: "Open Bed", baseFare: 250, perKmRate: 18, helperAllowed: true, description: "Fresh produce transport", icon: "pickup", isActive: true },
  { name: "Mini Truck", category: "Food & Agriculture", subCategory: "Farm to Market", capacityKg: 1500, volume: "14 ft Open", baseFare: 350, perKmRate: 20, helperAllowed: true, description: "Wholesale agri-product delivery", icon: "mini_truck", isActive: true },
  { name: "Refrigerated Van", category: "Food & Agriculture", subCategory: "Cold Chain", capacityKg: 800, volume: "Van", baseFare: 400, perKmRate: 25, helperAllowed: false, description: "Perishables and dairy transport", icon: "reefer_van", isActive: true },
  { name: "Cold Storage Truck", category: "Food & Agriculture", subCategory: "Cold Chain", capacityKg: 3000, volume: "16 ft", baseFare: 800, perKmRate: 35, helperAllowed: false, description: "Frozen meat, seafood, and vaccines", icon: "reefer_truck", isActive: true },
  { name: "Milk Transport Vehicle", category: "Food & Agriculture", subCategory: "Liquid Transport", capacityKg: 2000, volume: "Tanker", baseFare: 500, perKmRate: 22, helperAllowed: false, description: "Dedicated dairy liquid transport", icon: "tanker", isActive: true },
  { name: "Tractor with trolley", category: "Food & Agriculture", subCategory: "Rural Transit", capacityKg: 3000, volume: "Trolley", baseFare: 400, perKmRate: 15, helperAllowed: false, description: "Heavy rural agricultural transport", icon: "tractor", isActive: true },

  // 5. CONSTRUCTION MATERIAL
  { name: "Dump Truck", category: "Construction Material", subCategory: "Bulk Transport", capacityKg: 8000, volume: "Dump Bed", baseFare: 1000, perKmRate: 40, helperAllowed: false, description: "Sand, soil, and gravel transport", icon: "dump_truck", isActive: true },
  { name: "Tipper Truck", category: "Construction Material", subCategory: "Bulk Transport", capacityKg: 10000, volume: "Tipper", baseFare: 1200, perKmRate: 45, helperAllowed: false, description: "Heavy bulk construction materials", icon: "tipper", isActive: true },
  { name: "Tractor Trolley", category: "Construction Material", subCategory: "Local Transit", capacityKg: 4000, volume: "Trolley", baseFare: 500, perKmRate: 20, helperAllowed: false, description: "Bricks and local site delivery", icon: "tractor", isActive: true },
  { name: "Cement Mixer Truck", category: "Construction Material", subCategory: "Specialized", capacityKg: 12000, volume: "Mixer Drum", baseFare: 2500, perKmRate: 60, helperAllowed: false, description: "Ready-mix concrete delivery", icon: "mixer", isActive: true },
  { name: "Sand Carrier Truck", category: "Construction Material", subCategory: "Bulk Transport", capacityKg: 8000, volume: "Open Bed", baseFare: 1000, perKmRate: 40, helperAllowed: false, description: "River sand and aggregate", icon: "truck", isActive: true },
  { name: "Gravel Truck", category: "Construction Material", subCategory: "Bulk Transport", capacityKg: 8000, volume: "Open Bed", baseFare: 1000, perKmRate: 40, helperAllowed: false, description: "Crushed stone for paving", icon: "truck", isActive: true },

  // 6. INDUSTRIAL GOODS
  { name: "Flatbed Truck", category: "Industrial Goods", subCategory: "Oversized", capacityKg: 7000, volume: "Flatbed", baseFare: 1200, perKmRate: 35, helperAllowed: false, description: "Pipes, steel, and abnormal loads", icon: "flatbed", isActive: true },
  { name: "Container Truck", category: "Industrial Goods", subCategory: "Secure Transport", capacityKg: 15000, volume: "40 ft", baseFare: 2000, perKmRate: 50, helperAllowed: false, description: "Factory-to-port container transport", icon: "container", isActive: true },
  { name: "Heavy Duty Truck", category: "Industrial Goods", subCategory: "Heavy Load", capacityKg: 12000, volume: "24 ft", baseFare: 1500, perKmRate: 45, helperAllowed: false, description: "General heavy industrial freight", icon: "heavy_truck", isActive: true },
  { name: "Hydraulic Truck", category: "Industrial Goods", subCategory: "Specialized", capacityKg: 20000, volume: "Hydraulic", baseFare: 3000, perKmRate: 70, helperAllowed: false, description: "Specialized lifting and transport", icon: "hydraulic", isActive: true },
  { name: "Low Bed Trailer", category: "Industrial Goods", subCategory: "Extremely Heavy", capacityKg: 25000, volume: "Lowbed", baseFare: 4000, perKmRate: 80, helperAllowed: false, description: "Tall and heavy industrial machinery", icon: "trailer", isActive: true },

  // 7. HEAVY EQUIPMENT TRANSPORT
  { name: "Low Bed Trailer", category: "Heavy Equipment Transport", subCategory: "Machinery", capacityKg: 30000, volume: "Lowbed", baseFare: 5000, perKmRate: 90, helperAllowed: false, description: "For excavators and heavy plant", icon: "lowbed", isActive: true },
  { name: "Multi Axle Trailer", category: "Heavy Equipment Transport", subCategory: "Massive", capacityKg: 50000, volume: "Modular", baseFare: 10000, perKmRate: 150, helperAllowed: false, description: "Transformers and massive industrial equipment", icon: "multi_axle", isActive: true },
  { name: "Hydraulic Trailer", category: "Heavy Equipment Transport", subCategory: "Special Lift", capacityKg: 40000, volume: "Hydraulic", baseFare: 8000, perKmRate: 120, helperAllowed: false, description: "Precision moving of heavy gear", icon: "hydraulic_trailer", isActive: true },
  { name: "Heavy Load Carrier", category: "Heavy Equipment Transport", subCategory: "General Machinery", capacityKg: 20000, volume: "Flatbed Heavy", baseFare: 3500, perKmRate: 60, helperAllowed: false, description: "Standard construction machinery", icon: "heavy_carrier", isActive: true },

  // 8. VEHICLE TRANSPORT
  { name: "Bike Carrier", category: "Vehicle Transport", subCategory: "Two-Wheeler", capacityKg: 1000, volume: "Tow", baseFare: 500, perKmRate: 20, helperAllowed: false, description: "Transport 1-2 motorcycles safely", icon: "tow_truck", isActive: true },
  { name: "Car Carrier Truck", category: "Vehicle Transport", subCategory: "Four-Wheeler", capacityKg: 2500, volume: "Car Carrier", baseFare: 1000, perKmRate: 35, helperAllowed: false, description: "Flatbed for single car breakdown/delivery", icon: "car_carrier", isActive: true },
  { name: "Multi Car Carrier", category: "Vehicle Transport", subCategory: "Fleet", capacityKg: 15000, volume: "Multi-level", baseFare: 5000, perKmRate: 60, helperAllowed: false, description: "Transport multiple vehicles for dealerships", icon: "multi_car", isActive: true },
  { name: "Flatbed Tow Truck", category: "Vehicle Transport", subCategory: "Recovery", capacityKg: 3000, volume: "Flatbed", baseFare: 1200, perKmRate: 40, helperAllowed: false, description: "Accident recovery and transport", icon: "tow_flatbed", isActive: true },

  // 9. SPECIAL GOODS
  { name: "Refrigerated Truck", category: "Special Goods", subCategory: "Temperature Controlled", capacityKg: 4000, volume: "16 ft", baseFare: 1200, perKmRate: 40, helperAllowed: false, description: "Pharma and high-value perishables", icon: "reefer", isActive: true },
  { name: "Fragile Goods Van", category: "Special Goods", subCategory: "Soft Ride", capacityKg: 1000, volume: "Padded Van", baseFare: 600, perKmRate: 25, helperAllowed: true, description: "Glassware, art, and delicate items", icon: "fragile_van", isActive: true },
  { name: "Electronics Transport Van", category: "Special Goods", subCategory: "Secure", capacityKg: 2000, volume: "12 ft", baseFare: 800, perKmRate: 30, helperAllowed: true, description: "Shocks-absorbing suspension for electronics", icon: "tech_van", isActive: true },
  { name: "Chemical Transport Tanker", category: "Special Goods", subCategory: "Hazmat", capacityKg: 10000, volume: "Tanker", baseFare: 3000, perKmRate: 60, helperAllowed: false, description: "Certified for hazardous fluids", icon: "chemical_tank", isActive: true },
  { name: "Medical Supply Van", category: "Special Goods", subCategory: "Urgent/Sterile", capacityKg: 500, volume: "Van", baseFare: 1000, perKmRate: 30, helperAllowed: false, description: "Fast, sterile delivery of urgent medical supplies", icon: "ambulance", isActive: true },

  // Special Category: CONSTRUCTION EQUIPMENT
  { name: "JCB (Excavator)", category: "Construction Equipment", subCategory: "Earthmoving", capacityKg: 8000, volume: "Heavy", baseFare: 2500, perKmRate: 100, helperAllowed: false, description: "Earthmoving and digging equipment", icon: "excavator", isActive: true },
  { name: "Crane (Small/Heavy)", category: "Construction Equipment", subCategory: "Lifting", capacityKg: 15000, volume: "Heavy", baseFare: 5000, perKmRate: 200, helperAllowed: false, description: "High altitude lifting services", icon: "crane", isActive: true },
  { name: "Bulldozer", category: "Construction Equipment", subCategory: "Earthmoving", capacityKg: 12000, volume: "Heavy", baseFare: 4000, perKmRate: 150, helperAllowed: false, description: "Site levelling and clearing", icon: "bulldozer", isActive: true },
  { name: "Road Roller", category: "Construction Equipment", subCategory: "Paving", capacityKg: 10000, volume: "Heavy", baseFare: 3000, perKmRate: 120, helperAllowed: false, description: "Asphalt and soil compaction", icon: "roller", isActive: true },
  { name: "Backhoe Loader", category: "Construction Equipment", subCategory: "Versatile", capacityKg: 7000, volume: "Heavy", baseFare: 2000, perKmRate: 90, helperAllowed: false, description: "Digging and material handling", icon: "backhoe", isActive: true },
  { name: "Forklift", category: "Construction Equipment", subCategory: "Material Handling", capacityKg: 3000, volume: "Compact", baseFare: 1500, perKmRate: 50, helperAllowed: false, description: "Warehouse and site pallet lifting", icon: "forklift", isActive: true },
];

const seedVehicleTypes = async () => {
  try {
    await connectDB();
    
    console.log('Clearing old vehicle types...');
    try {
      await VehicleType.collection.drop();
    } catch (e) {
      // ignore if collection doesn't exist
    }
    
    console.log(`Inserting ${vehicleData.length} new vehicle types...`);
    await VehicleType.insertMany(vehicleData);
    
    console.log('✅ Vehicle Types seeded successfully!');
    process.exit(0);
  } catch (error) {
    if (error.writeErrors) {
      console.error('❌ Duplicate key errors: ', error.writeErrors.map(w => w.errmsg));
    }
    console.error('❌ Error seeding vehicle types:', error.message || error);
    process.exit(1);
  }
};

seedVehicleTypes();
