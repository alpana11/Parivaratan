importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: 'AIzaSyAhGzw2T-vCjQ9qCaPl0ruP5Df8Pqv5SPY',
  authDomain: 'parivartan-3a3db.firebaseapp.com',
  projectId: 'parivartan-3a3db',
  storageBucket: 'parivartan-3a3db.firebasestorage.app',
  messagingSenderId: '258581842250',
  appId: '1:258581842250:web:2fe5fc34122673ff5ed9b3'
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const { title, body } = payload.notification;
  self.registration.showNotification(title, {
    body,
    icon: '/assets/icon.png',
    badge: '/assets/icon.png'
  });
});
