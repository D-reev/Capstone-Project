// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
export const firebaseConfig = {
  apiKey: "AIzaSyCkQ1fVo84cGnnm2tHq9H35BS2kRZ2RTB0",
  authDomain: "motohub-d9e1a.firebaseapp.com",
  databaseURL: "https://motohub-d9e1a-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "motohub-d9e1a",
  storageBucket: "motohub-d9e1a.firebasestorage.app",
  messagingSenderId: "3124805516",
  appId: "1:3124805516:web:8755b82a6c176661bbe0a9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);