import { getAuth } from "firebase/auth";
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";
import { app } from "../config/firebase"; // Make sure to import your Firebase app instance

// Initialize Firestore
const db = getFirestore(app);
const auth = getAuth(app);

export const createUserProfile = async (user, role = 'user') => {
  const userRef = doc(db, 'users', user.uid);
  
  try {
    const docSnap = await getDoc(userRef);
    
    if (!docSnap.exists()) {
      // Create new user document in Firestore
      await setDoc(userRef, {
        email: user.email,
        role: role,
        createdAt: new Date().toISOString(),
        displayName: user.displayName || '',
        photoURL: user.photoURL || '',
        lastLogin: new Date().toISOString()
      });
      return role;
    }
    
    // Update last login time for existing users
    await setDoc(userRef, {
      lastLogin: new Date().toISOString()
    }, { merge: true });
    
    return docSnap.data().role;
  } catch (error) {
    console.error("Error creating/updating user profile:", error);
    return role;
  }
};

export const getUserRole = async (uid) => {
  if (!uid) return null;
  
  const userRef = doc(db, 'users', uid);
  
  try {
    const docSnap = await getDoc(userRef);
    if (docSnap.exists()) {
      return docSnap.data().role;
    }
    return 'user'; // default role if no document exists
  } catch (error) {
    console.error("Error fetching user role:", error);
    return 'user';
  }
};

// Add this new function to check if user exists
export const checkUserExists = async (uid) => {
  const userRef = doc(db, 'users', uid);
  const docSnap = await getDoc(userRef);
  return docSnap.exists();
};