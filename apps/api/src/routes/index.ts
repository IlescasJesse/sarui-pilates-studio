import { Router } from 'express';
import authRoutes from './auth.routes';
import clientesRoutes from './clientes.routes';
import paquetesRoutes from './paquetes.routes';
import membresiasRoutes from './membresias.routes';
import clasesRoutes from './clases.routes';
import reservacionesRoutes from './reservaciones.routes';
import instructoresRoutes from './instructores.routes';
import kioskRoutes from './kiosk.routes';
import dashboardRoutes from './dashboard.routes';
import tipoActividadesRoutes from './tipo-actividades.routes';
import tipoMembresiasRoutes from './tipo-membresias.routes';
import portalRoutes from './portal.routes';
import webhookRoutes from './webhook.routes';

const router = Router();

// Public routes (no auth)
router.use('/auth', authRoutes);
router.use('/kiosk', kioskRoutes);
router.use('/portal/webhook', webhookRoutes);
router.use('/portal', portalRoutes);

// Protected routes
router.use('/clientes', clientesRoutes);
router.use('/paquetes', paquetesRoutes);
router.use('/tipo-actividades', tipoActividadesRoutes);
router.use('/tipo-membresias', tipoMembresiasRoutes);
router.use('/membresias', membresiasRoutes);
router.use('/clases', clasesRoutes);
router.use('/reservaciones', reservacionesRoutes);
router.use('/instructores', instructoresRoutes);
router.use('/dashboard', dashboardRoutes);

export default router;
