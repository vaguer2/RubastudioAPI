import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, TokenPayload } from '../utils/jwt';

// Extender la interfaz Request de Express para adjuntar el usuario autenticado
declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      ok: false,
      message: 'Acceso no autorizado. Token no proporcionado.',
    });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    // Verificar firma con la Clave Pública
    const decoded = verifyAccessToken(token);
    req.user = decoded; // Adjuntar payload al objeto req
    next(); // Dar paso al controlador
  } catch (error: any) {
    res.status(401).json({
      ok: false,
      message: 'Token inválido o expirado.',
      error: error.message,
    });
  }
}