const { initializeApp } = require('firebase/app');
const { getStorage, ref } = require('firebase/storage');

// Firebase config (you'll need to replace with actual values)
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};

console.log('Testing Firebase Storage connection...');
console.log('Storage bucket:', firebaseConfig.storageBucket);

try {
  const app = initializeApp(firebaseConfig);
  const storage = getStorage(app);

  console.log('Firebase Storage initialized successfully');

  // Test creating a reference
  const testRef = ref(storage, 'test.txt');
  console.log('Test reference created:', testRef.toString());

  console.log('Storage test completed. If you see this message, Firebase Storage is accessible.');
} catch (error) {
  console.error('Error initializing Firebase Storage:', error);
}
