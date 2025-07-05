import mongoose from "mongoose";


const reservationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  showtime: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Showtime',
    required: true
  },
  seats: [{
    seatNumber: {
      type: String,
      required: true
    },
    seatType: {
      type: String,
      enum: ['standard', 'premium', 'vip'],
      default: 'standard'
    }
  }],
  totalAmount: {
    type: Number,
    required: true
  },
  bookingDate: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled'],
    default: 'pending'
  },
  paymentId: {
    type: String
  },
  bookingReference: {
    type: String,
    unique: true,
    default: function () {
    return 'BK' + Date.now() + Math.random().toString(36).substr(2, 5).toUpperCase();
  }
  }
}, {
  timestamps: true
});

// Generate booking reference before saving
reservationSchema.pre('save', function(next) {
  if (!this.bookingReference) {
    this.bookingReference = 'BK' + Date.now() + Math.random().toString(36).substr(2, 5).toUpperCase();
  }
  next();
});

export const Reservation = mongoose.model('Reservation', reservationSchema);