import { body } from 'express-validator';
import { validateRequest } from './validateRequest.js';

export const validateMovie = [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('description').trim().isLength({ min: 10 }).withMessage('Description must be at least 10 characters'),
  body('genre').isArray({ min: 1 }).withMessage('At least one genre is required'),
  body('duration').isInt({ min: 1 }).withMessage('Duration must be a positive number'),
  body('rating').isIn(['G', 'PG', 'PG-13', 'R', 'NC-17']).withMessage('Invalid rating'),
  body('releaseDate').isISO8601().withMessage('Invalid release date'),
  body('director').trim().notEmpty().withMessage('Director is required'),
  validateRequest
];
