// controllers/movieController.js
import { Movie } from '../models/Movie.js';

// Get All Movies
export const getAllMovies = async (req, res) => {
  try {
    const { page = 1, limit = 10, genre, search, sortBy = 'createdAt' } = req.query;

    const query = { isActive: true };

    if (genre) {
      query.genre = { $in: [genre] };
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { director: { $regex: search, $options: 'i' } },
        { cast: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    const movies = await Movie.find(query)
      .sort({ [sortBy]: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select('-__v');

    const total = await Movie.countDocuments(query);

    res.json({
      movies,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalMovies: total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error while fetching movies' });
  }
};

// Get Movie By ID
export const getMovieById = async (req, res) => {
  try {
    const movie = await Movie.findById(req.params.id).select('-__v');

    if (!movie || !movie.isActive) {
      return res.status(404).json({ message: 'Movie not found' });
    }

    res.json(movie);
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid movie ID' });
    }
    res.status(500).json({ message: 'Server error while fetching movie' });
  }
};

// Create Movie  (admin)
export const createMovie = async (req, res) => {
  try {
    const movie = new Movie(req.body);
    await movie.save();

    res.status(201).json({
      message: 'Movie created successfully',
      movie
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error while creating movie' });
  }
};

// Update Movie (admin)
export const updateMovie = async (req, res) => {
  try {
    const movie = await Movie.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!movie) {
      return res.status(404).json({ message: 'Movie not found' });
    }

    res.json({
      message: 'Movie updated successfully',
      movie
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid movie ID' });
    }
    res.status(500).json({ message: 'Server error while updating movie' });
  }
};
 
// Delete Movie  (admin)
export const deleteMovie = async (req, res) => {
  try {
    const movie = await Movie.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!movie) {
      return res.status(404).json({ message: 'Movie not found' });
    }

    res.json({ message: 'Movie deleted successfully' });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid movie ID' });
    }
    res.status(500).json({ message: 'Server error while deleting movie' });
  }
};

// Get Genres
export const getGenres = async (req, res) => {
  try {
    const genres = await Movie.distinct('genre', { isActive: true });
    res.json({ genres });
  } catch (error) {
    res.status(500).json({ message: 'Server error while fetching genres' });
  }
};

// Now Playing
export const getNowPlaying = async (req, res) => {
  try {
    const currentDate = new Date();
    const movies = await Movie.find({
      isActive: true,
      releaseDate: { $lte: currentDate }
    })
      .sort({ releaseDate: -1 })
      .limit(10)
      .select('-__v');

    res.json({ movies });
  } catch (error) {
    res.status(500).json({ message: 'Server error while fetching now playing movies' });
  }
};

// Coming Soon
export const getComingSoon = async (req, res) => {
  try {
    const currentDate = new Date();
    const movies = await Movie.find({
      isActive: true,
      releaseDate: { $gt: currentDate }
    })
      .sort({ releaseDate: 1 })
      .limit(10)
      .select('-__v');

    res.json({ movies });
  } catch (error) {
    res.status(500).json({ message: 'Server error while fetching coming soon movies' });
  }
};
