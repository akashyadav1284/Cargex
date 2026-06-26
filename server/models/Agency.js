const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const agencySchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: { type: String, required: true },
  
  status: { type: String, enum: ['active', 'inactive', 'suspended'], default: 'active' },
  
  ownerName: { type: String },
  companyRegistrationNumber: { type: String },
  address: { type: String },
  
  financials: {
    totalEarnings: { type: Number, default: 0 },
    outstandingBalance: { type: Number, default: 0 },
    commissionRate: { type: Number, default: 10 } // percentage agency pays to the platform, or platform pays to agency
  }
}, {
  timestamps: true
});

// Hash password before saving
agencySchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password
agencySchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('Agency', agencySchema);
