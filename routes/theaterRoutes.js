import express from 'express';
import {
  getAllTheaters,
  getTheaterById,
  createTheater,
  updateTheater,
  deleteTheater,
  getCities
} from '../controllers/theaterController.js';
import { authenticate, authorize } from '../middlewares/auth.js';
import { validateTheater } from '../middlewares/validation/theaterValidation.js';

const router = express.Router();

router.get('/', getAllTheaters);
router.get('/meta/cities', getCities);
router.get('/:id', getTheaterById);

router.post('/', authenticate, authorize('admin'), validateTheater, createTheater);
router.put('/:id', authenticate, authorize('admin'), validateTheater, updateTheater);
router.delete('/:id', authenticate, authorize('admin'), deleteTheater);

export default router;
