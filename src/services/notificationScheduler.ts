import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../config/firebase';
import { dbService } from './dbService';

export const notificationScheduler = {
  getHoursUntilPickup(scheduledDate: string, scheduledTime: string): number {
    const pickupDateTime = new Date(`${scheduledDate}T${scheduledTime.split('-')[0]}:00`);
    return (pickupDateTime.getTime() - Date.now()) / (1000 * 60 * 60);
  },

  // Auto-check all scheduled pickups for this partner and send confirmation if ~12 hours away
  async checkAndSendAvailabilityConfirmations(partnerId: string, partnerName: string) {
    try {
      // Query all In Progress requests for this partner that have a scheduled date
      const q = query(
        collection(db, 'wasteRequests'),
        where('partnerId', '==', partnerId),
        where('status', '==', 'In Progress')
      );
      const snapshot = await getDocs(q);

      for (const docSnap of snapshot.docs) {
        const request = { id: docSnap.id, ...docSnap.data() } as any;

        if (!request.scheduledDate || !request.scheduledTime) continue;
        if (request.confirmationStatus && request.confirmationStatus !== 'pending') continue;
        if (request.confirmationSentAt) continue; // already sent

        const hoursUntil = this.getHoursUntilPickup(request.scheduledDate, request.scheduledTime);

        // Send if pickup is 11–13 hours away
        if (hoursUntil >= 11 && hoursUntil <= 13) {
          const userId = request.userId;
          if (!userId) continue;

          await dbService.sendAvailabilityConfirmation(
            request.id,
            partnerId,
            userId,
            request.scheduledDate,
            request.scheduledTime,
            partnerName,
            request.phoneNumber || 'N/A'
          );

          // Mark confirmation as sent on the waste request
          await dbService.updateWasteRequest(request.id, {
            confirmationStatus: 'pending',
            confirmationSentAt: new Date().toISOString()
          } as any);

          console.log(`✅ Auto-sent availability confirmation for request ${request.id}`);
        }
      }
    } catch (error) {
      console.error('Error in checkAndSendAvailabilityConfirmations:', error);
    }
  }
};
