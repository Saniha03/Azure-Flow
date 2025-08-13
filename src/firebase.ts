import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyAr8OKo0WigKTZlThTIYlG7fklx8woPr1Q",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "azureflow-38b47.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "azureflow-38b47",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "azureflow-38b47.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "400537942761",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:400537942761:web:f8a5261e8647cce170ce78",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-DT6TWGZ7QE",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };
