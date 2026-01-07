// Script to create Firebase Auth users for existing partners in Firestore
// Run with: node fix-auth.cjs

const { initializeApp } = require('firebase/app');
const { getAuth, createUserWithEmailAndPassword } = require('firebase/auth');
const { getFirestore, collection, getDocs, doc, updateDoc } = require('firebase/firestore');

// Firebase configuration - copy from your firebase.ts config
const firebaseConfig = {
  apiKey: "AIzaSyC5r5x8z9x8z9x8z9x8z9x8z9x8z9x8z9x8z9x8z9",
  authDomain: "parivartan-waste-management.firebaseapp.com",
  projectId: "parivartan-waste-management",
  storageBucket: "parivartan-waste-management.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef123456"
};

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

// Run the script
createAuthUsersForExistingPartners()
  .then(() => {
    console.log('\n🎉 Script completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Script failed:', error);
    process.exit(1);
  });
