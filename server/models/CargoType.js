const mongoose = require('mongoose');

const cargoTypeSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  category: { 
    type: String, 
    enum: [
      'Household Goods', 
      'Personal Delivery', 
      'Business/Commercial', 
      'Food & Agriculture', 
      'Construction Material', 
      'Industrial Goods', 
      'Heavy Equipment Transport', 
      'Vehicle Transport', 
      'Special Goods'
    ], 
    required: true 
  },
  requiresSpecialHandling: { type: Boolean, default: false },
  description: { type: String }
}, {
  timestamps: true
});

cargoTypeSchema.index({ category: 1 });

module.exports = mongoose.model('CargoType', cargoTypeSchema);
