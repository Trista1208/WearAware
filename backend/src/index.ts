import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';

import authRoutes         from './routes/auth.routes';
import userRoutes         from './routes/users.routes';
import wardrobeRoutes     from './routes/wardrobe.routes';
import sustainabilityRoutes from './routes/sustainability.routes';
import matchingRoutes     from './routes/matching.routes';
import storeRoutes        from './routes/stores.routes';
import analyticsRoutes    from './routes/analytics.routes';
import aiRoutes           from './routes/ai.routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// ─── Global middleware ─────────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ─── Health check ──────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', version: '1.0.0', timestamp: new Date().toISOString() });
});

// ─── API routes ────────────────────────────────────────────────────────────────
app.use('/api/auth',           authRoutes);
app.use('/api/users',          userRoutes);
app.use('/api/wardrobe',       wardrobeRoutes);
app.use('/api/sustainability', sustainabilityRoutes);
app.use('/api/matching',       matchingRoutes);
app.use('/api/stores',         storeRoutes);
app.use('/api/analytics',      analyticsRoutes);
app.use('/api/ai',             aiRoutes);

// ─── 404 handler ──────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ success: false, error: 'Route not found' });
});

// ─── Global error handler ─────────────────────────────────────────────────────
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ success: false, error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`WearAware API running on http://localhost:${PORT}`);
});

export default app;
