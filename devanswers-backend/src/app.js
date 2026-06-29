import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

// Import all the models.
import Question from "./models/Question.js";
import Answer from "./models/Answer.js";
import User from "./models/User.js";
import Tag from "./models/Tag.js";

import router from './routes/index.js';
import errorhandler from './middleware/errorHandler.js';

const app = express();

// Security middlewares
app.use(helmet());

// A single SPA page load fans out into many API calls (questions, stats, saved
// questions, etc.), so a hard 100/15min trips during normal browsing and testing.
// Keep a strict cap in production, but relax it in development/test.
const isProduction = process.env.NODE_ENV === 'production';
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: isProduction ? 100 : 10000, // requests per IP per window
    standardHeaders: 'draft-8', // RFC 6585 combined RateLimit header (v8.x API)
    legacyHeaders: false,
});
app.use(limiter);

// Middlewares
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ 
    limit: '10mb', 
    extended: true 
}));

// Use router
app.use('/api', router);

// Error handling middleware
app.use(errorhandler);

export default app;