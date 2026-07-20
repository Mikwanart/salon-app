import { Router } from 'express';
import { createAppointment, getMyAppointments, updateAppointment, verifyPaymentStatus, getBookedSlots } from '../controllers/appointmentController';
import { checkJwt } from '../middleware/auth';

const router = Router();

// Public endpoint — no auth needed, used by booking page to prevent double-bookings
router.get('/booked-slots', getBookedSlots);

// All appointment routes should be protected
router.post('/', checkJwt, createAppointment);
router.get('/me', checkJwt, getMyAppointments);
router.patch('/:id', checkJwt, updateAppointment);
router.get('/:id/verify-payment', checkJwt, verifyPaymentStatus);

export default router;
