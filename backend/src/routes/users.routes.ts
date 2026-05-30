import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';
import * as usersController from '../controllers/users.controller';

const router = Router();

const updateProfileSchema = z.object({
  name:             z.string().max(100).optional(),
  gender:           z.enum(['male','female','non_binary','prefer_not_to_say']).optional(),
  profession:       z.string().max(100).optional(),
  income_level:     z.string().max(50).optional(),
  sustainable_goal: z.boolean().optional(),
  fashion_style:    z.string().max(100).optional(),
});

// GET /api/users/me  — must come before /:username
router.get('/me', requireAuth, usersController.getMyProfile);

// PATCH /api/users/me
router.patch('/me', requireAuth, validate(updateProfileSchema), usersController.updateMyProfile);

// GET /api/users/me/connections  — must come before /:username
router.get('/me/connections', requireAuth, usersController.getMyConnections);

// GET /api/users/:username  – public profile
router.get('/:username', usersController.getPublicProfile);

export default router;
