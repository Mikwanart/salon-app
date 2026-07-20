import { Router } from 'express';
import {
  getSalons,
  getSalonById,
  getSalonServices,
  getSalonOwnerSalon,
  getSalonOwnerAppointments,
  updateSalonOwnerSalon,
  createSalonService,
  updateSalonService,
  deleteSalonService,
  createSalonStylist,
  updateSalonStylist,
  deleteSalonStylist,
} from '../controllers/salonController';
import { checkJwt } from '../middleware/auth';

const router = Router();

// Public routes
router.get('/', getSalons);

// Owner routes — MUST be before /:id to avoid 'mine' being treated as an ID
router.get('/mine', checkJwt, getSalonOwnerSalon);
router.put('/mine', checkJwt, updateSalonOwnerSalon);
router.get('/mine/appointments', checkJwt, getSalonOwnerAppointments);

// Owner service routes
router.post('/mine/services', checkJwt, createSalonService);
router.put('/mine/services/:id', checkJwt, updateSalonService);
router.delete('/mine/services/:id', checkJwt, deleteSalonService);

// Owner stylist routes
router.post('/mine/stylists', checkJwt, createSalonStylist);
router.put('/mine/stylists/:id', checkJwt, updateSalonStylist);
router.delete('/mine/stylists/:id', checkJwt, deleteSalonStylist);

// Parameterised routes
router.get('/:id', getSalonById);
router.get('/:id/services', getSalonServices);

export default router;
