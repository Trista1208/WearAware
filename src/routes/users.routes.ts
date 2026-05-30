import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';
import * as usersController from '../controllers/users.controller';

const router = Router();

const updateProfileSchema = z.object({
  display_name:     z.string().max(100).optional(),
  avatar_url:       z.string().url().optional(),
  age:              z.number().int().min(13).max(120).optional(),
  gender:           z.enum(['male','female','non_binary','prefer_not_to_say']).optional(),
  location_city:    z.string().max(100).optional(),
  location_country: z.string().max(100).optional(),
  bio:              z.string().max(500).optional(),
  style_tags:       z.array(z.string().max(50)).max(20).optional(),
});

// GET /api/users/me
router.get('/me', requireAuth, usersController.getMyProfile);

// PATCH /api/users/me
router.patch('/me', requireAuth, validate(updateProfileSchema), usersController.updateMyProfile);

// GET /api/users/:username  – public profile
router.get('/:username', usersController.getPublicProfile);

// GET /api/users/me/connections
router.get('/me/connections', requireAuth, usersController.getMyConnections);

export default router;
