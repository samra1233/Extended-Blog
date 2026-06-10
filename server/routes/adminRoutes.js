import express from 'express';
import {
  getAllUsers,
  deleteUser,
  getAdminPosts,
  getAdminStats,
  setUserRole,
  seedPosts,
} from '../controllers/adminController.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

// All admin routes require authentication + admin role
router.use(protect, adminOnly);

router.get('/stats', getAdminStats);
router.get('/users', getAllUsers);
router.delete('/users/:id', deleteUser);
router.put('/users/:id/role', setUserRole);
router.get('/posts', getAdminPosts);
router.post('/seed-posts', seedPosts);

export default router;
