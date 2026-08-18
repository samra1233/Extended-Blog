import asyncHandler from 'express-async-handler';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import Post from '../models/Post.js';
import generateToken from '../utils/generateToken.js';
import { createNotification } from '../utils/createNotification.js';

const formatUser = (user, token) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  avatar: user.avatar,
  bio: user.bio,
  role: user.role,
  following: user.following || [],
  ...(token ? { token } : {}),
});

export const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    res.status(400);
    throw new Error('Please provide name, email, and password');
  }

  if (password.length < 8) {
    res.status(400);
    throw new Error('Password must be at least 8 characters');
  }

  const userExists = await User.findOne({ email });
  if (userExists) {
    res.status(400);
    throw new Error('User with that email already exists');
  }

  const user = await User.create({ name, email, password });
  res.status(201).json(formatUser(user, generateToken(user._id)));
});

export const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400);
    throw new Error('Please provide email and password');
  }

  const user = await User.findOne({ email });

  const dummyHash = '$2a$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ012';
  const passwordMatch = user
    ? await user.matchPassword(password)
    : await bcrypt.compare(password, dummyHash);

  if (!user || !passwordMatch) {
    res.status(401);
    throw new Error('Invalid email or password');
  }

  res.json(formatUser(user, generateToken(user._id)));
});

export const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('-password');
  res.json(formatUser(user));
});

export const updateProfile = asyncHandler(async (req, res) => {
  const { name, bio, avatar } = req.body;

  const user = await User.findById(req.user._id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  user.name = name ?? user.name;
  user.bio = bio ?? user.bio;
  user.avatar = avatar ?? user.avatar;

  const updated = await user.save();
  res.json(formatUser(updated));
});

export const toggleBookmark = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  const postId = req.params.postId || req.params.id;

  const alreadyBookmarked = user.bookmarks.some((id) => id.toString() === postId);

  if (alreadyBookmarked) {
    user.bookmarks = user.bookmarks.filter((id) => id.toString() !== postId);
  } else {
    user.bookmarks.push(postId);
  }

  await user.save();
  res.json({ bookmarks: user.bookmarks, bookmarked: !alreadyBookmarked });
});

export const getBookmarks = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).populate({
    path: 'bookmarks',
    populate: { path: 'author', select: 'name avatar' },
  });

  res.json(user.bookmarks);
});

export const toggleFollow = asyncHandler(async (req, res) => {
  const targetId = req.params.userId;

  if (targetId === req.user._id.toString()) {
    res.status(400);
    throw new Error('You cannot follow yourself');
  }

  const target = await User.findById(targetId);
  if (!target) {
    res.status(404);
    throw new Error('User not found');
  }

  const me = await User.findById(req.user._id);
  const alreadyFollowing = me.following.some((id) => id.toString() === targetId);

  if (alreadyFollowing) {
    me.following = me.following.filter((id) => id.toString() !== targetId);
  } else {
    me.following.push(targetId);
  }

  await me.save();

  const nowFollowing = !alreadyFollowing;
  if (nowFollowing) {
    createNotification({ recipient: targetId, sender: req.user._id, type: 'follow' }).catch(() => {});
  }

  const followerCount = await User.countDocuments({ following: targetId });
  res.json({ following: nowFollowing, followerCount });
});

export const getFollowingFeed = asyncHandler(async (req, res) => {
  const me = await User.findById(req.user._id).select('following');

  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 9));
  const skip = (page - 1) * limit;

  const [posts, total] = await Promise.all([
    Post.find({ author: { $in: me.following }, status: 'published' })
      .populate('author', 'name avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Post.countDocuments({ author: { $in: me.following }, status: 'published' }),
  ]);

  res.json({ posts, page, pages: Math.ceil(total / limit), total });
});
