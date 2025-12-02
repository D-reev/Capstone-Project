import { 
  getFirestore, 
  collection, 
  addDoc, 
  doc, 
  getDoc, 
  updateDoc,
  getDocs,
  setDoc,
  deleteDoc
} from 'firebase/firestore';
import { getAuth, createUserWithEmailAndPassword, updateProfile, 
  sendPasswordResetEmail,
  verifyPasswordResetCode,
  confirmPasswordReset,
  signOut as firebaseSignOut 
} from 'firebase/auth';
import { app } from '../config/firebase';

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
    
    // Update last login time and photoURL for existing users (Google photoURL can change)
    await setDoc(userRef, {
      lastLogin: new Date().toISOString(),
      photoURL: user.photoURL || docSnap.data().photoURL || '',
      displayName: user.displayName || docSnap.data().displayName || ''
    }, { merge: true });
    
    return docSnap.data().role;
  } catch (error) {
    console.error("Error creating/updating user profile:", error);
    return role;
  }
};

export const createCarModel = async (userId, carData) => {
  if (!userId) return null;
  
  try {
    // Create a reference to the cars collection
    const carsCollectionRef = collection(db, 'users', userId, 'cars');
    
    // Create a new document with auto-generated ID
    const newCarRef = doc(carsCollectionRef);
    
    // Add the car data with the auto-generated ID
    await setDoc(newCarRef, {   
      ...carData,
      id: newCarRef.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastService: 'Not serviced yet',
      nextService: 'Not scheduled',
      serviceDue: 'Not set',
      serviceHistory: []
    });

    return newCarRef.id;
  } catch (error) {
    console.error("Error creating car model:", error);
    return null;
  }
};

export const getUserCars = async (userId) => {
  if (!userId) return [];
  
  try {
    const carsRef = collection(db, 'users', userId, 'cars');
    const querySnapshot = await getDocs(carsRef);
    console.debug('getUserCars: fetched', querySnapshot.size, 'car documents for user', userId);
    const cars = querySnapshot.docs.map(d => ({
      id: d.id,
      ...d.data()
    }));
    console.debug('getUserCars: returning cars array', cars);
    return cars;
  } catch (error) {
    console.error("Error fetching user cars:", error);
    return [];
  }
};

export const updateCarModel = async (userId, carId, updates) => {
  if (!userId || !carId) return false;
  
  try {
    const carRef = doc(db, 'users', userId, 'cars', carId);
    await updateDoc(carRef, {
      ...updates,
      updatedAt: new Date().toISOString()
    });
    return true;
  } catch (error) {
    console.error("Error updating car model:", error);
    return false;
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

export const addServiceHistory = async (userId, carId, serviceData) => {
  if (!userId || !carId) return false;
  
  try {
    const carRef = doc(db, 'users', userId, 'cars', carId);
    const carDoc = await getDoc(carRef);
    
    if (!carDoc.exists()) return false;
    
    const currentHistory = carDoc.data().serviceHistory || [];
    const updatedHistory = [...currentHistory, {
      ...serviceData,
      id: `service-${Date.now()}`,
      date: new Date().toISOString(),
    }];
    
    await updateDoc(carRef, {
      serviceHistory: updatedHistory,
      lastService: new Date().toISOString(),
      nextService: serviceData.nextServiceDue || 'Not scheduled'
    });
    
    return true;
  } catch (error) {
    console.error("Error adding service history:", error);
    return false;
  }
};

export const getCarServiceHistory = async (userId, carId) => {
  if (!userId || !carId) return [];
  
  try {
    const carRef = doc(db, 'users', userId, 'cars', carId);
    const carDoc = await getDoc(carRef);
    
    if (!carDoc.exists()) return [];
    
    return carDoc.data().serviceHistory || [];
  } catch (error) {
    console.error("Error fetching service history:", error);
    return [];
  }
};

export const createPartsRequest = async (requestData, userId) => {
  if (!requestData || !userId) throw new Error('Missing required data for parts request');

  const parts = (requestData.parts || []).map(p => ({
    partId: p.partId || p.id || '',
    name: p.name || '',
    quantity: Number(p.quantity) || 0,
    price: Number(p.price) || 0
  }));

  const formatted = {
    car: {
      id: requestData.car?.id || '',
      make: requestData.car?.make || '',
      model: requestData.car?.model || '',
      year: requestData.car?.year || '',
      plateNumber: requestData.car?.plateNumber || ''
    },
    customerId: requestData.customer?.id || '',
    customer: { name: requestData.customer?.displayName || '' },
    mechanicId: userId,
    mechanicName: requestData.mechanicName || '',
    mechanicHeadName: requestData.mechanicHeadName || '',
    parts,
    status: 'pending',
    urgent: Boolean(requestData.urgent),
    notes: requestData.notes || '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    totalAmount: parts.reduce((s, p) => s + p.price * p.quantity, 0)
  };

  const requestsRef = collection(db, 'partRequests');
  const docRef = await addDoc(requestsRef, formatted);

  await addDoc(collection(db, 'logs'), {
    type: 'PARTS_REQUEST_CREATED',
    timestamp: new Date().toISOString(),
    userId,
    requestId: docRef.id,
    details: { parts: formatted.parts, totalAmount: formatted.totalAmount }
  });

  return { id: docRef.id, ...formatted };
};

export const registerWithEmail = async (email, password, displayName, role = 'user') => {
  if (!email || !password) throw new Error('Email and password are required');

  try {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    if (displayName) {
      try {
        await updateProfile(cred.user, { displayName });
      } catch (err) {
        console.warn('updateProfile failed:', err);
      }
    }

    await createUserProfile(cred.user, role);

    return { uid: cred.user.uid, email: cred.user.email, displayName: cred.user.displayName || displayName };
  } catch (error) {
    console.error('Registration error:', error);
    throw error;
  }
};

export const registerWithUsername = async ({ firstName, middleName = '', lastName, username, password, role = 'user', address = '', city = '', postalCode = '', phoneNumber = '', googleEmail = '' }) => {
  if (!firstName || !lastName || !username || !password) {
    throw new Error('First name, last name, username and password are required');
  }

  const syntheticEmail = `${username}@motohub.local`;

  try {
    const cred = await createUserWithEmailAndPassword(auth, syntheticEmail, password);

    const displayName = `${firstName}${middleName ? ' ' + middleName : ''} ${lastName}`.trim();

    try {
      await updateProfile(cred.user, { displayName });
    } catch (err) {
      console.warn('updateProfile failed:', err);
    }

    const userDoc = {
      uid: cred.user.uid,
      displayName,
      firstName,
      middleName: middleName || null,
      lastName,
      username,
      email: googleEmail || null,
      googleEmail: googleEmail || null,
      address: address || null,
      city: city || null,
      postalCode: postalCode || null,
      phoneNumber: phoneNumber || null,
      role,
      createdAt: new Date().toISOString()
    };

    await setDoc(doc(db, 'users', cred.user.uid), userDoc);

    return { uid: cred.user.uid, displayName, username };
  } catch (error) {
    console.error('Registration (username) error:', error);
    throw error;
  }
};

export const getUserProfile = async (uid) => {
  if (!uid) return null;
  try {
    const ref = doc(db, 'users', uid);
    const snap = await getDoc(ref);
    return snap.exists() ? { id: snap.id, ...snap.data() } : null;
  } catch (err) {
    console.error('getUserProfile error', err);
    return null;
  }
};

export const updateUserProfile = async (uid, updates = {}) => {
  if (!uid) throw new Error('Missing uid');
  try {
    const ref = doc(db, 'users', uid);
    const clean = { ...updates };
    // remove undefined fields
    Object.keys(clean).forEach(k => clean[k] === undefined && delete clean[k]);
    await updateDoc(ref, clean);
    return true;
  } catch (err) {
    console.error('updateUserProfile error', err);
    throw err;
  }
};

export const sendPasswordReset = async (email) => {
  try {
    // Firebase will automatically check if user exists
    // Just send the reset email directly
    await sendPasswordResetEmail(auth, email, {
      url: window.location.origin + '/login',
      handleCodeInApp: false
    });

    return { 
      success: true, 
      message: 'If an account exists with this email, a password reset link has been sent' 
    };
  } catch (error) {
    console.error("Error sending password reset email:", error);
    
    // Provide more specific error messages
    if (error.code === 'auth/user-not-found') {
      // Don't reveal if user exists or not for security
      return { 
        success: true, 
        message: 'If an account exists with this email, a password reset link has been sent' 
      };
    } else if (error.code === 'auth/invalid-email') {
      throw new Error('Invalid email address');
    } else if (error.code === 'auth/too-many-requests') {
      throw new Error('Too many requests. Please try again later.');
    } else {
      // Generic success message to avoid revealing account existence
      return { 
        success: true, 
        message: 'If an account exists with this email, a password reset link has been sent' 
      };
    }
  }
};

export const signOut = async () => {
  try {
    // Sign out from Firebase
    await firebaseSignOut(auth);
    
    // Clear any local storage/session storage data
    localStorage.clear();
    sessionStorage.clear();
    
    // Clear any cached data in IndexedDB
    const databases = await window.indexedDB.databases();
    databases.forEach(db => {
      window.indexedDB.deleteDatabase(db.name);
    });

    return true;
  } catch (error) {
    console.error('Sign out error:', error);
    throw new Error('Failed to sign out. Please try again.');
  }
};

// Notification functions
export const createNotification = async (recipientId, notificationData) => {
  try {
    const notificationsRef = collection(db, 'users', recipientId, 'notifications');
    const notification = {
      ...notificationData,
      read: false,
      createdAt: new Date().toISOString(),
      timestamp: new Date().toISOString()
    };
    
    await addDoc(notificationsRef, notification);
    
    // Log the notification
    await addDoc(collection(db, 'logs'), {
      type: 'NOTIFICATION_CREATED',
      timestamp: new Date().toISOString(),
      recipientId,
      notificationType: notificationData.type,
      details: notificationData
    });
    
    return true;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

export const createFollowUpNotification = async (requestId, mechanicId, mechanicName) => {
  try {
    // Get all admin users
    const usersSnapshot = await getDocs(collection(db, 'users'));
    const admins = usersSnapshot.docs.filter(doc => doc.data().role === 'admin');
    
    // Create notification for each admin
    for (const adminDoc of admins) {
      await createNotification(adminDoc.id, {
        type: 'follow_up',
        title: 'Parts Request Follow-Up',
        description: `${mechanicName} is requesting a follow-up on their pending parts request`,
        requestId,
        mechanicId,
        mechanicName
      });
    }
    
    // Update the request with follow-up flag
    const requestRef = doc(db, 'partRequests', requestId);
    await updateDoc(requestRef, {
      followUpRequested: true,
      followUpRequestedAt: new Date().toISOString()
    });
    
    return true;
  } catch (error) {
    console.error('Error creating follow-up notification:', error);
    throw error;
  }
};

export const notifyRequestStatusChange = async (requestId, mechanicId, status, adminNotes = '') => {
  try {
    const notification = {
      type: 'request_status_change',
      title: `Parts Request ${status.charAt(0).toUpperCase() + status.slice(1)}`,
      description: status === 'approved' 
        ? 'Your parts request has been approved and is being processed'
        : status === 'rejected'
        ? `Your parts request has been rejected${adminNotes ? ': ' + adminNotes : ''}`
        : `Your parts request status has been updated to ${status}`,
      requestId,
      status,
      adminNotes
    };
    
    await createNotification(mechanicId, notification);
    return true;
  } catch (error) {
    console.error('Error notifying request status change:', error);
    throw error;
  }
};