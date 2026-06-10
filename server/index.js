import express from 'express';
import { createServer } from 'http';
import { Server as SocketIO } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import jwt from 'jsonwebtoken';
import connectDB from './config/db.js';
import { setIO } from './socket.js';
import authRoutes from './routes/authRoutes.js';
import postRoutes from './routes/postRoutes.js';
import commentRoutes from './routes/commentRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

dotenv.config();

connectDB();

const app = express();
const httpServer = createServer(app);

const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173';

// Socket.io — JWT auth middleware, each user joins a private room by their id
const io = new SocketIO(httpServer, {
  cors: { origin: CLIENT_ORIGIN, credentials: true },
});

io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) return next(new Error('Authentication required'));
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.id;
    next();
  } catch {
    next(new Error('Invalid token'));
  }
});

io.on('connection', (socket) => {
  socket.join(socket.userId);
  socket.on('disconnect', () => {});
});

setIO(io);

// Security headers
app.use(helmet());

// Restrict CORS to the known frontend origin
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || origin === CLIENT_ORIGIN) return callback(null, true);
    callback(new Error('CORS policy: origin not allowed'));
  },
  credentials: true,
}));

app.use(express.json({ limit: '1mb' }));

// Serve uploaded images as static files
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// Rate limiting — strict on auth, relaxed on general API
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  message: { message: 'Too many attempts, please try again in 15 minutes' },
  standardHeaders: true,
  legacyHeaders: false,
});

const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 100,
  message: { message: 'Too many requests, please slow down' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api', apiLimiter);

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/notifications', notificationRoutes);

// Global error handler — never expose stack traces to clients
app.use((err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  if (process.env.NODE_ENV !== 'production') {
    console.error(err.stack);
  }
  res.status(statusCode).json({ message: err.message });
});

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => console.log(`Server running on port ${PORT}`));
