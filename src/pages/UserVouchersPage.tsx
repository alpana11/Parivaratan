import React, { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Voucher } from '../types';
import { dbService } from '../services/dbService';

const UserVouchersPage: React.FC = () => {
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userPoints, setUserPoints] = useState(0);
  const userId = 'user-123'; // Replace with actual user ID from auth

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      console.log('Fetching vouchers...');
      const snapshot = await getDocs(collection(db, 'vouchers'));
      console.log('Snapshot size:', snapshot.size);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Voucher[];
      console.log('Vouchers:', data);
      setVouchers(data.filter(v => v.status === 'available'));
      
      // Fetch user points
      const user = await dbService.getUser(userId);
      if (user) {
        setUserPoints(user.rewardPoints || 0);
      }
    } catch (err: any) {
      console.error('Error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRedeem = async (voucher: Voucher) => {
    if (userPoints < voucher.pointsRequired) {
      alert('Insufficient points!');
      return;
    }

    if (!confirm(`Redeem ${voucher.title} for ${voucher.pointsRequired} points?`)) {
      return;
    }

    try {
      // Deduct points
      const newPoints = userPoints - voucher.pointsRequired;
      await dbService.updateUserRewardPoints(userId, newPoints);

      // Create transaction
      await dbService.addRewardTransaction({
        userId,
        type: 'redeemed',
        points: -voucher.pointsRequired,
        description: `Redeemed ${voucher.title}`,
        date: new Date().toISOString(),
        voucherId: voucher.id
      });

      // Update voucher
      await dbService.updateVoucher(voucher.id, {
        redeemedBy: [...(voucher.redeemedBy || []), userId],
        currentRedemptions: (voucher.currentRedemptions || 0) + 1
      });

      alert('Voucher redeemed successfully!');
      fetchData(); // Refresh data
    } catch (err: any) {
      console.error('Redemption error:', err);
      alert('Failed to redeem voucher');
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="text-2xl">Loading...</div></div>;
  if (error) return <div className="min-h-screen flex items-center justify-center"><div className="text-2xl text-red-600">Error: {error}</div></div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-blue-50 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">🎁 Available Vouchers</h1>
          <p className="text-lg text-gray-600 mb-4">Redeem your reward points for exciting offers</p>
          <div className="inline-block bg-gradient-to-r from-emerald-600 to-green-600 text-white px-8 py-4 rounded-2xl shadow-lg">
            <div className="text-3xl font-bold">{userPoints}</div>
            <div className="text-sm">Your Points</div>
          </div>
        </div>

        {vouchers.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl shadow-lg">
            <div className="text-6xl mb-4">🎟️</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Vouchers Available</h3>
            <p className="text-gray-600">Check back later for new offers!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {vouchers.map((voucher) => (
              <div key={voucher.id} className="bg-white rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition-shadow duration-300">
                <img
                  src={voucher.image}
                  alt={voucher.title}
                  className="w-full h-48 object-cover"
                  onError={(e) => {
                    e.currentTarget.src = 'https://via.placeholder.com/400x200?text=Voucher';
                  }}
                />
                <div className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-full">
                      {voucher.category}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{voucher.title}</h3>
                  <p className="text-gray-600 text-sm mb-4">{voucher.description}</p>
                  <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                    <div>
                      <div className="text-2xl font-bold text-emerald-600">{voucher.pointsRequired}</div>
                      <div className="text-xs text-gray-500">Points Required</div>
                    </div>
                    <button
                      onClick={() => handleRedeem(voucher)}
                      disabled={userPoints < voucher.pointsRequired}
                      className={`px-6 py-2 rounded-lg font-medium transition-all ${
                        userPoints >= voucher.pointsRequired
                          ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                          : 'bg-gray-300 text-gray-600 cursor-not-allowed'
                      }`}
                    >
                      {userPoints >= voucher.pointsRequired ? 'Redeem' : 'Insufficient Points'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-12 bg-white rounded-2xl shadow-lg p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">How to Earn Points?</h2>
          <p className="text-gray-600 mb-6">Submit waste requests and earn reward points to redeem these vouchers!</p>
          <a
            href="/user/waste-request"
            className="inline-block px-8 py-3 bg-gradient-to-r from-emerald-600 to-green-600 text-white font-bold rounded-xl hover:from-emerald-700 hover:to-green-700 transition-all duration-300"
          >
            Submit Waste Request
          </a>
        </div>
      </div>
    </div>
  );
};

export default UserVouchersPage;
