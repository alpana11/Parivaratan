// Test script to verify partner signup with real Firebase Auth + Firestore
import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signOut, deleteUser } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, deleteDoc } from 'firebase/firestore';

// Your Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyAhGzw2T-vCjQ9qCaPl0ruP5Df8Pqv5SPY",
  authDomain: "parivartan-3a3db.firebaseapp.com",
  projectId: "parivartan-3a3db",
  storageBucket: "parivartan-3a3db.firebasestorage.app",
  messagingSenderId: "258581842250",
  appId: "1:258581842250:web:2fe5fc34122673ff5ed9b3"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function testPartnerSignup() {
  // Generate a completely unique email
  const timestamp = Date.now();
  const randomId = Math.random().toString(36).substr(2, 9);
  const testEmail = `test_${timestamp}_${randomId}@example.com`;
  const testPassword = 'test123456';

  console.log('Testing partner signup with email:', testEmail);

  try {
    // 1. Create Firebase Auth user
    console.log('Creating Firebase Auth user...');
    const userCredential = await createUserWithEmailAndPassword(auth, testEmail, testPassword);
    const user = userCredential.user;
    console.log('✅ Firebase Auth user created:', user.uid);

    // 2. Create partner document in Firestore
    console.log('Creating partner document in Firestore...');
    const partnerData = {
      id: user.uid,
      name: 'Test Partner',
      email: testEmail,
      phone: '+1234567890',
      organization: 'Test Organization',
      partnerType: 'NGO',
      address: 'Test Address',
      verificationStatus: 'pending',
      documents: [],
      rewardPoints: 0,
      createdAt: new Date()
    };

    await setDoc(doc(db, 'partners', user.uid), partnerData);
    console.log('✅ Partner document created in Firestore');

    // 3. Verify the document was created
    console.log('Verifying partner document...');
    const partnerDoc = await getDoc(doc(db, 'partners', user.uid));
    if (partnerDoc.exists()) {
      console.log('✅ Partner document verified:', partnerDoc.data());
    } else {
      console.log('❌ Partner document not found');
    }

    // 4. Clean up - delete the test user and document
    console.log('Cleaning up test data...');
    await deleteDoc(doc(db, 'partners', user.uid));
    await deleteUser(user);
    console.log('✅ Test data cleaned up');

    console.log('\n🎉 SUCCESS: Partner signup flow works correctly!');
    console.log('The issue was likely with previously used emails.');
    console.log('Try signing up with a completely new email address.');

  } catch (error) {
    console.error('❌ Test failed:', error);

    // Clean up on failure
    try {
      const user = auth.currentUser;
      if (user) {
        await deleteDoc(doc(db, 'partners', user.uid));
        await deleteUser(user);
      }
    } catch (cleanupError) {
      console.log('Cleanup failed:', cleanupError);
    }
  }
}

// Run the test
testPartnerSignup();
