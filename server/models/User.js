import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, maxlength: 100 },
  email: { type: String, required: true, unique: true, maxlength: 254 },
  password: { type: String, required: true },
  bio: { type: String, default: '', maxlength: 500 },
  avatar: { type: String, default: '', maxlength: 2000 },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  bookmarks: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Post' }],
  following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  createdAt: { type: Date, default: Date.now },
});

userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);
export default User;
