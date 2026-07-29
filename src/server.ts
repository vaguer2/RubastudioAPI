import express, { Request, Response } from "express";
import cookieParser from "cookie-parser"; // Para que se conserve información importante de la sesión
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./modules/auth/auth.routes"; // Especificamos las rutas que vamos a usar

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// Middlewares Globales
app.use(express.json());
app.use(cookieParser()); // Permite a Express leer req.cookies
app.use(cors()); // Permite peticiones desde el frontend o clientes externos

// Ruta raíz (para evitar el "Cannot GET /" en el navegador)
app.get("/", (_req: Request, res: Response) => {
  res.status(200).send("🚀 API Ruba Studio funcionando correctamente en la nube");
});

// Healthcheck
app.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({ ok: true, mensaje: "API Ruba Studio activa" });
});

// Rutas de la API
app.use("/api/v1/auth", authRoutes);

app.listen(PORT, () => {
  console.log(`Servidor ejecutándose en el puerto ${PORT}`);
});