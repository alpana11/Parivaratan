import { WasteRequest, ImpactMetrics, Partner, Voucher, RewardTransaction } from '../types';

export const mockPartner: Partner = {
  id: '1',
  name: 'John Doe',
  email: 'john@example.com',
  status: 'approved', // Change to 'pending' to test verification page
  documents: ['doc1.pdf', 'doc2.pdf'],
  rewardPoints: 1250,
};

export const mockWasteRequests: WasteRequest[] = [
  {
    id: '1',
    image: 'https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?w=300&h=200&fit=crop',
    type: 'Plastic Bottles',
    confidence: 95,
    quantity: '10 kg',
    location: 'Downtown Area',
    status: 'Assigned',
    date: '2025-12-24T10:00:00Z',
  },
  {
    id: '2',
    image: 'https://images.unsplash.com/photo-1586957969945-48e2bb3b45e8?w=300&h=200&fit=crop',
    type: 'Paper Waste',
    confidence: 88,
    quantity: '5 kg',
    location: 'Residential Zone',
    status: 'Accepted',
    date: '2025-12-23T14:00:00Z',
  },
  {
    id: '3',
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300&h=200&fit=crop',
    type: 'Electronic Waste',
    confidence: 92,
    quantity: '2 kg',
    location: 'Industrial Area',
    status: 'In Progress',
    date: '2025-12-22T09:00:00Z',
  },
  {
    id: '4',
    image: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=300&h=200&fit=crop',
    type: 'Organic Waste',
    confidence: 78,
    quantity: '15 kg',
    location: 'Market Area',
    status: 'Completed',
    date: '2025-12-21T16:00:00Z',
  },
];

export const mockImpactMetrics: ImpactMetrics = {
  wasteProcessed: 1250, // kg
  co2Reduction: 375, // kg
};

export const mockPickupHistory = mockWasteRequests.filter(req => req.status === 'Completed');

export const mockNotifications = [
  { id: '1', message: 'New waste request assigned', date: '2025-12-24T08:00:00Z', read: false },
  { id: '2', message: 'Pickup completed successfully', date: '2025-12-23T15:00:00Z', read: true },
  { id: '3', message: 'Verification approved', date: '2025-12-20T12:00:00Z', read: true },
];

export const mockVouchers: Voucher[] = [
  {
    id: '1',
    title: '₹500 Amazon Gift Card',
    description: 'Redeem for ₹500 Amazon gift card',
    pointsRequired: 1000,
    image: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=300&h=200&fit=crop',
    category: 'Gift Cards',
    status: 'available',
  },
  {
    id: '2',
    title: '₹200 Flipkart Voucher',
    description: 'Get ₹200 off on your next Flipkart purchase',
    pointsRequired: 400,
    image: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=300&h=200&fit=crop',
    category: 'E-commerce',
    status: 'available',
  },
  {
    id: '3',
    title: '₹300 Food Delivery Credit',
    description: '₹300 credit for Swiggy or Zomato',
    pointsRequired: 600,
    image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=300&h=200&fit=crop',
    category: 'Food',
    status: 'available',
  },
  {
    id: '4',
    title: '₹1000 Fuel Voucher',
    description: '₹1000 worth fuel voucher for any petrol pump',
    pointsRequired: 2000,
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300&h=200&fit=crop',
    category: 'Fuel',
    status: 'available',
  },
  {
    id: '5',
    title: '₹250 Grocery Voucher',
    description: '₹250 voucher for BigBasket or local grocery store',
    pointsRequired: 500,
    image: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=300&h=200&fit=crop',
    category: 'Grocery',
    status: 'redeemed',
    redeemedDate: '2025-12-20T10:00:00Z',
  },
];

export const mockRewardTransactions: RewardTransaction[] = [
  {
    id: '1',
    type: 'earned',
    points: 50,
    description: 'Completed plastic waste pickup',
    date: '2025-12-21T16:00:00Z',
  },
  {
    id: '2',
    type: 'earned',
    points: 25,
    description: 'Completed paper waste pickup',
    date: '2025-12-20T14:00:00Z',
  },
  {
    id: '3',
    type: 'redeemed',
    points: -500,
    description: 'Redeemed ₹250 Grocery Voucher',
    date: '2025-12-20T10:00:00Z',
    voucherId: '5',
  },
  {
    id: '4',
    type: 'earned',
    points: 75,
    description: 'Completed electronic waste pickup',
    date: '2025-12-19T12:00:00Z',
  },
  {
    id: '5',
    type: 'earned',
    points: 30,
    description: 'Completed organic waste pickup',
    date: '2025-12-18T09:00:00Z',
  },
];