import { Router } from 'express';
import { getMyNotifications, markAllNotificationsRead, clearMyNotifications } from '../controllers/notificationController';
import { checkJwt } from '../middleware/auth';

const router = Router();

router.get('/', checkJwt, getMyNotifications);
router.patch('/mark-all-read', checkJwt, markAllNotificationsRead);
router.delete('/', checkJwt, clearMyNotifications);

export default router;
