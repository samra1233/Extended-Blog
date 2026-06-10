import express from 'express';
import { summarizePost } from '../controllers/aiController.js';

const router = express.Router();

// POST /api/ai/summarize — no auth required (post content is already public)
router.post('/summarize', summarizePost);

export default router;
