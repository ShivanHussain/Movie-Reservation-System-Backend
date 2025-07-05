import mongoose from "mongoose";
const showtimeSchema = new mongoose.Schema({
  movie: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Movie',
    required: true
  },
  theater: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Theater',
    required: true
  },
  screenNumber: {
    type: Number,
    required: true
  },
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  availableSeats: {
    type: Number,
    required: true
  },
  totalSeats: {
    type: Number,
    required: true
  },
  seatMap: {
    type: Map,
    of: {
      isBooked: Boolean,
      seatType: {
        type: String,
        enum: ['standard', 'premium', 'vip'],
        default: 'standard'
      }
    }
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

export const Showtime = mongoose.model('Showtime', showtimeSchema);