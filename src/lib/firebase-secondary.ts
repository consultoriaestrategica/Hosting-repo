// src/lib/firebase-secondary.ts

import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app"
import { getAuth } from "firebase/auth"

// ✅ Usamos la MISMA configuración que la app principal,
// pero inicializando una app secundaria llamada "secondary"
const firebaseSecondaryConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
}

let secondaryApp: FirebaseApp

// Si ya existe una app llamada "secondary", la reutilizamos.
// Si no, la creamos.
const existingSecondary = getApps().find((app) => app.name === "secondary")

if (existingSecondary) {
  secondaryApp = existingSecondary
} else {
  secondaryApp = initializeApp(firebaseSecondaryConfig, "secondary")
}

// 🔹 Este es el auth que usaremos SOLO para crear usuarios desde el panel
//    sin tocar la sesión del admin
export const authSecondary = getAuth(secondaryApp)
