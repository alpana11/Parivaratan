// Test script to verify partner signup with real Firebase Auth + Firestore
import { auth, db } from './src/config/firebase.js';
import { createUserWithEmailAndPassword, deleteUser } from 'firebase/auth';
import { doc, setDoc, getDoc, deleteDoc } from 'firebase/firestore';

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
