import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema({
  content: { type: String, required: true, maxlength: 5000 },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  post: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true },
  parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Comment', default: null },
  createdAt: { type: Date, default: Date.now },
});

commentSchema.index({ post: 1 });

const Comment = mongoose.model('Comment', commentSchema);
export default Comment;
