import mongoose from 'mongoose';
import dns from 'dns';

const connectDB = async () => {
  try {
    try {
      dns.setServers(['8.8.8.8', '8.8.4.4']);
    } catch {}
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (err) {
    console.warn(`MongoDB connection failed: ${err.message}`);
    console.warn('Running without MongoDB — JSON data layer active for applicable routes.');
  }
};

export default connectDB;
