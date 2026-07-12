import { Router } from 'express';
import { getHealth } from '../controllers/health.controller.js';

// Routes stay thin: they only map paths/methods to controller
// functions. Logic belongs in controllers, never here.
const router = Router();

router.get('/', getHealth);

export default router;
