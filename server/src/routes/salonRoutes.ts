import { Router } from 'express';
import { getSalons, getSalonById, getSalonServices } from '../controllers/salonController';

const router = Router();

router.get('/', getSalons);
router.get('/:id', getSalonById);
router.get('/:id/services', getSalonServices);

export default router;
