import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validation.middleware';
import * as authController from '../controllers/auth.controller';

const router = Router();

const registerSchema = z.object({
  email:    z.string().email(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  username: z.string().min(3).max(30).regex(/^[a-z0-9_]+$/, 'Username must be lowercase alphanumeric or underscore'),
});

const loginSchema = z.object({
  email:    z.string().email(),
  password: z.string().min(1),
});

const refreshSchema = z.object({
  refresh_token: z.string().min(1),
});

// POST /api/auth/register
router.post('/register', validate(registerSchema), authController.register);

// POST /api/auth/login
router.post('/login', validate(loginSchema), authController.login);

// POST /api/auth/logout
router.post('/logout', authController.logout);

// POST /api/auth/refresh
router.post('/refresh', validate(refreshSchema), authController.refresh);

// POST /api/auth/reset-password
router.post('/reset-password', validate(z.object({ email: z.string().email() })), authController.resetPassword);

export default router;
