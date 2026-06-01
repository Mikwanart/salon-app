import { Router } from 'express';
import { createReview } from '../controllers/reviewController';
import { checkJwt } from '../middleware/auth';

const router = Router();

// Protect review creation with Auth0 JWT bearer checks
router.post('/', checkJwt, createReview);

export default router;
