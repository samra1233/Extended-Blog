import express from 'express';
import {
  getCommentsByPost,
  addComment,
  deleteComment,
} from '../controllers/commentController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/:postId', getCommentsByPost);
router.post('/:postId', protect, addComment);
router.delete('/:id', protect, deleteComment);

export default router;
