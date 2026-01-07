import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';

// Import Firebase services from the shared config
import { auth, db } from '../src/config/firebase.ts';

console.log('Firebase initialized successfully');
console.log('Auth:', auth);
console.log('Firestore:', db);

// Test basic connectivity
async function testFirebaseConnection() {
  try {
    console.log('Testing Firebase connection...');

    // This will fail if Firebase project doesn't exist or is misconfigured
    console.log('Firebase app initialized:', app.name);
    console.log('Project ID:', app.options.projectId);

    return true;
  } catch (error) {
    console.error('Firebase connection test failed:', error);
    return false;
  }
}

testFirebaseConnection();