import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';
import * as ctrl from '../controllers/sustainability.controller';

const router = Router();

const purchaseAdviceSchema = z.object({
  item_description: z.string().max(1000).optional(),
  image_url:        z.string().url().optional(),
  brand:            z.string().max(100).optional(),
  material:         z.enum(['cotton','wool','silk','linen','polyester','nylon','acrylic','viscose','denim','leather','synthetic_blend','natural_blend','other']).optional(),
  is_second_hand:   z.boolean().default(false),
  is_local_brand:   z.boolean().default(false),
}).refine(d => d.item_description || d.image_url, {
  message: 'Provide either item_description or image_url',
});

const recordDecisionSchema = z.object({
  advice_log_id: z.string().uuid(),
  decision:      z.enum(['purchased', 'skipped']),
});

// GET  /api/sustainability/score              – current score + grade
router.get('/score',           requireAuth, ctrl.getScore);

// GET  /api/sustainability/breakdown          – full transparent score breakdown
router.get('/breakdown',       requireAuth, ctrl.getBreakdown);

// GET  /api/sustainability/history            – event log
router.get('/history',         requireAuth, ctrl.getHistory);

// GET  /api/sustainability/fast-fashion-brands – list of all known FF brands
router.get('/fast-fashion-brands', ctrl.getFastFashionBrands);

// POST /api/sustainability/compute            – (re)compute score from wardrobe
router.post('/compute',        requireAuth, ctrl.computeScore);

// POST /api/sustainability/advice             – evaluate a potential purchase
router.post('/advice',         requireAuth, validate(purchaseAdviceSchema), ctrl.getPurchaseAdvice);

// POST /api/sustainability/decision           – record what the user actually did
router.post('/decision',       requireAuth, validate(recordDecisionSchema), ctrl.recordPurchaseDecision);

export default router;
