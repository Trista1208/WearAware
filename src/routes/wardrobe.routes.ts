import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';
import * as wardrobeController from '../controllers/wardrobe.controller';

const router = Router();

const createItemSchema = z.object({
  name:             z.string().min(1).max(200),
  brand:            z.string().max(100).optional(),
  category:         z.enum(['tops','bottoms','dresses','outerwear','footwear','accessories','underwear','sportswear','formalwear','other']),
  sub_category:     z.string().max(100).optional(),
  color:            z.string().max(50).optional(),
  secondary_colors: z.array(z.string().max(50)).default([]),
  material:         z.enum(['cotton','wool','silk','linen','polyester','nylon','acrylic','viscose','denim','leather','synthetic_blend','natural_blend','other']).optional(),
  material_details: z.string().max(200).optional(),
  condition:        z.enum(['new','like_new','good','fair','worn']).default('good'),
  purchase_year:    z.number().int().min(1950).max(new Date().getFullYear()).optional(),
  purchase_price:   z.number().min(0).optional(),
  image_urls:       z.array(z.string().url()).default([]),
  notes:            z.string().max(1000).optional(),
});

const updateItemSchema = createItemSchema.partial();

const wearLogSchema = z.object({
  worn_on:  z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD').optional(),
  occasion: z.string().max(100).optional(),
});

const listQuerySchema = z.object({
  category: z.enum(['tops','bottoms','dresses','outerwear','footwear','accessories','underwear','sportswear','formalwear','other']).optional(),
  color:    z.string().optional(),
  material: z.string().optional(),
  limit:    z.coerce.number().int().min(1).max(100).default(50),
  offset:   z.coerce.number().int().min(0).default(0),
});

// GET    /api/wardrobe              – list my items
router.get('/',                 requireAuth, validate(listQuerySchema, 'query'), wardrobeController.listItems);

// POST   /api/wardrobe              – add item to wardrobe
router.post('/',                requireAuth, validate(createItemSchema), wardrobeController.createItem);

// GET    /api/wardrobe/:id          – single item detail
router.get('/:id',              requireAuth, wardrobeController.getItem);

// PATCH  /api/wardrobe/:id          – update item
router.patch('/:id',            requireAuth, validate(updateItemSchema), wardrobeController.updateItem);

// DELETE /api/wardrobe/:id          – soft-delete (sets is_active = false)
router.delete('/:id',           requireAuth, wardrobeController.deleteItem);

// POST   /api/wardrobe/:id/wear     – log a wear event
router.post('/:id/wear',        requireAuth, validate(wearLogSchema), wardrobeController.logWear);

// GET    /api/wardrobe/:id/wear     – wear history for an item
router.get('/:id/wear',         requireAuth, wardrobeController.getWearHistory);

// GET    /api/wardrobe/stats/recent – most recently/frequently worn items
router.get('/stats/recent',     requireAuth, wardrobeController.getRecentItems);

export default router;
