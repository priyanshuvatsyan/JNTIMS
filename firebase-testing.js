// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAfx8IvwPVOD54_d5ButBTI7a3JrBTu-_U",
  authDomain: "jntims-testing.firebaseapp.com",
  projectId: "jntims-testing",
  storageBucket: "jntims-testing.firebasestorage.app",
  messagingSenderId: "492015882659",
  appId: "1:492015882659:web:f0ce7f0a4fd3d3a3e20a16",
  measurementId: "G-K5FW34Y9C4"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);