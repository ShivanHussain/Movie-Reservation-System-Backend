import { body } from 'express-validator';
import { validateRequest } from './validateRequest.js';

export const validateTheater = [
  body('name').trim().notEmpty().withMessage('Theater name is required'),
  body('location.address').trim().notEmpty().withMessage('Address is required'),
  body('location.city').trim().notEmpty().withMessage('City is required'),
  body('location.state').trim().notEmpty().withMessage('State is required'),
  body('location.zipCode').trim().notEmpty().withMessage('Zip code is required'),
  body('screens').isArray({ min: 1 }).withMessage('At least one screen is required'),
  body('screens.*.screenNumber').isInt({ min: 1 }).withMessage('Screen number must be positive'),
  body('screens.*.capacity').isInt({ min: 1 }).withMessage('Capacity must be positive'),
  validateRequest
];
