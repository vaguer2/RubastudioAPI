import { Request, Response } from 'express';
import { loginSchema } from './auth.schema';
import { AuthService } from './auth.service';
import { registerLoginWithGeo } from './moshup.service'; // 👈 LÍNEA NUEVA

export class AuthController {
  
  static async login(req: Request, res: Response): Promise<void> {
    try {
      // 1. Validar Body con Zod
      const validation = loginSchema.safeParse(req.body);
      
      if (!validation.success) {
        res.status(400).json({
          ok: false,
          message: 'Datos de entrada inválidos.',
          errors: validation.error.flatten().fieldErrors,
        });
        return;
      }

      // 2. Iniciar sesión
      const result = await AuthService.login(validation.data);

      // 👇 BLOQUE NUEVO: Integración Mashup — API propia (Firestore) + API externa (geolocalización)
      // Se aísla en su propio try/catch para que un fallo del servicio externo
      // no tumbe el login (el login es lo crítico, la geolocalización es un extra).
      let geo = null;
      try {
        const ip = (req.headers["x-forwarded-for"] as string) || req.socket.remoteAddress || "";
        geo = await registerLoginWithGeo(result.usuario.uid, ip);
      } catch (geoError) {
        console.warn("No se pudo registrar geolocalización:", geoError);
      }
      // 👆 FIN BLOQUE NUEVO

      // 3. Inyectar Refresh Token en Cookie httpOnly (Seguro contra XSS)
      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true, // No accesible mediante JavaScript en navegador
        secure: process.env.NODE_ENV === 'production', // Requiere HTTPS en prod
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 días en milisegundos
      });

      // 4. Responder con Access Token en payload JSON
      res.status(200).json({
        ok: true,
        message: 'Autenticación exitosa.',
        data: {
          accessToken: result.accessToken,
          usuario: result.usuario,
          geo, // 👈 CAMPO NUEVO: evidencia visible de la integración Mashup
        },
      });
    } catch (error: any) {
      res.status(401).json({
        ok: false,
        message: error.message || 'Error de autenticación.',
      });
    }
  }

  static async refresh(req: Request, res: Response): Promise<void> {
    try {
      const refreshToken = req.cookies.refreshToken;

      if (!refreshToken) {
        res.status(401).json({ ok: false, message: 'Refresh token no proporcionado.' });
        return;
      }

      const result = await AuthService.refreshSession(refreshToken);

      res.status(200).json({
        ok: true,
        data: { accessToken: result.accessToken },
      });
    } catch (error: any) {
      res.status(401).json({ ok: false, message: error.message || 'Sesión expirada.' });
    }
  }

  static async logout(req: Request, res: Response): Promise<void> {
    try {
      const refreshToken = req.cookies.refreshToken;
      if (refreshToken) {
        await AuthService.logout(refreshToken);
      }

      // Limpiar la cookie en el navegador
      res.clearCookie('refreshToken');

      res.status(200).json({
        ok: true,
        message: 'Sesión cerrada correctamente.',
      });
    } catch (error: any) {
      res.status(500).json({ ok: false, message: 'Error al cerrar sesión.' });
    }
  }
}