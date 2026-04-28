import { Router } from 'express';
import { login, refresh, logout } from '../controllers/auth.controller';
import { validate } from '../middlewares/validate.middleware';
import { loginSchema } from '../validators/auth.validator';

const router = Router();

// POST /api/v1/auth/login
router.post('/login', validate(loginSchema), login);

// POST /api/v1/auth/refresh
router.post('/refresh', refresh);

// POST /api/v1/auth/logout
router.post('/logout', logout);

export default router;
