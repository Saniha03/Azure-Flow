import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAr8OKo0WigKTZlThTIYlG7fklx8woPr1Q",
  authDomain: "azureflow-38b47.firebaseapp.com",
  projectId: "azureflow-38b47",
  storageBucket: "azureflow-38b47.firebasestorage.app",
  messagingSenderId: "400537942761",
  appId: "1:400537942761:web:f8a5261e8647cce170ce78",
  measurementId: "G-DT6TWGZ7QE",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };
