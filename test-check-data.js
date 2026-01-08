import { db } from './src/config/firebase.js';
import { collection, getDocs, query, limit } from 'firebase/firestore';

async function checkExistingData() {
  try {
    console.log('Checking existing data in Firestore...\n');

    // Check partners
    console.log('=== PARTNERS ===');
    const partnersQuery = query(collection(db, 'partners'), limit(5));
    const partnersSnapshot = await getDocs(partnersQuery);
    if (partnersSnapshot.empty) {
      console.log('No partners found');
    } else {
      partnersSnapshot.forEach((doc) => {
        console.log(`Partner ID: ${doc.id}`);
        console.log(`Name: ${doc.data().name}`);
        console.log(`Email: ${doc.data().email}`);
        console.log('---');
      });
    }

    // Check waste requests
    console.log('\n=== WASTE REQUESTS ===');
    const wasteRequestsQuery = query(collection(db, 'wasteRequests'), limit(5));
    const wasteRequestsSnapshot = await getDocs(wasteRequestsQuery);
    if (wasteRequestsSnapshot.empty) {
      console.log('No waste requests found');
    } else {
      wasteRequestsSnapshot.forEach((doc) => {
        const data = doc.data();
        console.log(`Request ID: ${doc.id}`);
        console.log(`Type: ${data.type}`);
        console.log(`Partner ID: ${data.partnerId || 'Not assigned'}`);
        console.log(`Status: ${data.status}`);
        console.log('---');
      });
    }

  } catch (error) {
    console.error('Error checking data:', error);
  }
}

checkExistingData();
