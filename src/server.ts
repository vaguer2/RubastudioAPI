import express, { Request, Response } from "express";
import cookieParser from "cookie-parser"; //para que se conserve informacin importante de la sesion
import dotenv from "dotenv";
import authRoutes from "./modules/auth/auth.routes"; //especificamos las tutas que vamos a usar

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// Middlewares Globales
app.use(express.json());
app.use(cookieParser()); // Permite a Express leer req.cookies

// Rutas de la API
app.use("/api/v1/auth", authRoutes);

// Healthcheck
app.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({ ok: true, mensaje: "API Ruba Studio activa" });
});

app.listen(PORT, () => {
  console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
});

/*

//para instalar los comandos necesarios correremos lo siguiente:

npm install -D typescript tsx @types/express
npm install express dotenv



//mas librerias (despues del paso de haber hecho las private key en api y todo generalmente en API):

npm install jsonwebtoken cookie-parser zod firebase-admin
npm install -D @types/jsonwebtoken @types/cookie-parser


*/
