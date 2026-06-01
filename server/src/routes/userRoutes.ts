import { Router } from 'express';
import { syncUser, getMyProfile } from '../controllers/userController';
import { checkJwt } from '../middleware/auth';

const router = Router();

router.post('/sync', checkJwt, syncUser);
router.get('/me', checkJwt, getMyProfile);

export default router;
