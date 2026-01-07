export type PartnerStatus = 'pending' | 'approved' | 'rejected' | 'subscription_required';
export type SubscriptionStatus = 'none' | 'pending' | 'active' | 'expired';
export type SubscriptionDuration = 'monthly' | 'yearly';

export interface SubscriptionPlan {
  id: string;
  name: string;
  amount: number;
  duration: SubscriptionDuration;
  features: string[];
  isActive: boolean;
}

export interface PartnerSubscription {
  planId: string;
  status: SubscriptionStatus;
  startDate: string;
  expiryDate: string;
  amount: number;
  paymentMethod?: string;
  transactionId?: string;
}

export type WasteRequestStatus = 'Assigned' | 'Accepted' | 'In Progress' | 'Completed';

export interface WasteRequest {
  id: string;
  image: string; // URL or path to image
  type: string; // AI-classified type
  confidence: number; // 0-100
  quantity: string; // e.g., "5 kg"
  location: string;
  status: WasteRequestStatus;
  date: string; // ISO date
  assignedPartner?: string; // Partner ID
  aiRecommendedPartner?: string;
}

export interface ImpactMetrics {
  wasteProcessed: number; // in kg
  co2Reduction: number; // in kg
}

export type DocumentType = 'registration_certificate' | 'id_proof' | 'address_proof';
export type VerificationStatus = 'pending' | 'approved' | 'rejected';

export interface PartnerDocument {
  type: DocumentType;
  url: string;
  uploadedAt: string;
  verified: VerificationStatus;
  remarks?: string;
}

export interface Partner {
  id: string;
  name: string;
  email: string;
  verificationStatus: VerificationStatus;
  documents: PartnerDocument[]; // Changed from string[] to PartnerDocument[]
  rewardPoints: number;
  phone?: string;
  organization?: string;
  partnerType?: string;
  address?: string;
  subscription?: PartnerSubscription;
  subscriptionStatus?: SubscriptionStatus;
  serviceAreas?: string[];
  capacity?: string;
  supportedWasteTypes?: string[];
  verificationRemarks?: string;
}

export interface Voucher {
  id: string;
  title: string;
  description: string;
  pointsRequired: number;
  image: string;
  category: string;
  status: 'available' | 'redeemed' | 'expired' | 'inactive';
  expiryDate: string;
  createdAt: string;
  assignedPartners?: string[]; // Partner IDs this voucher is assigned to
  redeemedBy?: string[]; // Partner IDs who redeemed this voucher
  maxRedemptions?: number; // Optional limit on total redemptions
  currentRedemptions?: number;
}

export interface VoucherAssignment {
  id: string;
  voucherId: string;
  partnerId: string;
  assignedAt: string;
  redeemedAt?: string;
  status: 'assigned' | 'redeemed' | 'expired';
}

export interface RewardRule {
  id: string;
  wasteType: string;
  pointsPerKg: number;
  isActive: boolean;
  createdAt: string;
}

export interface RewardCampaign {
  id: string;
  name: string;
  description: string;
  multiplier: number; // e.g., 1.5x points
  startDate: string;
  endDate: string;
  isActive: boolean;
  targetWasteTypes?: string[]; // Optional: specific waste types this applies to
  createdAt: string;
}

export interface RewardTransaction {
  id: string;
  partnerId: string;
  type: 'earned' | 'redeemed';
  points: number;
  description: string;
  date: string;
  voucherId?: string;
  wasteRequestId?: string; // Link to completed pickup
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  amount: number;
  duration: 'monthly' | 'yearly';
  isActive: boolean;
}

export interface AdminUser {
  id: string;
  email: string;
  role: 'admin';
  name: string;
}

export interface AuditLog {
  id: string;
  adminId: string;
  adminName: string;
  action: string;
  actionType: 'create' | 'update' | 'delete' | 'verify' | 'assign' | 'override' | 'send' | 'login' | 'logout';
  details: string;
  timestamp: string;
  entityType: 'partner' | 'waste_request' | 'subscription' | 'reward' | 'voucher' | 'notification' | 'schedule' | 'system';
  entityId: string;
  previousValue?: any;
  newValue?: any;
  ipAddress?: string;
  userAgent?: string;
  metadata?: {
    wasteRequestId?: string;
    partnerId?: string;
    subscriptionId?: string;
    rewardId?: string;
    voucherId?: string;
    verificationStatus?: string;
    assignmentOverride?: boolean;
    [key: string]: any;
  };
}

export interface Notification {
  id: string;
  partnerId?: string; // undefined for broadcast notifications
  title: string;
  message: string;
  type: 'verification' | 'pickup' | 'reward' | 'subscription' | 'system' | 'broadcast';
  status: 'sent' | 'pending' | 'failed';
  createdAt: string;
  sentAt?: string;
  readAt?: string;
  priority: 'low' | 'medium' | 'high';
  category: 'verification_update' | 'pickup_assignment' | 'reward_announcement' | 'subscription_reminder' | 'system_alert' | 'general';
  metadata?: {
    wasteRequestId?: string;
    rewardId?: string;
    subscriptionId?: string;
    verificationStatus?: string;
    pickupDate?: string;
    [key: string]: any;
  };
}

export interface PickupSchedule {
  id: string;
  area: string;
  date: string; // ISO date string
  timeSlot: string; // e.g., "09:00-11:00"
  assignedPartnerId: string;
  wasteRequestIds: string[]; // IDs of waste requests scheduled for this slot
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AreaSchedule {
  area: string;
  schedules: PickupSchedule[];
  assignedPartners: string[]; // Partner IDs assigned to this area
  capacity: number; // Max pickups per day
  priority: 'low' | 'medium' | 'high';
}