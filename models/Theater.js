import mongoose from "mongoose";
const theaterSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  location: {
    address: {
      type: String,
      required: true
    },
    city: {
      type: String,
      required: true
    },
    state: {
      type: String,
      required: true
    },
    zipCode: {
      type: String,
      required: true
    }
  },
  screens: [{
    screenNumber: {
      type: Number,
      required: true
    },
    capacity: {
      type: Number,
      required: true
    },
    screenType: {
      type: String,
      enum: ['standard', 'imax', '3d', 'dolby'],
      default: 'standard'
    }
  }],
  facilities: [{
    type: String,
    enum: ['parking', 'restaurant', 'atm', 'wheelchair-accessible']
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

export const Theater = mongoose.model('Theater', theaterSchema);