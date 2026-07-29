import { Router } from 'express';
import { AuthController } from './auth.controller';
import { requireAuth } from '../../middlewares/auth.middleware';

const router = Router();

// Rutas públicas
router.post('/login', AuthController.login);
router.post('/refresh', AuthController.refresh);
router.post('/logout', AuthController.logout);

// Ruta protegida de prueba (Obtener perfil propio)
router.get('/me', requireAuth, (req, res) => {
  res.json({
    ok: true,
    data: { usuario: req.user },
  });
});

export default router;