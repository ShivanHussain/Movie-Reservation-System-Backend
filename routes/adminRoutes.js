import express from 'express';
import { body } from 'express-validator';
import { authenticate, authorize } from '../middlewares/auth.js';
import {
  getAllUsers,
  getUserById,
  deleteUser,
  getUserReservations,
  blockOrUnblockUser,
  getUserDashboard
} from '../controllers/adminController.js';

const router = express.Router();

router.get('/', authenticate, authorize('admin'), getAllUsers);
router.get('/:id', authenticate, authorize('admin'), getUserById);
router.delete('/:id', authenticate, authorize('admin'), deleteUser);
router.get('/:id/reservations', authenticate, getUserReservations);
router.patch('/:id/status', authenticate, authorize('admin'), blockOrUnblockUser);
router.get('/:id/dashboard', authenticate, getUserDashboard);

export default router;
