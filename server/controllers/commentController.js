import asyncHandler from 'express-async-handler';
import Comment from '../models/Comment.js';
import Post from '../models/Post.js';
import validateObjectId from '../utils/validateId.js';
import { createNotification } from '../utils/createNotification.js';

const buildCommentTree = (comments) => {
  const map = {};
  const roots = [];

  comments.forEach((c) => {
    map[c._id.toString()] = { ...c.toObject(), replies: [] };
  });

  comments.forEach((c) => {
    const node = map[c._id.toString()];
    if (c.parentId) {
      const parent = map[c.parentId.toString()];
      if (parent) {
        parent.replies.push(node);
      } else {
        roots.push(node);
      }
    } else {
      roots.push(node);
    }
  });

  return roots;
};

export const getCommentsByPost = asyncHandler(async (req, res) => {
  const comments = await Comment.find({ post: req.params.postId })
    .populate('author', 'name avatar')
    .sort({ createdAt: 1 })
    .limit(200);

  res.json(buildCommentTree(comments));
});

export const addComment = asyncHandler(async (req, res) => {
  const { content, parentId } = req.body;

  if (!content) {
    res.status(400);
    throw new Error('Comment content is required');
  }

  if (parentId) {
    const parent = await Comment.findById(parentId);
    if (!parent || parent.post.toString() !== req.params.postId) {
      res.status(400);
      throw new Error('Invalid parent comment');
    }
  }

  const comment = await Comment.create({
    content,
    author: req.user._id,
    post: req.params.postId,
    parentId: parentId || null,
  });

  const populated = await comment.populate('author', 'name avatar');

  Post.findById(req.params.postId)
    .then((post) => {
      if (post) {
        createNotification({ recipient: post.author, sender: req.user._id, type: 'comment', post: post._id }).catch(() => {});
      }
    })
    .catch(() => {});

  res.status(201).json({ ...populated.toObject(), replies: [] });
});

export const deleteComment = asyncHandler(async (req, res) => {
  validateObjectId(req.params.id, res, 'comment ID');
  const comment = await Comment.findById(req.params.id);

  if (!comment) {
    res.status(404);
    throw new Error('Comment not found');
  }

  const isAuthor = comment.author.toString() === req.user._id.toString();
  const isAdmin = req.user.role === 'admin';

  if (!isAuthor && !isAdmin) {
    res.status(403);
    throw new Error('Not authorized to delete this comment');
  }

  await Comment.deleteMany({ parentId: comment._id });
  await comment.deleteOne();

  res.json({ message: 'Comment deleted successfully' });
});
