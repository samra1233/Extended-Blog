import mongoose from 'mongoose';

const postSchema = new mongoose.Schema({
  title: { type: String, required: true, maxlength: 200 },
  slug: { type: String, unique: true, sparse: true },
  content: { type: String, required: true, maxlength: 100000 },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  tags: { type: [String], default: [], validate: [v => v.length <= 20, 'Maximum 20 tags allowed'] },
  coverImage: { type: String, default: '' },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  status: { type: String, enum: ['draft', 'published'], default: 'published' },
  views: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

postSchema.index({ title: 'text', content: 'text' });
postSchema.index({ status: 1, createdAt: -1 });
postSchema.index({ author: 1, status: 1 });
postSchema.index({ status: 1, views: -1 });

const Post = mongoose.model('Post', postSchema);
export default Post;
