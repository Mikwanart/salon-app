import { Router } from 'express';
import { createAppointment, getMyAppointments, updateAppointment } from '../controllers/appointmentController';
import { checkJwt } from '../middleware/auth';

const router = Router();

// All appointment routes should be protected
router.post('/', checkJwt, createAppointment);
router.get('/me', checkJwt, getMyAppointments);
router.patch('/:id', checkJwt, updateAppointment);

export default router;
