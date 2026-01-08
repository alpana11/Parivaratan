import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  onSnapshot
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { WasteRequest, ImpactMetrics, Voucher, RewardTransaction, Partner, Notification, AuditLog, RewardRule, RewardCampaign } from '../types';

export const dbService = {
  // Waste Requests
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
        date: doc.data().date?.toDate?.()?.toISOString() || doc.data().date
      })) as WasteRequest[];
    } catch (error) {
      throw error;
    }
  },

  async updateWasteRequest(id: string, updates: Partial<WasteRequest>) {
    try {
      const docRef = doc(db, 'wasteRequests', id);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
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
  async getRewardTransactions(partnerId?: string) {
    try {
      let q;
      if (partnerId) {
        q = query(
          collection(db, 'rewardTransactions'),
          where('partnerId', '==', partnerId),
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
  subscribeToWasteRequests(callback: (requests: WasteRequest[]) => void) {
    const q = collection(db, 'wasteRequests');
    return onSnapshot(q, (querySnapshot) => {
      const requests = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date?.toDate?.()?.toISOString() || doc.data().date
      })) as WasteRequest[];
      callback(requests);
    });
  },

  subscribeToWasteRequestsForPartner(partnerId: string, callback: (requests: WasteRequest[]) => void) {
    console.log('subscribeToWasteRequestsForPartner: Setting up subscription for partner:', partnerId);
    const q = query(collection(db, 'wasteRequests'), where('partnerId', '==', partnerId));
    return onSnapshot(q, (querySnapshot) => {
      console.log('subscribeToWasteRequestsForPartner: Snapshot received, docs count:', querySnapshot.docs.length);
      const requests = querySnapshot.docs.map(doc => {
        const data = {
          id: doc.id,
          ...doc.data(),
          date: doc.data().date?.toDate?.()?.toISOString() || doc.data().date
        };
        console.log('subscribeToWasteRequestsForPartner: Processing doc:', data);
        return data;
      }) as WasteRequest[];
      console.log('subscribeToWasteRequestsForPartner: Final requests for partner', partnerId, ':', requests);
      callback(requests);
    }, (error) => {
      console.error('subscribeToWasteRequestsForPartner: Error in subscription:', error);
    });
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
};
