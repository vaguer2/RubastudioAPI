import { db } from "../../config/firebase";

interface GeoInfo {
  ip: string;
  country: string | null;
  city: string | null;
}

/**
 * Consulta la API externa de geolocalización (ipapi.co)
 * No requiere API key para uso básico/gratuito.
 */
async function fetchGeoInfo(ip: string): Promise<GeoInfo> {
  const targetIp = ip === "::1" || ip === "127.0.0.1" ? "" : ip;
  const url = `http://ip-api.com/json/${targetIp}`;

  const res = await fetch(url);
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`ip-api.com respondió ${res.status} ${res.statusText}: ${body}`);
  }
  const data = await res.json();

  if (data.status === "fail") {
    throw new Error(`ip-api.com no pudo geolocalizar: ${data.message}`);
  }

  return {
    ip: data.query ?? ip,
    country: data.country ?? null,
    city: data.city ?? null,
  };
}

/**
 * Orquesta la integración Mashup: llama a la API externa (geolocalización)
 * y guarda el resultado en la fuente propia (Firestore), en paralelo.
 */
export async function registerLoginWithGeo(uid: string, ip: string) {
  const [geo] = await Promise.all([
    fetchGeoInfo(ip),
    db.collection("sesiones").doc(uid).set(
      { ultimaConexion: new Date().toISOString() },
      { merge: true }
    ),
  ]);

  await db.collection("sesiones").doc(uid).update({ geo });
  return geo;
}