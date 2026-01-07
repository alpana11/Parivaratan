// Script to create Firebase Auth users for existing partners in Firestore
// Run this script to fix the login issue for partners who exist in Firestore but not in Firebase Auth

import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { firebaseConfig } from './src/config/firebase.js';

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function createAuthUsersForExistingPartners() {
  try {
    console.log('🔍 Checking for partners in Firestore...');

    // Get all partners from Firestore
    const partnersSnapshot = await getDocs(collection(db, 'partners'));
    const partners = partnersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    console.log(`📊 Found ${partners.length} partners in Firestore`);

    let createdCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const partner of partners) {
      try {
        console.log(`\n🔄 Processing partner: ${partner.email}`);

        // Check if partner already has Firebase Auth user
        // We'll try to create the user and catch the error if they already exist
        try {
          const userCredential = await createUserWithEmailAndPassword(
            auth,
            partner.email,
            'TempPass123!' // Temporary password - partners will need to reset
          );

          console.log(`✅ Created Firebase Auth user for: ${partner.email}`);

          // Update the partner document with the Firebase Auth UID if it doesn't match
          if (partner.id !== userCredential.user.uid) {
            await updateDoc(doc(db, 'partners', partner.id), {
              firebaseAuthId: userCredential.user.uid
            });
            console.log(`🔗 Linked Firestore partner to Firebase Auth user`);
          }

          createdCount++;

        } catch (authError) {
          if (authError.code === 'auth/email-already-in-use') {
            console.log(`⏭️  Firebase Auth user already exists for: ${partner.email}`);
            skippedCount++;
          } else {
            console.error(`❌ Error creating auth user for ${partner.email}:`, authError.message);
            errorCount++;
          }
        }

      } catch (error) {
        console.error(`❌ Error processing partner ${partner.email}:`, error.message);
        errorCount++;
      }
    }

    console.log('\n📈 Summary:');
    console.log(`✅ Created: ${createdCount} Firebase Auth users`);
    console.log(`⏭️  Skipped: ${skippedCount} (already existed)`);
    console.log(`❌ Errors: ${errorCount}`);

    if (createdCount > 0) {
      console.log('\n⚠️  IMPORTANT: Partners with newly created accounts should reset their passwords!');
      console.log('   They can use the "Forgot Password" feature to set a new password.');
    }

  } catch (error) {
    console.error('❌ Script failed:', error);
  }
}

// Alternative approach: Create a function to manually create auth user for a specific partner
export async function createAuthUserForPartner(partnerEmail, tempPassword = 'TempPass123!') {
  try {
    console.log(`🔄 Creating Firebase Auth user for: ${partnerEmail}`);

    const userCredential = await createUserWithEmailAndPassword(auth, partnerEmail, tempPassword);
    console.log(`✅ Created Firebase Auth user for: ${partnerEmail}`);

    return userCredential.user;
  } catch (error) {
    if (error.code === 'auth/email-already-in-use') {
      console.log(`⏭️  Firebase Auth user already exists for: ${partnerEmail}`);
    } else {
      console.error(`❌ Error creating auth user:`, error.message);
    }
    throw error;
  }
}

// Run the script if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  createAuthUsersForExistingPartners()
    .then(() => {
      console.log('\n🎉 Script completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Script failed:', error);
      process.exit(1);
    });
}
