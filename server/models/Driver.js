const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const driverSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  phone: { type: String, required: true, unique: true },
  email: { type: String, unique: true, sparse: true },
  password: { type: String },
  profileImage: { type: String, default: '' },
  
  // Agency & Fleet Relations
  agencyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Agency' },
  assignedVehicleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle' },
  
  // Base Profile details
  address: { type: String, default: '' },
  city: { type: String, default: '' },

  // State
  status: { type: String, enum: ['pending', 'approved', 'rejected', 'blocked'], default: 'pending' },
  isApproved: { type: Boolean, default: false }, // Keeping for backwards compat
  isVerified: { type: Boolean, default: false }, // Keeping for backwards compat
  
  isOnline: { type: Boolean, default: false },
  
  currentLocation: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], default: [0, 0] } 
  },
  
  // Expanded Vehicle requirements
  vehicleDetails: {
    type: { type: String }, // Maps to VehicleType category / subcategory or generic dropdown
    name: { type: String },
    model: { type: String },
    numberPlate: { type: String },
    capacity: { type: Number },
    fuelType: { type: String, enum: ['diesel', 'petrol', 'cng', 'electric', ''] },
    image: { type: String },
  },

  // Document Verification Workflow
  documents: {
    license: { type: String, default: '' }, // URL/Path
    rc: { type: String, default: '' }, 
    insurance: { type: String, default: '' },
    idProof: { type: String, default: '' },
    verifiedStatus: { type: String, enum: ['pending', 'verified', 'rejected'], default: 'pending' }
  },

  ratings: {
    averageRating: { type: Number, default: 0 },
    totalReviews: { type: Number, default: 0 }
  },
  
  earnings: {
    totalEarnings: { type: Number, default: 0 },
    todayEarnings: { type: Number, default: 0 }
  },
  
  // Redundant with totalRides below but aligning with user prompt strictly:
  totalRides: { type: Number, default: 0 },
  completedRides: { type: Number, default: 0 },
  cancelledRides: { type: Number, default: 0 }
}, {
  timestamps: true
});

// Hash password before saving
driverSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  // Handle empty or programmatic bulk syncs where password might be null
  if (!this.password) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare entered password with hashed password
driverSchema.methods.matchPassword = async function (enteredPassword) {
  if (!this.password) return false;
  return await bcrypt.compare(enteredPassword, this.password);
};

// Indexing for scaling geo and lookups
driverSchema.index({ 'vehicleDetails.numberPlate': 1 }, { sparse: true });
driverSchema.index({ currentLocation: '2dsphere' });

// Performance Indexing
driverSchema.index({ isOnline: 1, status: 1 });
driverSchema.index({ 'vehicleDetails.numberPlate': 1 });
driverSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Driver', driverSchema);

