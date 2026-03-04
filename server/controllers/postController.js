import asyncHandler from 'express-async-handler';
import Post from '../models/Post.js';
import slugify from '../utils/slugify.js';
import { getPublicPosts } from '../services/dataService.js';

// Generate a unique slug for a given title, optionally excluding a post by id
const generateUniqueSlug = async (title, excludeId = null) => {
  let base = slugify(title);
  if (!base) base = 'post';
  let slug = base;
  let counter = 1;

  while (true) {
    const query = { slug };
    if (excludeId) query._id = { $ne: excludeId };
    const existing = await Post.findOne(query);
    if (!existing) break;
    slug = `${base}-${counter}`;
    counter++;
  }

  return slug;
};

// @desc  Get all posts (supports ?tag=, ?status=draft|published, ?author=userId)
// @route GET /api/posts
const getAllPosts = asyncHandler(async (req, res) => {
  // JSON fallback when MongoDB is unavailable
  const fallback = await getPublicPosts({ tag: req.query.tag, q: req.query.q });
  if (fallback !== null) return res.json(fallback);

  const filter = {};

  // Only admins can request draft posts; everyone else only sees published
  if (req.query.status && req.user?.role === 'admin') {
    filter.status = req.query.status;
  } else {
    filter.status = 'published';
  }

  if (req.query.tag) {
    const escapedTag = req.query.tag.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    filter.tags = { $in: [new RegExp(`^${escapedTag}$`, 'i')] };
  }

  if (req.query.author) {
    filter.author = req.query.author;
  }

  const posts = await Post.find(filter)
    .populate('author', 'name avatar')
    .sort({ createdAt: -1 });

  res.json(posts);
});

// @desc  Search posts by title / content
// @route GET /api/posts/search?q=query
const searchPosts = asyncHandler(async (req, res) => {
  const { q } = req.query;

  if (!q || !q.trim()) {
    return res.json([]);
  }

  // Use MongoDB text index if available; fall back to regex
  let posts;
  try {
    posts = await Post.find({
      $text: { $search: q },
      status: 'published',
    })
      .populate('author', 'name avatar')
      .sort({ score: { $meta: 'textScore' } })
      .select({ score: { $meta: 'textScore' } });
  } catch {
    // Text index not yet built — regex fallback
    const escaped = q.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escaped, 'i');
    posts = await Post.find({
      status: 'published',
      $or: [{ title: regex }, { content: regex }, { tags: regex }],
    })
      .populate('author', 'name avatar')
      .sort({ createdAt: -1 });
  }

  res.json(posts);
});

// @desc  Get single post by ID or slug (increments view count)
// @route GET /api/posts/:id
const getPostById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const isObjectId = /^[a-fA-F0-9]{24}$/.test(id);

  const post = isObjectId
    ? await Post.findById(id).populate('author', 'name avatar')
    : await Post.findOne({ slug: id }).populate('author', 'name avatar');

  if (!post) {
    res.status(404);
    throw new Error('Post not found');
  }

  // Only increment views on published posts
  if (post.status === 'published') {
    await Post.findByIdAndUpdate(post._id, { $inc: { views: 1 } });
    post.views = (post.views || 0) + 1;
  }

  res.json(post);
});

// @desc  Get most viewed posts
// @route GET /api/posts/trending
const getTrendingPosts = asyncHandler(async (req, res) => {
  const posts = await Post.find({ status: 'published' })
    .populate('author', 'name avatar')
    .sort({ views: -1 })
    .limit(10);

  res.json(posts);
});

// @desc  Create a new post
// @route POST /api/posts
const createPost = asyncHandler(async (req, res) => {
  const { title, content, tags, coverImage, status } = req.body;

  if (!title || !content) {
    res.status(400);
    throw new Error('Title and content are required');
  }

  const slug = await generateUniqueSlug(title);

  const post = await Post.create({
    title,
    slug,
    content,
    author: req.user._id,
    tags: tags || [],
    coverImage: coverImage || '',
    status: status === 'draft' ? 'draft' : 'published',
  });

  const populated = await post.populate('author', 'name avatar');
  res.status(201).json(populated);
});

// @desc  Update a post (author or admin)
// @route PUT /api/posts/:id
const updatePost = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id);

  if (!post) {
    res.status(404);
    throw new Error('Post not found');
  }

  const isAuthor = post.author.toString() === req.user._id.toString();
  const isAdmin = req.user.role === 'admin';

  if (!isAuthor && !isAdmin) {
    res.status(403);
    throw new Error('Not authorized to update this post');
  }

  const { title, content, tags, coverImage, status } = req.body;

  // Regenerate slug only if title changes
  if (title && title !== post.title) {
    post.slug = await generateUniqueSlug(title, post._id);
  }

  post.title = title ?? post.title;
  post.content = content ?? post.content;
  post.tags = tags ?? post.tags;
  post.coverImage = coverImage ?? post.coverImage;
  if (status) post.status = status;
  post.updatedAt = Date.now();

  const updated = await post.save();
  await updated.populate('author', 'name avatar');
  res.json(updated);
});

// @desc  Delete a post (author or admin)
// @route DELETE /api/posts/:id
const deletePost = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id);

  if (!post) {
    res.status(404);
    throw new Error('Post not found');
  }

  const isAuthor = post.author.toString() === req.user._id.toString();
  const isAdmin = req.user.role === 'admin';

  if (!isAuthor && !isAdmin) {
    res.status(403);
    throw new Error('Not authorized to delete this post');
  }

  await post.deleteOne();
  res.json({ message: 'Post deleted successfully' });
});

// @desc  Like / unlike a post
// @route PUT /api/posts/:id/like
const likePost = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id);

  if (!post) {
    res.status(404);
    throw new Error('Post not found');
  }

  const userId = req.user._id.toString();
  const alreadyLiked = post.likes.some((id) => id.toString() === userId);

  if (alreadyLiked) {
    post.likes = post.likes.filter((id) => id.toString() !== userId);
  } else {
    post.likes.push(req.user._id);
  }

  await post.save();
  res.json({ likes: post.likes });
});

export {
  getAllPosts,
  searchPosts,
  getPostById,
  getTrendingPosts,
  createPost,
  updatePost,
  deletePost,
  likePost,
};
