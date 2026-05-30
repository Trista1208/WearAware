import { Router } from 'express';
import { 
    uploadClothingItem, 
    getWardrobeItems,
    logDailyWear,
    executeTrade
} from '../controllers/wardrobe.controller';

const router = Router();

// Your existing routes
router.post('/upload', uploadClothingItem);
router.get('/items', getWardrobeItems);

// The NEW Gamification Routes
router.post('/track', logDailyWear);
router.post('/trade', executeTrade);

export default router;