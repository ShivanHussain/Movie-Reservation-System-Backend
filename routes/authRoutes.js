import express from 'express';
import { authenticate } from '../middlewares/auth.js';
import { validateUserLogin, validateUserRegistration } from '../middlewares/validation/userValidation.js';
import {
  registerUser,
  loginUser,
  getCurrentUser,
  updateProfile,
  changePassword
} from '../controllers/authController.js';

const router = express.Router();

router.post('/register', validateUserRegistration, registerUser);
router.post('/login', validateUserLogin, loginUser);
router.get('/me', authenticate, getCurrentUser);
router.put('/profile', authenticate, updateProfile);
router.put('/change-password', authenticate, changePassword);

export default router;
