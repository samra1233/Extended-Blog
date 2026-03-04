import express from 'express';
import {
  getAllPosts,
  searchPosts,
  getPostById,
  getTrendingPosts,
  createPost,
  updatePost,
  deletePost,
  likePost,
} from '../controllers/postController.js';
import { protect } from '../middleware/authMiddleware.js';
import { toggleBookmark } from '../controllers/authController.js';

const router = express.Router();

// Static routes must be defined before /:id to avoid being swallowed
router.get('/search', searchPosts);
router.get('/trending', getTrendingPosts);

router.get('/', getAllPosts);
router.get('/:id', getPostById);
router.post('/', protect, createPost);
router.put('/:id', protect, updatePost);
router.delete('/:id', protect, deletePost);
router.put('/:id/like', protect, likePost);
router.put('/:id/bookmark', protect, toggleBookmark);

export default router;
