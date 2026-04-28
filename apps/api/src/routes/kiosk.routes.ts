import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { checkin } from '../controllers/kiosk.controller';
import { validate } from '../middlewares/validate.middleware';
import { checkInSchema } from '../validators/kiosk.validator';

const router = Router();

const kioskLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many check-in attempts. Please wait a moment.',
    },
  },
});

// POST /api/v1/kiosk/checkin — NO auth middleware (public endpoint)
router.post('/checkin', kioskLimiter, validate(checkInSchema), checkin);

export default router;
