const mongoose = require('mongoose');

const earningSchema = new mongoose.Schema({
  agencyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Agency' },
  driverId: { type: mongoose.Schema.Types.ObjectId, ref: 'Driver' },
  bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking' },
  
  amount: { type: Number, required: true },
  type: { 
    type: String, 
    enum: ['earning', 'commission', 'expense', 'payout'], 
    required: true 
  },
  status: { type: String, enum: ['pending', 'completed', 'failed'], default: 'completed' },
  description: { type: String },
  
  date: { type: Date, default: Date.now }
}, {
  timestamps: true
});

earningSchema.index({ agencyId: 1 });
earningSchema.index({ driverId: 1 });
earningSchema.index({ date: -1 });

module.exports = mongoose.model('Earning', earningSchema);
