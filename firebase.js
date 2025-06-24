// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCP5b79deprozO7qFKV3OxDCjutFrVrNxM",
  authDomain: "jntims-a26ba.firebaseapp.com",
  projectId: "jntims-a26ba",
  storageBucket: "jntims-a26ba.firebasestorage.app",
  messagingSenderId: "467575536534",
  appId: "1:467575536534:web:a19a547f8b21e5cadb3bb7",
  measurementId: "G-K8DW1V494E"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);

export { db };