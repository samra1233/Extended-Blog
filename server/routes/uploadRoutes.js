import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { uploadSingle } from '../middleware/upload.js';

const router = express.Router();

// POST /api/upload/image — authenticated users only, returns { url }
router.post('/image', protect, (req, res, next) => {
  uploadSingle(req, res, (err) => {
    if (err) {
      res.status(400);
      return next(err);
    }
    if (!req.file) {
      res.status(400);
      return next(new Error('No file received'));
    }
    res.json({
      url: `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`,
    });
  });
});

export default router;
