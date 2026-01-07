const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');
const { getFirestore, doc, getDoc } = require('firebase/firestore');

// Import Firebase services from the shared config
const { auth, db } = require('./src/config/firebase.ts');

// Test login function
async function testLogin() {
  try {
    console.log('Testing login...');

    // Use the shared auth instance
    const userCredential = await signInWithEmailAndPassword(auth, 'test@example.com', 'password123');
    console.log('Login successful:', userCredential.user.uid);

    // Test Firestore access
    const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
    if (userDoc.exists()) {
      console.log('User document found:', userDoc.data());
    } else {
      console.log('User document not found');
    }

  } catch (error) {
    console.error('Login test failed:', error);
  }
}

testLogin();
