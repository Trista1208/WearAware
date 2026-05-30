import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';
import * as ctrl from '../controllers/stores.controller';

const router = Router();

const donationSchema = z.object({
  store_id:     z.string().uuid(),
  item_id:      z.string().uuid(),
  listed_price: z.number().min(0).optional(),
});

const updateDonationSchema = z.object({
  status:       z.enum(['pending','received','listed','sold','unsold']),
  sold_price:   z.number().min(0).optional(),
  listed_price: z.number().min(0).optional(),
});

const storesQuerySchema = z.object({
  city:    z.string().optional(),
  country: z.string().optional(),
  limit:   z.coerce.number().int().min(1).max(50).default(20),
  offset:  z.coerce.number().int().min(0).default(0),
});

// GET  /api/stores                   – list partner stores (near user)
router.get('/',                requireAuth, validate(storesQuerySchema, 'query'), ctrl.listStores);

// GET  /api/stores/:id               – store detail
router.get('/:id',             ctrl.getStore);

// POST /api/stores/donate            – create donation
router.post('/donate',         requireAuth, validate(donationSchema), ctrl.createDonation);

// GET  /api/stores/donations/mine    – my donation history
router.get('/donations/mine',  requireAuth, ctrl.myDonations);

// PATCH /api/stores/donations/:id    – update donation status (store staff or service role)
router.patch('/donations/:id', requireAuth, validate(updateDonationSchema), ctrl.updateDonation);

export default router;
