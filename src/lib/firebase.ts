
import { initializeApp, getApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  "projectId": "guardian-angel-nrxl7",
  "appId": "1:73738940188:web:36773849d02a3313a1d4d9",
  "storageBucket": "guardian-angel-nrxl7.firebasestorage.app",
  "apiKey": "AIzaSyAng1ku3yKFwrxNcW5MmCiIlE5oYiitKok",
  "authDomain": "guardian-angel-nrxl7.firebaseapp.com",
  "measurementId": "G-G32P7H7HSB",
  "messagingSenderId": "73738940188"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);
const storage = getStorage(app);
const auth = getAuth(app);

export { app, db, storage, auth };
