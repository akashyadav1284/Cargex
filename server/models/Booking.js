const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  driverId: { type: mongoose.Schema.Types.ObjectId, ref: 'Driver' },
  agencyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Agency' },
  vehicleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle' },

  pickupLocation: {
    address: { type: String, required: true },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true }
  },
  dropLocation: {
    address: { type: String, required: true },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true }
  },

  distance: { type: Number },           // km
  duration: { type: Number },           // minutes (estimated)
  vehicleType: { type: String, required: true },
  category: { type: String },
  subcategory: { type: String },
  loadType: { type: String, default: 'small' },  // small, medium, heavy
  loadWeight: { type: Number },          // kg (optional)
  helpersRequired: { type: Boolean, default: false },
  scheduledAt: { type: Date },

  // Full pricing breakdown from the fare engine
  pricing: {
    baseFare: { type: Number, default: 0 },
    distanceCost: { type: Number, default: 0 },
    loadCost: { type: Number, default: 0 },
    vehicleMultiplier: { type: Number, default: 1.0 },
    surgeMultiplier: { type: Number, default: 1.0 },
    nightSurcharge: { type: Number, default: 0 },
    waitingCharges: { type: Number, default: 0 },
    subtotal: { type: Number, default: 0 },
    totalFare: { type: Number, required: true }
  },

  // Legacy compat — keep reading old `price.total`
  price: {
    baseFare: { type: Number },
    distanceFare: { type: Number },
    surge: { type: Number, default: 0 },
    total: { type: Number }
  },

  status: {
    type: String,
    enum: ['requested', 'accepted', 'arrived', 'in_progress', 'completed', 'cancelled'],
    default: 'requested'
  },
  cancellationReason: { type: String },
  paymentStatus: { type: String, enum: ['pending', 'paid', 'failed'], default: 'pending' },
  paymentMethod: { type: String, enum: ['Cash', 'UPI', 'Card', 'Wallet'] },
  startedAt: { type: Date },
  completedAt: { type: Date }
}, {
  timestamps: true
});

// Virtual: always return the best available total price
bookingSchema.virtual('totalAmount').get(function() {
  return this.pricing?.totalFare || this.price?.total || 0;
});

bookingSchema.index({ userId: 1 });
bookingSchema.index({ driverId: 1 });
bookingSchema.index({ status: 1 });
bookingSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Booking', bookingSchema);
