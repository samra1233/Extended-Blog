import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (err) {
    console.warn(`MongoDB connection failed: ${err.message}`);
    console.warn('Running without MongoDB — JSON data layer active for applicable routes.');
  }
};

export default connectDB;
