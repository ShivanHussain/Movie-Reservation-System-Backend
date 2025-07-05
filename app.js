// app.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet'; 
import { connectDB } from './database/dbConnection.js';

import authRoutes from './routes/authRoutes.js';
import movieRoutes from './routes/movieRoutes.js';
import theaterRoutes from './routes/theaterRoutes.js';
import showtimeRoutes from './routes/showTimeRoutes.js';
import reservationRoutes from './routes/reservationRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import { errorHandler } from './middlewares/errorHandler.js';

dotenv.config({ path: 'config/config.env' });

const app = express();

// Connect to DB
connectDB();

// Middleware
app.use(cors());
app.use(helmet()); 
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/movies', movieRoutes);
app.use('/api/theaters', theaterRoutes);
app.use('/api/showtimes', showtimeRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/admin', adminRoutes);

// Health Check Route
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Movie Reservation System API is running',
    timestamp: new Date().toISOString()
  });
});

// API Documentation Route
app.get('/api/docs', (req, res) => {
  res.json({
    title: 'Movie Reservation System API',
    version: '1.0.0',
    endpoints: {
      auth: {
        'POST /api/auth/register': 'Register new user',
        'POST /api/auth/login': 'Login user',
        'GET /api/auth/me': 'Get current logged-in user',
        'PUT /api/auth/profile': 'Update user profile',
        'PUT /api/auth/change-password': 'Change user password'
      },
      movies: {
        'GET /api/movies': 'Get all movies',
        'GET /api/movies/meta/genres': 'Get movie genres',
        'GET /api/movies/status/now-playing': 'Get now playing movies',
        'GET /api/movies/status/coming-soon': 'Get coming soon movies',
        'GET /api/movies/:id': 'Get movie by ID',
        'POST /api/movies': 'Add new movie (admin)',
        'PUT /api/movies/:id': 'Update movie (admin)',
        'DELETE /api/movies/:id': 'Delete movie (admin)'
      },
      theaters: {
        'GET /api/theaters': 'Get all theaters',
        'GET /api/theaters/meta/cities': 'Get list of cities',
        'GET /api/theaters/:id': 'Get theater by ID',
        'POST /api/theaters': 'Create a theater (admin)',
        'PUT /api/theaters/:id': 'Update a theater (admin)',
        'DELETE /api/theaters/:id': 'Delete a theater (admin)'
      },
      showtimes: {
        'GET /api/showtimes': 'List all showtimes',
        'GET /api/showtimes/movie/:movieId': 'Get showtimes by movie ID',
        'GET /api/showtimes/:id/seats': 'Get available seats for showtime',
        'GET /api/showtimes/:id': 'Get showtime by ID',
        'POST /api/showtimes': 'Create a showtime (admin)',
        'PUT /api/showtimes/:id': 'Update a showtime (admin)',
        'DELETE /api/showtimes/:id': 'Delete a showtime (admin)'
      },
      reservations: {
        'GET /api/reservations/my-reservations': 'Get reservations for logged-in user',
        'GET /api/reservations/:id': 'Get reservation by ID',
        'POST /api/reservations': 'Create a reservation',
        'PUT /api/reservations/:id/cancel': 'Cancel reservation',
        'GET /api/reservations': 'Get all reservations (admin)',
        'PUT /api/reservations/:id/status': 'Update reservation status (admin)',
        'GET /api/reservations/analytics/overview': 'Get reservations analytics (admin)'
      },
      admin: {
        'GET /api/admin': 'Get all users',
        'GET /api/admin/:id': 'Get user by ID',
        'DELETE /api/admin/:id': 'Delete user by ID',
        'GET /api/admin/:id/reservations': 'Get user reservation history',
        'PATCH /api/admin/:id/status': 'Block or unblock user',
        'GET /api/admin/:id/dashboard': 'Get user dashboard stats'
      },
      misc: {
        'GET /api/health': 'Check API health status',
        'GET /api/docs': 'View this API documentation'
      }
    }
  });
});

// Error Handler Middleware
app.use(errorHandler);

// 404 Handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

export default app;
