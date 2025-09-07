import { Router } from 'express';
import { getToken, postLivekitToken } from '../controllers/tokenController';
import { tokenRateLimiter } from '../middlewares/rateLimiter';

const router = Router();

// Existing GET endpoint
router.get('/getToken', tokenRateLimiter, getToken);

// Compatibility POST endpoint for frontend
router.post('/livekit/token', tokenRateLimiter, postLivekitToken);

export default router;
