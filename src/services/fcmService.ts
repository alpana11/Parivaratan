import { getToken, onMessage, messaging } from '../config/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY;

export const fcmService = {
  // Request permission and get FCM token
  async requestPermissionAndGetToken(partnerId: string): Promise<string | null> {
    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        console.log('Notification permission denied');
        return null;
      }

      const token = await getToken(messaging, { vapidKey: VAPID_KEY });
      if (token) {
        // Save token to partner's Firestore document
        await updateDoc(doc(db, 'partners', partnerId), { fcmToken: token });
        console.log('FCM token saved:', token);
        return token;
      }
      return null;
    } catch (error) {
      console.error('Error getting FCM token:', error);
      return null;
    }
  },

  // Listen for foreground messages
  onForegroundMessage(callback: (payload: any) => void) {
    return onMessage(messaging, (payload) => {
      callback(payload);
    });
  }
};
