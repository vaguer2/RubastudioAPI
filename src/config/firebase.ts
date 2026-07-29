import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import dotenv from "dotenv"; //para usar las variables de entorno

dotenv.config(); ///y aui llamo la configuracion

// Reemplazar los caracteres '\\n' que dotenv carga como texto literal por saltos de línea reales
const privateKey = process.env.FIREBASE_PRIVATE_KEY
  ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n")
  : undefined; //si no encuentra la llave me pasa indefinied y me quita los saltos de linea

// Prevenir la inicialización múltiple de la app de Firebase en modo de desarrollo
if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL, //CHECAR ACA SI HAY ERRRRROOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOoo
      privateKey: privateKey,
    }),
  });
}

// Exportar la instancia de Firestore requerida en tus servicios
export const db = getFirestore();

// Exportar la instancia de Firebase Auth Admin (opcional pero muy útil para auth)
export const auth = getAuth();
