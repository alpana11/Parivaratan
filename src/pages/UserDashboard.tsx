import React, { useState, useEffect } from 'react';
import { collection, doc, getDoc, getDocs, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Voucher } from '../types';
import { dbService } from '../services/dbService';

const UserDashboard: React.FC = () => {
  const userId = 'user-123'; // Hardcoded for now
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [userPoints, setUserPoints] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Auto-create user if doesn't exist
    const initUser = async () => {
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);
      if (!userDoc.exists()) {
        await setDoc(userRef, {
          name: 'User',
          email: 'user@example.com',
          rewardPoints: 0,
          createdAt: new Date().toISOString()
        });
      }
    };
    initUser();

    // Listen to user points
    const userRef = doc(db, 'users', userId);
    const unsubUser = onSnapshot(userRef, (doc) => {
      if (doc.exists()) {
        setUserPoints(doc.data().rewardPoints || 0);
      }
    });

    // Listen to vouchers
    const unsubVouchers = onSnapshot(collection(db, 'vouchers'), (snapshot) => {
      const data = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as Voucher))
        .filter(v => v.status === 'available');
      setVouchers(data);
      setLoading(false);
    });

    return () => {
      unsubUser();
      unsubVouchers();
    };
  }, []);

  const handleRedeem = async (voucher: Voucher) => {
    if (userPoints < voucher.pointsRequired) {
      alert(`You need ${voucher.pointsRequired - userPoints} more points to redeem this voucher`);
      return;
    }

    try {
      // Deduct points
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);
      const currentPoints = userDoc.data()?.rewardPoints || 0;
      
      await dbService.updateUser(userId, {
        rewardPoints: currentPoints - voucher.pointsRequired
      });

      // Create transaction
      await dbService.createRewardTransaction({
        userId,
        type: 'redeemed',
        points: -voucher.pointsRequired,
        description: `Redeemed: ${voucher.title}`,
        date: new Date().toISOString(),
        voucherId: voucher.id
      });

      // Update voucher
      await dbService.updateVoucher(voucher.id, {
        status: 'redeemed',
        redeemedBy: [...(voucher.redeemedBy || []), userId],
        currentRedemptions: (voucher.currentRedemptions || 0) + 1
      });

      alert('Voucher redeemed successfully!');
    } catch (error) {
      console.error('Error redeeming voucher:', error);
      alert('Failed to redeem voucher');
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="text-2xl">Loading...</div></div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-blue-50 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Points Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Your Reward Points</h2>
              <p className="text-gray-600">Earn points by submitting waste requests</p>
            </div>
            <div className="text-5xl font-bold text-emerald-600">{userPoints}</div>
          </div>
        </div>

        {/* Vouchers */}
        <h1 className="text-4xl font-bold text-gray-900 mb-8 text-center">🎁 Available Vouchers</h1>
        
        {vouchers.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl shadow-lg">
            <div className="text-6xl mb-4">🎟️</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Vouchers Available</h3>
            <p className="text-gray-600">Check back later for new offers!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {vouchers.map((voucher) => {
              const canRedeem = userPoints >= voucher.pointsRequired;
              return (
                <div key={voucher.id} className="bg-white rounded-2xl shadow-xl overflow-hidden">
                  <img
                    src={voucher.image}
                    alt={voucher.title}
                    className="w-full h-48 object-cover"
                    onError={(e) => {
                      e.currentTarget.src = 'https://via.placeholder.com/400x200?text=Voucher';
                    }}
                  />
                  <div className="p-6">
                    <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-full">
                      {voucher.category}
                    </span>
                    <h3 className="text-xl font-bold text-gray-900 mt-3 mb-2">{voucher.title}</h3>
                    <p className="text-gray-600 text-sm mb-4">{voucher.description}</p>
                    <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                      <div>
                        <div className="text-2xl font-bold text-emerald-600">{voucher.pointsRequired}</div>
                        <div className="text-xs text-gray-500">Points Required</div>
                      </div>
                      <button
                        onClick={() => handleRedeem(voucher)}
                        disabled={!canRedeem}
                        className={`px-6 py-2 rounded-lg font-medium transition-all ${
                          canRedeem
                            ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                            : 'bg-gray-300 text-gray-600 cursor-not-allowed'
                        }`}
                      >
                        {canRedeem ? 'Redeem' : 'Not Enough Points'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-12 bg-white rounded-2xl shadow-lg p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">How to Earn Points?</h2>
          <p className="text-gray-600 mb-6">Submit waste requests and earn reward points!</p>
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

export default UserDashboard;
