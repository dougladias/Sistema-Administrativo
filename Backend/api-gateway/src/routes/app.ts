import { Router } from 'express';
import authRoutes from './auth.routes';
import workerRoutes from './worker.routes';


const router = Router();

router.use('/auth', authRoutes);
router.use('/workers', workerRoutes);


export default router;