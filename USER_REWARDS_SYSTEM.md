# User Reward Points System - Implementation Guide

## Problem
Users couldn't earn reward points - only partners had this feature.

## Solution Implemented

### 1. **Added User Type with Reward Points**
```typescript
export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  rewardPoints: number;  // NEW FIELD
  createdAt: string;
}
```

### 2. **Updated RewardTransaction to Support Users**
```typescript
export interface RewardTransaction {
  partnerId?: string;  // Optional now
  userId?: string;     // NEW - for user transactions
  type: 'earned' | 'redeemed';
  points: number;
  description: string;
  date: string;
  voucherId?: string;
  wasteRequestId?: string;
}
```

### 3. **Added Database Methods**
- `getUser(userId)` - Get user data
- `updateUserRewardPoints(userId, points)` - Update user points
- `getRewardTransactions(partnerId?, userId?)` - Get transactions for users or partners

### 4. **User Earns Points When Submitting Waste Request**
**File**: `UserWasteRequestPage.tsx`

When user submits waste request:
1. Creates waste request
2. Awards 10 points to user
3. Updates user's rewardPoints in database
4. Creates reward transaction record
5. Shows success message with points earned

### 5. **User Can Redeem Vouchers**
**Files**: `UserVouchersPage.tsx`, `UserDashboard.tsx`

Features:
- Display user's current points at top
- Show all available vouchers
- Enable/disable "Redeem" button based on points
- Deduct points when voucher redeemed
- Create transaction record
- Update voucher redemption count

## How It Works

### For Users:
1. **Earn Points**: Submit waste request → Get 10 points
2. **View Points**: Dashboard shows current points balance
3. **Redeem Vouchers**: Browse vouchers and redeem if enough points
4. **Track History**: All transactions recorded in `rewardTransactions` collection

### For Partners:
- Partners earn points when completing pickups (existing system)
- Separate point system from users

## Database Collections

### `users` Collection
```json
{
  "id": "user-123",
  "name": "John Doe",
  "email": "john@example.com",
  "rewardPoints": 50,
  "createdAt": "2025-01-15T10:00:00Z"
}
```

### `rewardTransactions` Collection
```json
{
  "id": "txn-123",
  "userId": "user-123",
  "type": "earned",
  "points": 10,
  "description": "Submitted Plastic Bottles waste request",
  "date": "2025-01-15T10:00:00Z",
  "wasteRequestId": "req-456"
}
```

## Point System Rules

### Users Earn Points For:
- ✅ Submitting waste request: **10 points**
- 🔜 Request completed by partner: **20 points** (future)
- 🔜 Referring friends: **50 points** (future)

### Users Spend Points On:
- Redeeming vouchers (varies by voucher)

## Testing Steps

1. **Test Point Earning**:
   - Go to `/user/waste-request`
   - Submit a waste request
   - Check alert shows "You earned 10 points!"
   - Verify points in database

2. **Test Point Display**:
   - Go to `/user/dashboard` or `/user/vouchers`
   - See points displayed at top

3. **Test Voucher Redemption**:
   - Go to `/user/vouchers`
   - Click "Redeem" on voucher (if enough points)
   - Confirm redemption
   - Verify points deducted

## Future Enhancements

1. **More Ways to Earn Points**:
   - Bonus points for completing pickup
   - Daily login rewards
   - Referral bonuses
   - Streak bonuses

2. **Point Multipliers**:
   - 2x points on weekends
   - Bonus for specific waste types
   - Campaign-based multipliers

3. **Point Expiry**:
   - Points expire after 1 year
   - Warning notifications before expiry

4. **Leaderboard**:
   - Top users by points earned
   - Monthly competitions
   - Badges and achievements

## Important Notes

⚠️ **Replace Hardcoded User ID**: Currently using `'user-123'` - replace with actual authenticated user ID from Firebase Auth

⚠️ **Auto-Create User**: UserDashboard auto-creates user document if doesn't exist

⚠️ **Separate Systems**: Users and Partners have separate reward point systems
