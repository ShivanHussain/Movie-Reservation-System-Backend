import { body } from 'express-validator';
import { validateRequest } from './validateRequest.js';

export const validateReservation = [
  body('showtime').isMongoId().withMessage('Invalid showtime ID'),
  body('seats').isArray({ min: 1 }).withMessage('At least one seat is required'),
  body('seats.*.seatNumber').isString().withMessage('Seat number is required'),
  validateRequest
];
