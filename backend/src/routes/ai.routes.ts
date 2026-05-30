import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';
import * as aiController from '../controllers/ai.controller';

const router = Router();

const analyzeSchema = z.object({
  image_url:        z.string().url().optional(),
  description:      z.string().min(1).max(2000).optional(),
  include_wardrobe: z.boolean().default(true),
}).refine(d => d.image_url || d.description, {
  message: 'Provide either image_url or description',
});

const tradeInsightSchema = z.object({
  wanted_item: z.object({
    name:     z.string().min(1),
    category: z.string().min(1),
    brand:    z.string().optional(),
    tag:      z.string().optional(),
  }),
  offered_item: z.object({
    name:     z.string().min(1),
    category: z.string().min(1),
    brand:    z.string().optional(),
    wears:    z.number().optional(),
    tag:      z.string().optional(),
  }),
});

const chatSchema = z.object({
  message: z.string().min(1).max(2000),
  history: z.array(z.object({
    role:    z.enum(['user', 'assistant']),
    content: z.string(),
  })).max(10).optional(),
});

// GET  /api/ai/health
// Tests the GitHub AI connection — no auth required
router.get('/health', aiController.healthCheck);

// POST /api/ai/analyze
// Sustainable Fashion Visual Analyzer — image or text description
// Returns structured analysis: garment type, durability, style, wardrobe similarity
router.post('/analyze', requireAuth, validate(analyzeSchema), aiController.analyzeGarment);

// POST /api/ai/trade-insight
// AI verdict on a proposed swap: verdict, rationale, sustainability, style tip, score impact
router.post('/trade-insight', requireAuth, validate(tradeInsightSchema), aiController.tradeInsight);

// GET  /api/ai/wardrobe-insights
// 3 AI-generated data-driven insights about the user's wardrobe
router.get('/wardrobe-insights', requireAuth, aiController.wardrobeInsights);

// POST /api/ai/chat
// Conversational style advisor using the Visual Analyzer persona
router.post('/chat', requireAuth, validate(chatSchema), aiController.chat);

export default router;
