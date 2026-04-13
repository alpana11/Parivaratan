import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  onSnapshot,
  increment
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { WasteRequest, ImpactMetrics, Voucher, RewardTransaction, Partner, Notification, AuditLog, RewardRule, RewardCampaign } from '../types';

export const dbService = {
  async createWasteRequest(request: Omit<WasteRequest, 'id'>) {
    try {
      const docRef = await addDoc(collection(db, 'wasteRequests'), {
        ...request,
        createdAt: Timestamp.fromDate(new Date(request.createdAt)),
        date: Timestamp.fromDate(new Date(request.date))
      });
      return docRef.id;
    } catch (error) {
      throw error;
    }
  },

  async getWasteRequests(partnerId?: string) {
    try {
      let q;
      if (partnerId) {
        q = query(collection(db, 'wasteRequests'), where('partnerId', '==', partnerId));
      } else {
        q = collection(db, 'wasteRequests');
      }

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date?.toDate?.()?.toISOString() || doc.data().date,
        createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || doc.data().createdAt
      })) as WasteRequest[];
    } catch (error) {
      throw error;
    }
  },

  async updateWasteRequest(id: string, updates: Partial<WasteRequest>) {
    try {
      const docRef = doc(db, 'wasteRequests', id);
      
      // If marking as completed, calculate and set ecoPointsAwarded, then increment user's ecoPoints
      if (updates.status === 'Completed') {
        console.log('🎯 Marking request as Completed...');
        const requestDoc = await getDoc(docRef);
        const requestData = requestDoc.data();
        
        const userId = requestData?.userId;
        const wasteType = requestData?.type;
        const quantityStr = requestData?.quantity || '0';
        const quantity = parseFloat(quantityStr.toString().replace(/[^0-9.]/g, '')) || 0;
        
        let ecoPointsAwarded = requestData?.ecoPointsAwarded;
        
        // If ecoPointsAwarded doesn't exist, calculate it from rewardRules
        if (!ecoPointsAwarded && wasteType) {
          console.log('⚙️ Calculating ecoPoints from rewardRules...');
          try {
            const rulesQuery = query(
              collection(db, 'rewardRules'),
              where('wasteType', '==', wasteType),
              where('isActive', '==', true)
            );
            const rulesSnapshot = await getDocs(rulesQuery);
            
            if (!rulesSnapshot.empty) {
              const rule = rulesSnapshot.docs[0].data();
              const pointsPerKg = rule.pointsPerKg || 0;
              ecoPointsAwarded = Math.round(quantity * pointsPerKg);
              console.log(`📊 Calculated: ${quantity}kg × ${pointsPerKg} points/kg = ${ecoPointsAwarded} points`);
            } else {
              ecoPointsAwarded = 10; // Default if no rule found
              console.log('⚠️ No reward rule found, using default: 10 points');
            }
          } catch (error) {
            console.error('❌ Error fetching reward rules:', error);
            ecoPointsAwarded = 10; // Fallback
          }
          
          // Set ecoPointsAwarded in the waste request
          await updateDoc(docRef, {
            ecoPointsAwarded: ecoPointsAwarded
          });
        }
        
        console.log('userId:', userId);
        console.log('ecoPointsAwarded:', ecoPointsAwarded);

        if (userId && ecoPointsAwarded) {
          console.log(`✅ Incrementing ${ecoPointsAwarded} ecoPoints for user ${userId}`);
          const userRef = doc(db, 'users', userId);
          
          try {
            await updateDoc(userRef, {
              ecoPoints: increment(ecoPointsAwarded)
            });
            console.log('✅ EcoPoints incremented successfully!');
          } catch (error) {
            console.error('❌ Firestore permission error or user not found:', error);
            throw error;
          }
        } else {
          console.warn('⚠️ Missing data - cannot increment ecoPoints:', { userId, ecoPointsAwarded });
        }
      }
      
      // Then update the waste request status
      await updateDoc(docRef, {
        ...updates,
        updatedAt: Timestamp.now(),
      });
      
      console.log('✅ Waste request updated successfully');
    } catch (error) {
      console.error('❌ Error in updateWasteRequest:', error);
      throw error;
    }
  },

  // Get all waste requests (admin only)
  async getAllWasteRequests() {
    try {
      const querySnapshot = await getDocs(collection(db, 'wasteRequests'));
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date?.toDate?.()?.toISOString() || doc.data().date
      })) as WasteRequest[];
    } catch (error) {
      throw error;
    }
  },

  // Get all partners (admin only)
  async getAllPartners() {
    try {
      const querySnapshot = await getDocs(collection(db, 'partners'));
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          // Ensure documents is in the new format
          documents: Array.isArray(data.documents)
            ? data.documents.map((doc: any) =>
                typeof doc === 'string'
                  ? {
                      type: 'registration_certificate' as const,
                      url: doc,
                      uploadedAt: new Date().toISOString(),
                      verified: 'pending' as const
                    }
                  : doc
              )
            : [],
          // Ensure subscription is in the new format if it exists
          subscription: data.subscription ? {
            ...data.subscription,
            status: data.subscription.status || 'none'
          } : undefined
        } as Partner;
      });
    } catch (error) {
      throw error;
    }
  },

  // Partners
  async getPartner(id: string) {
    try {
      const docRef = doc(db, 'partners', id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Partner;
      }
      return null;
    } catch (error) {
      throw error;
    }
  },

  async updatePartner(id: string, updates: Partial<Partner>) {
    try {
      const docRef = doc(db, 'partners', id);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      throw error;
    }
  },

  // Impact Metrics
  async getImpactMetrics(partnerId: string) {
    try {
      const docRef = doc(db, 'impactMetrics', partnerId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return docSnap.data() as ImpactMetrics;
      }
      // Return default metrics if not found
      return {
        wasteProcessed: 0,
        co2Reduction: 0,
      };
    } catch (error) {
      throw error;
    }
  },

  async updateImpactMetrics(partnerId: string, metrics: ImpactMetrics) {
    try {
      const docRef = doc(db, 'impactMetrics', partnerId);
      await updateDoc(docRef, {
        ...metrics,
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      throw error;
    }
  },

  // Vouchers
  async getVouchers() {
    try {
      const querySnapshot = await getDocs(collection(db, 'vouchers'));
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          title: data.title || '',
          description: data.description || '',
          pointsRequired: data.pointsRequired || 0,
          image: data.image || '',
          category: data.category || '',
          status: data.status || 'active',
          maxRedemptions: data.maxRedemptions || null,
          currentRedemptions: data.currentRedemptions || 0,
          redeemedBy: data.redeemedBy || [],
          expiryDate: data.expiryDate?.toDate?.()?.toISOString() || data.expiryDate,
          createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
          redeemedDate: data.redeemedDate?.toDate?.()?.toISOString() || data.redeemedDate,
          updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt
        } as Voucher;
      });
    } catch (error) {
      throw error;
    }
  },

  async createVoucher(voucher: Omit<Voucher, 'id'>) {
    try {
      const docRef = await addDoc(collection(db, 'vouchers'), {
        ...voucher,
        expiryDate: Timestamp.fromDate(new Date(voucher.expiryDate)),
        createdAt: Timestamp.now(),
      });
      return docRef.id;
    } catch (error) {
      throw error;
    }
  },

  async updateVoucher(id: string, updates: Partial<Voucher>) {
    try {
      const docRef = doc(db, 'vouchers', id);
      const updateData: any = { ...updates };

      if (updates.expiryDate) {
        updateData.expiryDate = Timestamp.fromDate(new Date(updates.expiryDate));
      }

      await updateDoc(docRef, {
        ...updateData,
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      throw error;
    }
  },

  async redeemVoucher(voucherId: string, partnerId: string) {
    try {
      const voucherRef = doc(db, 'vouchers', voucherId);
      const voucherDoc = await getDoc(voucherRef);
      const voucherData = voucherDoc.data() as Voucher;

      if (!voucherData) throw new Error('Voucher not found');

      // Check if voucher is expired
      if (new Date(voucherData.expiryDate) < new Date()) {
        throw new Error('Voucher has expired');
      }

      // Check redemption limit
      if (voucherData.maxRedemptions && (voucherData.currentRedemptions || 0) >= voucherData.maxRedemptions) {
        throw new Error('Voucher redemption limit reached');
      }

      // Update voucher
      await updateDoc(voucherRef, {
        status: 'redeemed',
        redeemedDate: Timestamp.now(),
        redeemedBy: [...(voucherData.redeemedBy || []), partnerId],
        currentRedemptions: (voucherData.currentRedemptions || 0) + 1,
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      throw error;
    }
  },

  // Reward Transactions
  async getRewardTransactions(partnerId?: string, userId?: string) {
    try {
      let q;
      if (partnerId) {
        q = query(
          collection(db, 'rewardTransactions'),
          where('partnerId', '==', partnerId),
          orderBy('date', 'desc'),
          limit(50)
        );
      } else if (userId) {
        q = query(
          collection(db, 'rewardTransactions'),
          where('userId', '==', userId),
          orderBy('date', 'desc'),
          limit(50)
        );
      } else {
        q = query(collection(db, 'rewardTransactions'), orderBy('date', 'desc'), limit(100));
      }
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date?.toDate?.()?.toISOString() || doc.data().date
      })) as RewardTransaction[];
    } catch (error) {
      throw error;
    }
  },

  async addRewardTransaction(transaction: Omit<RewardTransaction, 'id'>) {
    try {
      const docRef = await addDoc(collection(db, 'rewardTransactions'), {
        ...transaction,
        date: Timestamp.fromDate(new Date(transaction.date)),
        createdAt: Timestamp.now(),
      });
      return docRef.id;
    } catch (error) {
      throw error;
    }
  },

  // Reward Rules
  async updateRewardRule(id: string, updates: Partial<RewardRule>) {
    try {
      const docRef = doc(db, 'rewardRules', id);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      throw error;
    }
  },

  // Reward Campaigns
  async createRewardCampaign(campaign: Omit<RewardCampaign, 'id'>) {
    try {
      const docRef = await addDoc(collection(db, 'rewardCampaigns'), {
        ...campaign,
        startDate: Timestamp.fromDate(new Date(campaign.startDate)),
        endDate: Timestamp.fromDate(new Date(campaign.endDate)),
        createdAt: Timestamp.now(),
      });
      return docRef.id;
    } catch (error) {
      throw error;
    }
  },

  // Notifications
  async getAllNotifications() {
    try {
      const q = query(collection(db, 'notifications'), orderBy('createdAt', 'desc'), limit(500));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || doc.data().createdAt,
        sentAt: doc.data().sentAt?.toDate?.()?.toISOString() || doc.data().sentAt,
        readAt: doc.data().readAt?.toDate?.()?.toISOString() || doc.data().readAt
      })) as Notification[];
    } catch (error) {
      throw error;
    }
  },

  async getPartnerNotifications(partnerId: string) {
    try {
      const q = query(
        collection(db, 'notifications'),
        where('partnerId', '==', partnerId),
        orderBy('createdAt', 'desc'),
        limit(100)
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || doc.data().createdAt,
        sentAt: doc.data().sentAt?.toDate?.()?.toISOString() || doc.data().sentAt,
        readAt: doc.data().readAt?.toDate?.()?.toISOString() || doc.data().readAt
      })) as Notification[];
    } catch (error) {
      throw error;
    }
  },

  async createNotification(notification: Omit<Notification, 'id'>) {
    try {
      const docRef = await addDoc(collection(db, 'notifications'), {
        ...notification,
        createdAt: Timestamp.now(),
        status: notification.status || 'pending'
      });
      return docRef.id;
    } catch (error) {
      throw error;
    }
  },

  async sendAvailabilityConfirmation(requestId: string, partnerId: string, userId: string, pickupDate: string, pickupTime: string, partnerName: string, userPhone: string) {
    try {
      // Only store userId — no partnerId so it doesn't appear in partner's notifications
      const notificationId = await this.createNotification({
        userId,
        type: 'availability_confirmation',
        category: 'availability_check',
        title: 'Are you available for pickup?',
        message: `${partnerName} is asking: Will you be available for waste pickup on ${new Date(pickupDate).toLocaleDateString()} at ${pickupTime}? Please confirm or decline.`,
        priority: 'high',
        status: 'sent',
        metadata: {
          wasteRequestId: requestId,
          partnerId,
          pickupDate,
          pickupTime,
          userPhone,
          requiresResponse: true
        }
      });
      return notificationId;
    } catch (error) {
      throw error;
    }
  },

  async respondToAvailabilityConfirmation(notificationId: string, response: 'confirmed' | 'declined') {
    try {
      const notifRef = doc(db, 'notifications', notificationId);
      const notifSnap = await getDoc(notifRef);
      const notifData = notifSnap.data();

      await updateDoc(notifRef, {
        status: response,
        respondedAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });

      // Sync confirmationStatus back to the waste request
      const requestId = notifData?.metadata?.wasteRequestId;
      if (requestId) {
        const requestRef = doc(db, 'wasteRequests', requestId);
        await updateDoc(requestRef, {
          confirmationStatus: response === 'confirmed' ? 'confirmed' : 'not_available',
          updatedAt: Timestamp.now(),
        });
      }
    } catch (error) {
      throw error;
    }
  },

  async sendNotification(id: string) {
    try {
      const docRef = doc(db, 'notifications', id);
      await updateDoc(docRef, {
        status: 'sent',
        sentAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      throw error;
    }
  },

  async markNotificationAsRead(id: string) {
    try {
      const docRef = doc(db, 'notifications', id);
      await updateDoc(docRef, {
        readAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      throw error;
    }
  },

  async deleteNotification(id: string) {
    try {
      const docRef = doc(db, 'notifications', id);
      await deleteDoc(docRef);
    } catch (error) {
      throw error;
    }
  },

  async createBulkNotifications(notifications: Omit<Notification, 'id'>[]) {
    try {
      const batch = [];
      for (const notification of notifications) {
        batch.push(addDoc(collection(db, 'notifications'), {
          ...notification,
          createdAt: Timestamp.now(),
          status: notification.status || 'pending'
        }));
      }
      await Promise.all(batch);
    } catch (error) {
      throw error;
    }
  },

  async getNotificationsByType(type: Notification['type']) {
    try {
      const q = query(
        collection(db, 'notifications'),
        where('type', '==', type),
        orderBy('createdAt', 'desc'),
        limit(200)
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || doc.data().createdAt,
        sentAt: doc.data().sentAt?.toDate?.()?.toISOString() || doc.data().sentAt,
        readAt: doc.data().readAt?.toDate?.()?.toISOString() || doc.data().readAt
      })) as Notification[];
    } catch (error) {
      throw error;
    }
  },

  async getNotificationsByStatus(status: Notification['status']) {
    try {
      const q = query(
        collection(db, 'notifications'),
        where('status', '==', status),
        orderBy('createdAt', 'desc'),
        limit(200)
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || doc.data().createdAt,
        sentAt: doc.data().sentAt?.toDate?.()?.toISOString() || doc.data().sentAt,
        readAt: doc.data().readAt?.toDate?.()?.toISOString() || doc.data().readAt
      })) as Notification[];
    } catch (error) {
      throw error;
    }
  },

  // Audit Logs
  async createAuditLog(auditLog: Omit<AuditLog, 'id'>) {
    try {
      const docRef = await addDoc(collection(db, 'auditLogs'), {
        ...auditLog,
        timestamp: Timestamp.now(),
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating audit log:', error);
      // Don't throw error for audit logging failures to avoid breaking main functionality
    }
  },

  async getAllAuditLogs(limitCount: number = 1000) {
    try {
      const q = query(collection(db, 'auditLogs'), orderBy('timestamp', 'desc'), limit(limitCount));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate?.()?.toISOString() || doc.data().timestamp
      })) as AuditLog[];
    } catch (error) {
      throw error;
    }
  },

  async getAuditLogsByAdmin(adminId: string, limitCount: number = 500) {
    try {
      const q = query(
        collection(db, 'auditLogs'),
        where('adminId', '==', adminId),
        orderBy('timestamp', 'desc'),
        limit(limitCount)
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate?.()?.toISOString() || doc.data().timestamp
      })) as AuditLog[];
    } catch (error) {
      throw error;
    }
  },

  async getAuditLogsByEntity(entityType: AuditLog['entityType'], entityId: string) {
    try {
      const q = query(
        collection(db, 'auditLogs'),
        where('entityType', '==', entityType),
        where('entityId', '==', entityId),
        orderBy('timestamp', 'desc'),
        limit(100)
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate?.()?.toISOString() || doc.data().timestamp
      })) as AuditLog[];
    } catch (error) {
      throw error;
    }
  },

  async getAuditLogsByActionType(actionType: AuditLog['actionType'], limitCount: number = 500) {
    try {
      const q = query(
        collection(db, 'auditLogs'),
        where('actionType', '==', actionType),
        orderBy('timestamp', 'desc'),
        limit(limitCount)
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate?.()?.toISOString() || doc.data().timestamp
      })) as AuditLog[];
    } catch (error) {
      throw error;
    }
  },

  // Partner comprehensive data methods
  async storePartnerData(partnerId: string, data: any) {
    try {
      const docRef = doc(db, 'partnerData', partnerId);
      await updateDoc(docRef, {
        ...data,
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      // If document doesn't exist, create it
      const docRef = doc(db, 'partnerData', partnerId);
      await addDoc(collection(db, 'partnerData'), {
        partnerId,
        ...data,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
    }
  },

  async getPartnerData(partnerId: string) {
    try {
      const docRef = doc(db, 'partnerData', partnerId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return docSnap.data();
      }
      return null;
    } catch (error) {
      throw error;
    }
  },

  async createPartnerAssignedRequest(partnerId: string, request: any) {
    try {
      await addDoc(collection(db, 'assignedRequests'), {
        partnerId,
        ...request,
        createdAt: Timestamp.now(),
      });
    } catch (error) {
      throw error;
    }
  },

  async getPartnerAssignedRequests(partnerId: string) {
    try {
      const q = query(
        collection(db, 'assignedRequests'),
        where('partnerId', '==', partnerId),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date || doc.data().createdAt?.toDate?.()?.toISOString()
      }));
    } catch (error) {
      throw error;
    }
  },

  async createPartnerPickupHistory(partnerId: string, pickup: any) {
    try {
      await addDoc(collection(db, 'pickupHistory'), {
        partnerId,
        ...pickup,
        createdAt: Timestamp.now(),
      });
    } catch (error) {
      throw error;
    }
  },

  async getPartnerPickupHistory(partnerId: string) {
    try {
      const q = query(
        collection(db, 'pickupHistory'),
        where('partnerId', '==', partnerId),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date || doc.data().createdAt?.toDate?.()?.toISOString()
      }));
    } catch (error) {
      throw error;
    }
  },

  async createPartnerVoucherRedemption(partnerId: string, voucher: any) {
    try {
      await addDoc(collection(db, 'voucherRedemptions'), {
        partnerId,
        ...voucher,
        createdAt: Timestamp.now(),
      });
    } catch (error) {
      throw error;
    }
  },

  // Admin comprehensive data methods
  async storeWasteRequest(request: any) {
    try {
      await addDoc(collection(db, 'wasteRequests'), {
        ...request,
        createdAt: Timestamp.now(),
      });
    } catch (error) {
      throw error;
    }
  },

  async storeDocumentVerificationDecision(decision: any) {
    try {
      await addDoc(collection(db, 'documentVerifications'), {
        ...decision,
        createdAt: Timestamp.now(),
      });
    } catch (error) {
      throw error;
    }
  },

  async storeSubscriptionConfiguration(config: any) {
    try {
      await addDoc(collection(db, 'subscriptionConfigs'), {
        ...config,
        createdAt: Timestamp.now(),
      });
    } catch (error) {
      throw error;
    }
  },

  async storeRewardRule(rule: any) {
    try {
      await addDoc(collection(db, 'rewardRules'), {
        ...rule,
        createdAt: Timestamp.now(),
      });
    } catch (error) {
      throw error;
    }
  },

  async storeVoucherConfiguration(config: any) {
    try {
      await addDoc(collection(db, 'voucherConfigs'), {
        ...config,
        createdAt: Timestamp.now(),
      });
    } catch (error) {
      throw error;
    }
  },

  async storeSchedulingOperation(operation: any) {
    try {
      await addDoc(collection(db, 'schedulingOperations'), {
        ...operation,
        createdAt: Timestamp.now(),
      });
    } catch (error) {
      throw error;
    }
  },

  async storeImpactAnalytics(analytics: any) {
    try {
      await addDoc(collection(db, 'impactAnalytics'), {
        ...analytics,
        createdAt: Timestamp.now(),
      });
    } catch (error) {
      throw error;
    }
  },

  // Real-time listeners
  subscribeToWasteRequestsForPartner(partnerId: string, callback: (requests: WasteRequest[]) => void) {
    console.log('🔍 SUBSCRIPTION START - Partner ID:', partnerId);
    
    let assignedRequests: WasteRequest[] = [];
    let requestedRequests: WasteRequest[] = [];
    let updateCounter = 0;
    
    const mergeAndCallback = () => {
      updateCounter++;
      if (updateCounter % 2 === 0) {
        const allRequests = [...assignedRequests, ...requestedRequests];
        const uniqueRequests = Array.from(
          new Map(allRequests.map(req => [req.id, req])).values()
        );
        console.log('📊 Total:', uniqueRequests.length, '(assigned:', assignedRequests.length, ', requested:', requestedRequests.length, ')');
        callback(uniqueRequests);
      }
    };
    
    const q1 = query(
      collection(db, 'wasteRequests'), 
      where('partnerId', '==', partnerId)
    );
    
    const q2 = query(
      collection(db, 'wasteRequests'),
      where('status', '==', 'Requested')
    );
    
    const unsubscribe1 = onSnapshot(q1, (querySnapshot) => {
      assignedRequests = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          date: data.date?.toDate?.()?.toISOString() || data.date,
          createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt
        };
      }) as WasteRequest[];
      mergeAndCallback();
    });
    
    const unsubscribe2 = onSnapshot(q2, (querySnapshot) => {
      requestedRequests = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          date: data.date?.toDate?.()?.toISOString() || data.date,
          createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt
        };
      }) as WasteRequest[];
      mergeAndCallback();
    });
    
    return () => {
      unsubscribe1();
      unsubscribe2();
    };
  },

  subscribeToPartners(callback: (partners: Partner[]) => void) {
    const q = collection(db, 'partners');
    return onSnapshot(q, (querySnapshot) => {
      const partners = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          // Ensure documents is in the new format
          documents: Array.isArray(data.documents)
            ? data.documents.map((doc: any) =>
                typeof doc === 'string'
                  ? {
                      type: 'registration_certificate' as const,
                      url: doc,
                      uploadedAt: new Date().toISOString(),
                      verified: 'pending' as const
                    }
                  : doc
              )
            : [],
          // Ensure subscription is in the new format if it exists
          subscription: data.subscription ? {
            ...data.subscription,
            status: data.subscription.status || 'none'
          } : undefined
        } as Partner;
      });
      callback(partners);
    });
  },

  listenToRewardRules(callback: (rules: RewardRule[]) => void) {
    const q = collection(db, 'rewardRules');
    return onSnapshot(q, (querySnapshot) => {
      const rules = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || doc.data().createdAt
      })) as RewardRule[];
      callback(rules);
    });
  },

  listenToVouchers(callback: (vouchers: Voucher[]) => void) {
    const q = collection(db, 'vouchers');
    return onSnapshot(q, (querySnapshot) => {
      const vouchers = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        expiryDate: doc.data().expiryDate?.toDate?.()?.toISOString() || doc.data().expiryDate,
        createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || doc.data().createdAt
      })) as Voucher[];
      callback(vouchers);
    });
  },

  // Subscribe to reward transactions for a specific partner
  listenToRewardTransactions(partnerId: string, callback: (transactions: RewardTransaction[]) => void) {
    const q = query(
      collection(db, 'rewardTransactions'),
      where('partnerId', '==', partnerId),
      orderBy('date', 'desc')
    );
    return onSnapshot(q, (querySnapshot) => {
      const transactions = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date?.toDate?.()?.toISOString() || doc.data().date
      })) as RewardTransaction[];
      callback(transactions);
    });
  },

  // Subscribe to ALL reward transactions (admin)
  subscribeToRewardTransactions(callback: (transactions: RewardTransaction[]) => void) {
    const q = query(
      collection(db, 'rewardTransactions'),
      orderBy('date', 'desc')
    );
    return onSnapshot(q, (querySnapshot) => {
      const transactions = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date?.toDate?.()?.toISOString() || doc.data().date
      })) as RewardTransaction[];
      callback(transactions);
    });
  },

  async createRewardTransaction(transaction: Omit<RewardTransaction, 'id'>) {
    try {
      const docRef = await addDoc(collection(db, 'rewardTransactions'), {
        ...transaction,
        date: Timestamp.fromDate(new Date(transaction.date)),
        createdAt: Timestamp.now(),
      });
      return docRef.id;
    } catch (error) {
      throw error;
    }
  },

  async updatePartnerRewardPoints(partnerId: string, points: number) {
    try {
      const docRef = doc(db, 'partners', partnerId);
      await updateDoc(docRef, {
        rewardPoints: points,
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      throw error;
    }
  },

  subscribeToPartnerNotifications(partnerId: string, callback: (notifications: any[]) => void) {
    const q = query(
      collection(db, 'notifications'),
      where('partnerId', '==', partnerId)
    );
    return onSnapshot(q, (querySnapshot) => {
      const notifications = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || doc.data().createdAt,
        sentAt: doc.data().sentAt?.toDate?.()?.toISOString() || doc.data().sentAt,
        readAt: doc.data().readAt?.toDate?.()?.toISOString() || doc.data().readAt
      })).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      callback(notifications);
    });
  },

  subscribeToNotifications(callback: (notifications: Notification[]) => void) {
    const q = query(
      collection(db, 'notifications'),
      orderBy('createdAt', 'desc'),
      limit(500)
    );
    return onSnapshot(q, (querySnapshot) => {
      const notifications = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || doc.data().createdAt,
        sentAt: doc.data().sentAt?.toDate?.()?.toISOString() || doc.data().sentAt,
        readAt: doc.data().readAt?.toDate?.()?.toISOString() || doc.data().readAt
      })) as Notification[];
      callback(notifications);
    });
  },

  async createScheduledPickup(pickup: any) {
    try {
      const docRef = await addDoc(collection(db, 'scheduledPickups'), {
        ...pickup,
        createdAt: Timestamp.now()
      });
      return docRef.id;
    } catch (error) {
      throw error;
    }
  },

  async deleteScheduledPickup(id: string) {
    try {
      const docRef = doc(db, 'scheduledPickups', id);
      await deleteDoc(docRef);
    } catch (error) {
      throw error;
    }
  },

  subscribeToScheduledPickups(partnerId: string, callback: (pickups: any[]) => void) {
    const q = query(
      collection(db, 'scheduledPickups'),
      where('partnerId', '==', partnerId)
    );
    return onSnapshot(q, (querySnapshot) => {
      const pickups = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || doc.data().createdAt
      })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      callback(pickups);
    });
  },

  // Subscribe to ALL scheduled pickups (admin view - shows schedules created by partners)
  subscribeToAllScheduledPickups(callback: (pickups: any[]) => void) {
    const q = query(
      collection(db, 'scheduledPickups'),
      orderBy('date', 'desc')
    );
    return onSnapshot(q, (querySnapshot) => {
      const pickups = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || doc.data().createdAt
      }));
      callback(pickups);
    });
  },

  // Subscription Plans
  async createSubscriptionPlan(plan: Omit<SubscriptionPlan, 'id'>) {
    try {
      const docRef = await addDoc(collection(db, 'subscriptionPlans'), {
        ...plan,
        createdAt: Timestamp.now(),
      });
      return docRef.id;
    } catch (error) {
      throw error;
    }
  },

  async getSubscriptionPlans() {
    try {
      const querySnapshot = await getDocs(collection(db, 'subscriptionPlans'));
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as SubscriptionPlan[];
    } catch (error) {
      throw error;
    }
  },

  subscribeToSubscriptionPlans(callback: (plans: SubscriptionPlan[]) => void) {
    const q = collection(db, 'subscriptionPlans');
    return onSnapshot(q, (querySnapshot) => {
      const plans = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as SubscriptionPlan[];
      callback(plans);
    });
  },

  async updateSubscriptionPlan(id: string, updates: Partial<SubscriptionPlan>) {
    try {
      const docRef = doc(db, 'subscriptionPlans', id);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      throw error;
    }
  },

  async deleteSubscriptionPlan(id: string) {
    try {
      const docRef = doc(db, 'subscriptionPlans', id);
      await deleteDoc(docRef);
    } catch (error) {
      throw error;
    }
  },

  // Subscribe to all waste requests (admin)
  async createUser(userId: string, userData: any) {
    try {
      const docRef = doc(db, 'users', userId);
      await updateDoc(docRef, {
        ...userData,
        createdAt: Timestamp.now(),
      });
    } catch (error) {
      // If document doesn't exist, create it
      const docRef = doc(db, 'users', userId);
      await addDoc(collection(db, 'users'), {
        ...userData,
        createdAt: Timestamp.now(),
      });
    }
  },

  async updateUser(userId: string, updates: any) {
    try {
      const docRef = doc(db, 'users', userId);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      throw error;
    }
  },

  async getUser(userId: string) {
    try {
      const docRef = doc(db, 'users', userId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() };
      }
      return null;
    } catch (error) {
      throw error;
    }
  },

  async updateUserRewardPoints(userId: string, points: number) {
    try {
      const docRef = doc(db, 'users', userId);
      await updateDoc(docRef, {
        rewardPoints: points,
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      throw error;
    }
  },

  subscribeToWasteRequests(callback: (requests: WasteRequest[]) => void) {
    const q = collection(db, 'wasteRequests');
    return onSnapshot(q, (querySnapshot) => {
      const requests = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          date: data.date?.toDate?.()?.toISOString() || data.date,
          createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt
        };
      }) as WasteRequest[];
      callback(requests);
    });
  },
};
