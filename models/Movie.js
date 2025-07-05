import mongoose from "mongoose";
const movieSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  genre: [{
    type: String,
    required: true
  }],
  duration: {
    type: Number, // in minutes
    required: true
  },
  rating: {
    type: String,
    enum: ['G', 'PG', 'PG-13', 'R', 'NC-17'],
    required: true
  },
  releaseDate: {
    type: Date,
    required: true
  },
  director: {
    type: String,
    required: true
  },
  cast: [{
    type: String
  }],
  poster: {
    type: String // URL to poster image
  },
  trailer: {
    type: String // URL to trailer video
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

export const Movie = mongoose.model('Movie', movieSchema);