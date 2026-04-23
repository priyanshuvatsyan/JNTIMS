// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";

import { getFirestore } from "firebase/firestore";
import { testing } from "./global_properties.js";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
let firebaseConfig;

if (testing){

  firebaseConfig = {
  apiKey: "AIzaSyAfx8IvwPVOD54_d5ButBTI7a3JrBTu-_U",
  authDomain: "jntims-testing.firebaseapp.com",
  projectId: "jntims-testing",
  storageBucket: "jntims-testing.firebasestorage.app",
  messagingSenderId: "492015882659",
  appId: "1:492015882659:web:f0ce7f0a4fd3d3a3e20a16",
  measurementId: "G-K5FW34Y9C4"
};

}
  
else{

firebaseConfig = {
  apiKey: "AIzaSyCP5b79deprozO7qFKV3OxDCjutFrVrNxM",
  authDomain: "jntims-a26ba.firebaseapp.com",
  projectId: "jntims-a26ba",
  storageBucket: "jntims-a26ba.firebasestorage.app",
  messagingSenderId: "467575536534",
  appId: "1:467575536534:web:a19a547f8b21e5cadb3bb7",
  measurementId: "G-K8DW1V494E"
};
}
// Initialize Firebase
const app = initializeApp(firebaseConfig);

const db = getFirestore(app);

export { db };