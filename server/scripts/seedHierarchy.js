const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const Category = require('../models/Category');
const VehicleType = require('../models/VehicleType');

// Master Seed Data - structured as Category -> Subcategory -> Vehicles
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

// Reusable capacity parser
const parseCapacity = (capStr) => {
  if (capStr.includes("kg")) return parseInt(capStr.replace("kg", "").trim());
  if (capStr.includes("ton")) return parseFloat(capStr.replace("ton", "").trim()) * 1000;
  return 0;
};

async function seedData() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    
    console.log('🗑️  Clearing old flat collections...');
    await Category.deleteMany({});
    await VehicleType.deleteMany({});

    console.log('🌱 Seeding strict hierarchical data...');

    let totalVehicles = 0;

    for (const catData of hierarchy) {
      // 1. Prepare Category Document with Subcategory Arrays
      const newCategory = new Category({
        name: catData.name,
        icon: catData.icon,
        subcategories: catData.subcategories.map(sub => ({
          name: sub.name,
          description: `Transport specialized for ${sub.name.toLowerCase()}`
        }))
      });

      // Save the category so the object IDs are generated
      const savedCategory = await newCategory.save();
      console.log(`✅ Created Category: ${savedCategory.name}`);

      // 2. Iterate Subcategories to extract the generated ObjectIds and seed mapped VehicleTypes
      for (const reqSub of catData.subcategories) {
        // Find matching subcategory inside the saved document to get its true ObjectId
        const validDocSubcategory = savedCategory.subcategories.find(s => s.name === reqSub.name);
        
        for (const veh of reqSub.vehicles) {
          const vehicleDoc = new VehicleType({
            name: veh.name,
            categoryId: savedCategory._id, // Strict Ref
            subcategoryId: validDocSubcategory._id, // Strict Ref
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

    console.log(`\n🎉 Seeding Complete!`);
    console.log(`Created ${hierarchy.length} Categories.`);
    console.log(`Mapped ${totalVehicles} strict VehicleTypes to exact ObjectIds.`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ SEEDING FAILED:', error);
    process.exit(1);
  }
}

seedData();
