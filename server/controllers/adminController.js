import asyncHandler from 'express-async-handler';
import User from '../models/User.js';
import Post from '../models/Post.js';
import Comment from '../models/Comment.js';
import { getStats } from '../services/dataService.js';

// @desc  Get all users
// @route GET /api/admin/users
const getAllUsers = asyncHandler(async (req, res) => {
  const users = await User.find().select('-password').sort({ createdAt: -1 });
  res.json(users);
});

// @desc  Delete a user and all their content
// @route DELETE /api/admin/users/:id
const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  if (user._id.toString() === req.user._id.toString()) {
    res.status(400);
    throw new Error('Cannot delete your own admin account');
  }

  // Remove user's posts and comments
  const userPosts = await Post.find({ author: user._id }).select('_id');
  const postIds = userPosts.map((p) => p._id);
  await Comment.deleteMany({ $or: [{ author: user._id }, { post: { $in: postIds } }] });
  await Post.deleteMany({ author: user._id });
  await user.deleteOne();

  res.json({ message: 'User and all associated content deleted' });
});

// @desc  Get all posts including drafts (admin view)
// @route GET /api/admin/posts
const getAdminPosts = asyncHandler(async (req, res) => {
  const posts = await Post.find()
    .populate('author', 'name avatar')
    .sort({ createdAt: -1 });

  res.json(posts);
});

// @desc  Get platform statistics
// @route GET /api/admin/stats
const getAdminStats = asyncHandler(async (req, res) => {
  const stats = await getStats();
  res.json(stats);
});

// @desc  Promote or demote a user's role
// @route PUT /api/admin/users/:id/role
const setUserRole = asyncHandler(async (req, res) => {
  const { role } = req.body;

  if (!['user', 'admin'].includes(role)) {
    res.status(400);
    throw new Error('Role must be "user" or "admin"');
  }

  const user = await User.findById(req.params.id).select('-password');

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  user.role = role;
  await user.save();

  res.json({ _id: user._id, name: user.name, email: user.email, role: user.role });
});

export { getAllUsers, deleteUser, getAdminPosts, getAdminStats, setUserRole };
