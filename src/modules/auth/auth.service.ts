import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../../utils/jwt";
// Asumimos inicialización previa de Firebase Admin
import { db } from "../../config/firebase";
import { LoginInput } from "./auth.schema";

export class AuthService {
  /**
   * Proceso de Autenticación de Usuario
   */
  static async login(credentials: LoginInput) {
    const { email, password } = credentials;

    /* 
      1. En un entorno real con Firebase REST API / Identity Toolkit API,
      verificamos email y password contra Firebase Auth.
      Por simplicidad docente, buscamos el usuario en la colección /usuarios
    */
    const userSnapshot = await db
      .collection("usuarios") //aca debo cambiar para marcar a que base de datos estoy apuntando
      .where("email", "==", email)
      .limit(1)
      .get();

    if (userSnapshot.empty) {
      throw new Error("Credenciales inválidas.");
    }

    const userDoc = userSnapshot.docs[0];
    const userData = userDoc.data();

    // 2. Verificar estado activo del perfil
    if (!userData.activo) {
      throw new Error("El usuario se encuentra inactivo en el sistema.");
    }

    const uid = userDoc.id;
    const rol = userData.rol || "inquilino";

    // 3. Generar par de tokens (Access Token + Refresh Token)
    const accessToken = signAccessToken({ uid, email, rol });
    const refreshToken = signRefreshToken({ uid });

    // 4. Registrar el Refresh Token en Firestore para control y revocación
    await db.collection("refreshTokens").add({
      uid,
      token: refreshToken,
      creadoEn: new Date().toISOString(),
      revocado: false,
    });

    return {
      accessToken,
      refreshToken,
      usuario: {
        uid,
        email,
        nombre: userData.nombre,
        rol,
      },
    };
  }

  /**
   * Renovación de Access Token mediante Refresh Token
   */
  static async refreshSession(token: string) {
    // 1. Verificar firma RS256 del token
    const decoded = verifyRefreshToken(token);

    // 2. Verificar que el token existe en Firestore y no está revocado
    const tokenQuery = await db
      .collection("refreshTokens")
      .where("token", "==", token)
      .where("revocado", "==", false)
      .limit(1)
      .get();

    if (tokenQuery.empty) {
      throw new Error("Refresh token inválido o revocado.");
    }

    // 3. Leer datos actualizados del usuario
    const userDoc = await db.collection("usuarios").doc(decoded.uid).get();
    if (!userDoc.exists) {
      throw new Error("Usuario no encontrado.");
    }

    const userData = userDoc.data()!;

    // 4. Emitir nuevo Access Token
    const newAccessToken = signAccessToken({
      uid: userDoc.id,
      email: userData.email,
      rol: userData.rol,
    });

    return { accessToken: newAccessToken };
  }

  /**
   * Invalidador de Sesión (Logout)
   */
  static async logout(refreshToken: string) {
    const tokenQuery = await db
      .collection("refreshTokens")
      .where("token", "==", refreshToken)
      .get();

    const batch = db.batch();
    tokenQuery.docs.forEach((doc) => {
      batch.update(doc.ref, { revocado: true });
    });

    await batch.commit();
  }
}
