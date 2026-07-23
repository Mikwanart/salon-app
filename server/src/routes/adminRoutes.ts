import { Router } from 'express';
import {
  getAdminStats,
  getAdminSalons,
  updateSalonStatus,
  getAdminUsers,
  updateUserRole,
  getAdminAppointments,
} from '../controllers/adminController';
import { checkJwt, requireAdmin } from '../middleware/auth';

const router = Router();

// Protect all admin routes with JWT check + Admin permission check
router.use(checkJwt, requireAdmin);

router.get('/stats', getAdminStats);
router.get('/salons', getAdminSalons);
router.patch('/salons/:id/status', updateSalonStatus);
router.get('/users', getAdminUsers);
router.patch('/users/:id/role', updateUserRole);
router.get('/appointments', getAdminAppointments);

export default router;
