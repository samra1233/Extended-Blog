import asyncHandler from 'express-async-handler';
import User from '../models/User.js';
import generateToken from '../utils/generateToken.js';

// @desc  Register a new user
// @route POST /api/auth/register
const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    res.status(400);
    throw new Error('Please provide name, email, and password');
  }

  const userExists = await User.findOne({ email });
  if (userExists) {
    res.status(400);
    throw new Error('User with that email already exists');
  }

  const user = await User.create({ name, email, password });

  res.status(201).json({
    _id: user._id,
    name: user.name,
    email: user.email,
    avatar: user.avatar,
    bio: user.bio,
    role: user.role,
    token: generateToken(user._id),
  });
});

// @desc  Authenticate user & get token
// @route POST /api/auth/login
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400);
    throw new Error('Please provide email and password');
  }

  const user = await User.findOne({ email });

  if (!user || !(await user.matchPassword(password))) {
    res.status(401);
    throw new Error('Invalid email or password');
  }

  res.json({
    _id: user._id,
    name: user.name,
    email: user.email,
    avatar: user.avatar,
    bio: user.bio,
    role: user.role,
    token: generateToken(user._id),
  });
});

// @desc  Get current logged-in user
// @route GET /api/auth/me
const getMe = asyncHandler(async (req, res) => {
  res.json(req.user);
});

// @desc  Update profile (name, bio, avatar)
// @route PUT /api/auth/me
const updateProfile = asyncHandler(async (req, res) => {
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

  res.json({
    _id: updated._id,
    name: updated.name,
    email: updated.email,
    avatar: updated.avatar,
    bio: updated.bio,
    role: updated.role,
  });
});

// @desc  Toggle bookmark on a post
// @route PUT /api/auth/bookmarks/:postId
const toggleBookmark = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  // Works when mounted under /api/auth/bookmarks/:postId OR /api/posts/:id/bookmark
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

// @desc  Get current user's bookmarked posts
// @route GET /api/auth/bookmarks
const getBookmarks = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).populate({
    path: 'bookmarks',
    populate: { path: 'author', select: 'name avatar' },
  });

  res.json(user.bookmarks);
});

export { registerUser, loginUser, getMe, updateProfile, toggleBookmark, getBookmarks };
