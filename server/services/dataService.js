/**
 * dataService.js — Abstraction layer for data access.
 *
 * When MongoDB is connected (readyState === 1), all operations go through
 * Mongoose models. When MongoDB is unavailable, read operations fall back
 * to local JSON files in server/data/. Write operations are no-ops in
 * JSON mode — this layer is designed for development continuity, not
 * production use without a real database.
 *
 * Replacing the JSON fallback with full MongoDB support requires no changes
 * to any controller that imports from this service.
 */

import mongoose from 'mongoose';
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dataDir = join(__dirname, '../data');

const isConnected = () => mongoose.connection.readyState === 1;

const readJSON = (file) => {
  try {
    return JSON.parse(readFileSync(join(dataDir, file), 'utf-8'));
  } catch {
    return [];
  }
};

const writeJSON = (file, data) => {
  writeFileSync(join(dataDir, file), JSON.stringify(data, null, 2));
};

// ── Stats (used by admin dashboard) ──────────────────────────────────────────

export const getStats = async () => {
  if (isConnected()) {
    const User = (await import('../models/User.js')).default;
    const Post = (await import('../models/Post.js')).default;
    const Comment = (await import('../models/Comment.js')).default;

    const [userCount, postCount, commentCount, topViewed, topLiked] = await Promise.all([
      User.countDocuments(),
      Post.countDocuments(),
      Comment.countDocuments(),
      Post.find({ status: 'published' })
        .sort({ views: -1 })
        .limit(5)
        .populate('author', 'name')
        .select('title views likes slug _id'),
      Post.find({ status: 'published' })
        .sort({ 'likes': -1 })
        .limit(5)
        .populate('author', 'name')
        .select('title views likes slug _id'),
    ]);

    return { userCount, postCount, commentCount, topViewed, topLiked };
  }

  // JSON fallback
  const users = readJSON('users.json');
  const posts = readJSON('posts.json');
  const comments = readJSON('comments.json');

  const sorted = [...posts].sort((a, b) => (b.views || 0) - (a.views || 0));
  const topViewed = sorted.slice(0, 5);
  const topLiked = [...posts]
    .sort((a, b) => (b.likes?.length || 0) - (a.likes?.length || 0))
    .slice(0, 5);

  return {
    userCount: users.length,
    postCount: posts.length,
    commentCount: comments.length,
    topViewed,
    topLiked,
  };
};

// ── Public post listing (JSON fallback for GET /api/posts when DB is down) ───

export const getPublicPosts = async ({ tag, q } = {}) => {
  if (isConnected()) return null; // caller uses Mongoose directly

  let posts = readJSON('posts.json').filter((p) => p.status !== 'draft');

  if (tag) {
    posts = posts.filter((p) => p.tags?.some((t) => t.toLowerCase() === tag.toLowerCase()));
  }

  if (q) {
    const lower = q.toLowerCase();
    posts = posts.filter(
      (p) =>
        p.title?.toLowerCase().includes(lower) ||
        p.content?.toLowerCase().includes(lower)
    );
  }

  return posts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
};

export { isConnected, readJSON, writeJSON };
