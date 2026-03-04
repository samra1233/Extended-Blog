import express from 'express';
import {
  registerUser,
  loginUser,
  getMe,
  updateProfile,
  toggleBookmark,
  getBookmarks,
} from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/me', protect, getMe);
router.put('/me', protect, updateProfile);

router.get('/bookmarks', protect, getBookmarks);
router.put('/bookmarks/:postId', protect, toggleBookmark);

export default router;
