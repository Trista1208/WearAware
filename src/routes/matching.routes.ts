import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';
import * as ctrl from '../controllers/matching.controller';

const router = Router();

const addRtpwSchema = z.object({
  item_id:    z.string().uuid(),
  preference: z.array(z.enum(['swap','donate','sell'])).default(['swap']),
  notes:      z.string().max(500).optional(),
});

const wantedItemSchema = z.object({
  category:          z.enum(['tops','bottoms','dresses','outerwear','footwear','accessories','underwear','sportswear','formalwear','other']).optional(),
  description:       z.string().min(5).max(500),
  preferred_brands:  z.array(z.string().max(100)).default([]),
  preferred_colors:  z.array(z.string().max(50)).default([]),
  size_notes:        z.string().max(200).optional(),
});

// ─── Ready to part with ───────────────────────────────────────────────────────
// GET    /api/matching/rtpw             – my RTPW list
router.get('/rtpw',              requireAuth, ctrl.listMyRtpw);

// POST   /api/matching/rtpw             – add item to RTPW
router.post('/rtpw',             requireAuth, validate(addRtpwSchema), ctrl.addToRtpw);

// DELETE /api/matching/rtpw/:id         – remove from RTPW
router.delete('/rtpw/:id',       requireAuth, ctrl.removeFromRtpw);

// GET    /api/matching/rtpw/all         – all unmatched RTPW (public, for browsing)
router.get('/rtpw/all',          ctrl.listAllRtpw);

// ─── Wanted items ─────────────────────────────────────────────────────────────
// GET    /api/matching/wanted           – my wanted list
router.get('/wanted',            requireAuth, ctrl.listMyWanted);

// POST   /api/matching/wanted           – add wanted item
router.post('/wanted',           requireAuth, validate(wantedItemSchema), ctrl.addWanted);

// DELETE /api/matching/wanted/:id       – remove wanted item
router.delete('/wanted/:id',     requireAuth, ctrl.removeWanted);

// ─── Matching engine ──────────────────────────────────────────────────────────
// POST   /api/matching/search/:wanted_id  – find RTPW candidates for a wanted item
router.post('/search/:wanted_id', requireAuth, ctrl.searchMatches);

// POST   /api/matching/propose          – create a match proposal
router.post('/propose',          requireAuth, validate(z.object({
  rtpw_id:           z.string().uuid(),
  wanted_item_id:    z.string().uuid().optional(),
  receiving_user_id: z.string().uuid(),
  match_score:       z.number().min(0).max(100).default(0),
})), ctrl.proposeMatch);

// ─── Match management ─────────────────────────────────────────────────────────
// GET    /api/matching/matches          – my pending/active matches
router.get('/matches',           requireAuth, ctrl.listMyMatches);

// POST   /api/matching/matches/:id/accept  – accept a match
router.post('/matches/:id/accept', requireAuth, ctrl.acceptMatch);

// POST   /api/matching/matches/:id/reject  – reject a match
router.post('/matches/:id/reject', requireAuth, ctrl.rejectMatch);

export default router;
