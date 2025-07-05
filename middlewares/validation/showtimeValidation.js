import { body } from 'express-validator';
import { validateRequest } from './validateRequest.js';

export const validateShowtime = [
  body('movie').isMongoId().withMessage('Invalid movie ID'),
  body('theater').isMongoId().withMessage('Invalid theater ID'),
  body('screenNumber').isInt({ min: 1 }).withMessage('Screen number must be positive'),
  body('startTime').isISO8601().withMessage('Invalid start time'),
  body('endTime').isISO8601().withMessage('Invalid end time'),
  body('price').isFloat({ min: 0 }).withMessage('Price must be positive'),
  body('totalSeats').isInt({ min: 1 }).withMessage('Total seats must be positive'),
  validateRequest
];
