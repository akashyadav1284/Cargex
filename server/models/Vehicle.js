const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema({
  agencyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Agency' },
  driverId: { type: mongoose.Schema.Types.ObjectId, ref: 'Driver' }, // Currently assigned driver
  
  typeId: { type: mongoose.Schema.Types.ObjectId, ref: 'VehicleType' }, // Reference to VehicleType
  
  name: { type: String },
  model: { type: String },
  numberPlate: { type: String, required: true, unique: true },
  capacity: { type: Number },
  fuelType: { type: String, enum: ['diesel', 'petrol', 'cng', 'electric', ''] },
  image: { type: String },

  status: { type: String, enum: ['active', 'idle', 'maintenance', 'offline'], default: 'offline' },
  docsStatus: { type: String, enum: ['pending', 'verified', 'rejected', 'expired'], default: 'pending' },
  
  documents: {
    rc: { type: String, default: '' },
    insurance: { type: String, default: '' },
    pollution: { type: String, default: '' },
    verifiedStatus: { type: String, enum: ['pending', 'verified', 'rejected'], default: 'pending' }
  },

  maintenance: {
    lastServiceDate: { type: Date },
    nextServiceDate: { type: Date },
    notes: { type: String }
  }
}, {
  timestamps: true
});

vehicleSchema.index({ numberPlate: 1 });
vehicleSchema.index({ agencyId: 1 });
vehicleSchema.index({ driverId: 1 });

module.exports = mongoose.model('Vehicle', vehicleSchema);
