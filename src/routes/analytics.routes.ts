import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import * as ctrl from '../controllers/analytics.controller';

const router = Router();

// GET /api/analytics/wardrobe      – full wardrobe stats (charts data)
router.get('/wardrobe',    requireAuth, ctrl.wardrobeStats);

// GET /api/analytics/score-trend   – sustainability score over time
router.get('/score-trend', requireAuth, ctrl.scoreTrend);

// GET /api/analytics/insights      – AI-driven sustainability insights & recommendations
router.get('/insights',    requireAuth, ctrl.insights);

// GET /api/analytics/summary       – combined single-call summary (for dashboard)
router.get('/summary',     requireAuth, ctrl.dashboardSummary);

export default router;
