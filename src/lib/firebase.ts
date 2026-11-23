// Importa las funciones que necesitas del SDK de Firebase
import { initializeApp, getApp, getApps } from "firebase/app";
import {
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  type Firestore,
} from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth } from "firebase/auth";

// ------------------------------------------------------------
// 🔥 Configuración de Firebase (exportada correctamente)
// ------------------------------------------------------------
export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// ------------------------------------------------------------
// 🚀 Inicializa Firebase evitando múltiples inicializaciones
// ------------------------------------------------------------
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// ------------------------------------------------------------
// 📦 Servicios exportados para uso global
// ------------------------------------------------------------

// Cache local persistente (IndexedDB) con soporte multi-pestaña: las
// escrituras (registros, borradores) quedan en cola localmente sin
// conexión y se sincronizan solas al volver — necesario para que
// withTimeout() en new-log-form.tsx no trate un guardado offline como
// un error real. Solo aplica en el navegador: en el servidor
// (build/SSR) no hay IndexedDB, y initializeFirestore() con
// localCache ahí fallaría. Si el propio navegador no soporta el cache
// persistente (ej. Safari en modo privado, o ya hay otra pestaña con
// un cache incompatible abierto) o si Firestore ya fue inicializado
// para esta app por este mismo código corriendo dos veces (Fast
// Refresh en desarrollo), se cae de vuelta a getFirestore() normal
// (memoria, sin persistencia) en vez de romper la carga de la app.
function createFirestore(): Firestore {
  if (typeof window === "undefined") {
    return getFirestore(app);
  }
  try {
    return initializeFirestore(app, {
      localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
    });
  } catch (error) {
    console.error("No se pudo activar el cache local persistente de Firestore, usando el de memoria:", error);
    return getFirestore(app);
  }
}

export const db = createFirestore();
export const storage = getStorage(app);
export const auth = getAuth(app);

export { app };
