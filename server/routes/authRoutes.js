import express from 'express';
import {
  registerUser,
  loginUser,
  getMe,
  updateProfile,
  toggleBookmark,
  getBookmarks,
  toggleFollow,
  getFollowingFeed,
  makeMeAdmin,
} from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/me', protect, getMe);
router.put('/me', protect, updateProfile);
router.put('/make-admin', protect, makeMeAdmin);

router.get('/bookmarks', protect, getBookmarks);
router.put('/bookmarks/:postId', protect, toggleBookmark);

router.put('/follow/:userId', protect, toggleFollow);
router.get('/following-feed', protect, getFollowingFeed);

export default router;
