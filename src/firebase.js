// src/firebase.js
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: "hostel-outing-1.firebaseapp.com",
  databaseURL: "https://hostel-outing-1-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "hostel-outing-1",
  storageBucket: "hostel-outing-1.firebasestorage.app",
  messagingSenderId: "33157774452",
  appId: "1:33157774452:web:a2a8f3177ec981f8292521",
  measurementId: "G-FNZN9GGHKS"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;
