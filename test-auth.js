import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator, createUserWithEmailAndPassword } from 'firebase/auth';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAhGzw2T-vCjQ9qCaPl0ruP5Df8Pqv5SPY",
  authDomain: "parivartan-3a3db.firebaseapp.com",
  projectId: "parivartan-3a3db",
  storageBucket: "parivartan-3a3db.firebasestorage.app",
  messagingSenderId: "258581842250",
  appId: "1:258581842250:web:2fe5fc34122673ff5ed9b3"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Connect to emulator
try {
  connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
  console.log('Connected to Auth emulator');
} catch (error) {
  console.log('Emulator connection failed:', error);
}

// Test function
async function testAuth() {
  try {
    console.log('Testing Auth emulator...');

    // Generate a unique email for testing
    const testEmail = `test${Date.now()}@example.com`;
    const testPassword = 'testpassword123';

    console.log(`Attempting to create user: ${testEmail}`);

    const userCredential = await createUserWithEmailAndPassword(auth, testEmail, testPassword);
    console.log('User created successfully:', userCredential.user.uid);

    // Try to create the same user again to test duplicate handling
    try {
      await createUserWithEmailAndPassword(auth, testEmail, testPassword);
      console.log('ERROR: Should have failed for duplicate email');
    } catch (error) {
      if (error.code === 'auth/email-already-in-use') {
        console.log('Correctly caught duplicate email error');
      } else {
        console.log('Unexpected error for duplicate email:', error.code);
      }
    }

    // Try a different email
    const testEmail2 = `test${Date.now() + 1}@example.com`;
    console.log(`Attempting to create different user: ${testEmail2}`);

    const userCredential2 = await createUserWithEmailAndPassword(auth, testEmail2, testPassword);
    console.log('Second user created successfully:', userCredential2.user.uid);

    console.log('Auth emulator test completed successfully');

  } catch (error) {
    console.error('Auth test failed:', error);
  }
}

testAuth();
