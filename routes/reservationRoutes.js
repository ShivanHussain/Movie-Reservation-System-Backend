import express from 'express';
import { authenticate, authorize } from '../middlewares/auth.js';
import { validateReservation } from '../middlewares/validation/reservationValidation.js';
import {
  getUserReservations,
  getAllReservations,
  getReservationById,
  createReservation,
  updateReservationStatus,
  cancelReservation,
  getReservationAnalytics
} from '../controllers/reservationController.js';

const router = express.Router();

// User routes
router.get('/my-reservations', authenticate, getUserReservations);
router.get('/:id', authenticate, getReservationById);
router.post('/', authenticate, validateReservation, createReservation);
router.put('/:id/cancel', authenticate, cancelReservation);

// Admin routes
router.get('/', authenticate, authorize('admin'), getAllReservations);
router.put('/:id/status', authenticate, authorize('admin'), updateReservationStatus);
router.get('/analytics/overview', authenticate, authorize('admin'), getReservationAnalytics);

export default router;
