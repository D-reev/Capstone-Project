import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCkQ1fVo84cGnnm2tHq9H35BS2kRZ2RTB0",
  authDomain: "motohub-d9e1a.firebaseapp.com",
  projectId: "motohub-d9e1a",
  storageBucket: "motohub-d9e1a.firebasestorage.app",
  messagingSenderId: "3124805516",
  appId: "1:3124805516:web:8755b82a6c176661bbe0a9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };