import express from 'express';
import {
  getAllShowtimes,
  getShowtimeById,
  createShowtime,
  updateShowtime,
  deleteShowtime,
  getAvailableSeats,
  getShowtimesByMovie
} from '../controllers/showTimeController.js';
import { authenticate, authorize } from '../middlewares/auth.js';
import { validateShowtime } from '../middlewares/validation/showtimeValidation.js';

const router = express.Router();

router.get('/', getAllShowtimes);
router.get('/movie/:movieId', getShowtimesByMovie);
router.get('/:id/seats', getAvailableSeats);
router.get('/:id', getShowtimeById);
router.post('/', authenticate, authorize('admin'), validateShowtime, createShowtime);
router.put('/:id', authenticate, authorize('admin'), validateShowtime, updateShowtime);
router.delete('/:id', authenticate, authorize('admin'), deleteShowtime);

export default router;
