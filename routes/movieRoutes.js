import express from 'express';
import { authenticate, authorize } from '../middlewares/auth.js';
import { validateMovie } from '../middlewares/validation/movieValidation.js';
import {
  getAllMovies,
  getMovieById,
  createMovie,
  updateMovie,
  deleteMovie,
  getGenres,
  getNowPlaying,
  getComingSoon
} from '../controllers/movieController.js';

const router = express.Router();

// Public Routes
router.get('/', getAllMovies);
router.get('/meta/genres', getGenres);
router.get('/status/now-playing', getNowPlaying);
router.get('/status/coming-soon', getComingSoon);
router.get('/:id', getMovieById);

// Admin Routes
router.post('/', authenticate, authorize('admin'), validateMovie, createMovie);
router.put('/:id', authenticate, authorize('admin'), validateMovie, updateMovie);
router.delete('/:id', authenticate, authorize('admin'), deleteMovie);

export default router;
