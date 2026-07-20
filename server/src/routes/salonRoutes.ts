import { Router } from 'express';
import {
  getSalons,
  getSalonById,
  getSalonServices,
  getSalonOwnerSalon,
  getSalonOwnerAppointments,
} from '../controllers/salonController';
import { checkJwt } from '../middleware/auth';

const router = Router();

// Public routes
router.get('/', getSalons);

// Owner routes — MUST be before /:id to avoid 'mine' being treated as an ID
router.get('/mine', checkJwt, getSalonOwnerSalon);
router.get('/mine/appointments', checkJwt, getSalonOwnerAppointments);

// Parameterised routes
router.get('/:id', getSalonById);
router.get('/:id/services', getSalonServices);

export default router;
