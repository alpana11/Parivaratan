export type PartnerStatus = 'pending' | 'approved';

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
}

export interface ImpactMetrics {
  wasteProcessed: number; // in kg
  co2Reduction: number; // in kg
}

export interface Partner {
  id: string;
  name: string;
  email: string;
  status: PartnerStatus;
  documents: string[]; // uploaded document URLs
  rewardPoints: number;
}

export interface Voucher {
  id: string;
  title: string;
  description: string;
  pointsRequired: number;
  image: string;
  category: string;
  status: 'available' | 'redeemed';
  redeemedDate?: string;
}

export interface RewardTransaction {
  id: string;
  type: 'earned' | 'redeemed';
  points: number;
  description: string;
  date: string;
  voucherId?: string;
}