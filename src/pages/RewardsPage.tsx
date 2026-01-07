import React, { useState, useEffect } from 'react';
import { Voucher, RewardRule } from '../types';
import { useAuth } from '../hooks/useAuth';
import { dbService } from '../services/dbService';

const RewardsPage: React.FC = () => {
  const { partner } = useAuth();
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [rewardRules, setRewardRules] = useState<RewardRule[]>([]);
  const [partnerRewardPoints, setPartnerRewardPoints] = useState(0);
  const [redeemedVouchers, setRedeemedVouchers] = useState<any[]>([]);
  const [showRedeemModal, setShowRedeemModal] = useState(false);
  const [selectedVoucher, setSelectedVoucher] = useState<Voucher | null>(null);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  useEffect(() => {
    // Load partner points from localStorage
    const currentPartner = JSON.parse(localStorage.getItem('currentPartner') || '{}');
    const partnersData = JSON.parse(localStorage.getItem('partners') || '[]');

    let partnerData = currentPartner;
    if (!partnerData.email && partnersData.length > 0) {
      partnerData = partnersData[0];
    }

    setPartnerRewardPoints(partnerData.rewardPoints || 1250);

    // Load redeemed vouchers from localStorage
    const redeemed = JSON.parse(localStorage.getItem('redeemedVouchers') || '[]');
    setRedeemedVouchers(redeemed);

    // Set up real-time listeners for Firestore data
    const unsubscribeRewardRules = dbService.listenToRewardRules((rules) => {
      setRewardRules(rules);
    });

    const unsubscribeVouchers = dbService.listenToVouchers((voucherList) => {
      setVouchers(voucherList);
    });

    return () => {
      unsubscribeRewardRules();
      unsubscribeVouchers();
    };
  }, []);

  const handleRedeemClick = (voucher: Voucher) => {
    setSelectedVoucher(voucher);
    setShowRedeemModal(true);
  };

  const confirmRedemption = async () => {
    if (!selectedVoucher) return;

    if (partnerRewardPoints < selectedVoucher.pointsRequired) return;

    try {
      // Update points in localStorage
      const newPoints = partnerRewardPoints - selectedVoucher.pointsRequired;
      setPartnerRewardPoints(newPoints);
      
      // Update partner data in localStorage
      const currentPartner = JSON.parse(localStorage.getItem('currentPartner') || '{}');
      currentPartner.rewardPoints = newPoints;
      localStorage.setItem('currentPartner', JSON.stringify(currentPartner));
      
      // Add to redeemed vouchers
      const redeemed = JSON.parse(localStorage.getItem('redeemedVouchers') || '[]');
      redeemed.push({
        ...selectedVoucher,
        redeemedDate: new Date().toISOString(),
        redeemedBy: currentPartner.id || 'demo-partner'
      });
      localStorage.setItem('redeemedVouchers', JSON.stringify(redeemed));
      setRedeemedVouchers(redeemed);

      setShowRedeemModal(false);
      setShowSuccessMessage(true);

      setTimeout(() => setShowSuccessMessage(false), 3000);
    } catch (error) {
      console.error('Error redeeming voucher:', error);
      alert('Failed to redeem voucher');
    }
  };

  const availableVouchers = vouchers.filter(voucher => {
    // Check if voucher is already redeemed
    const isRedeemed = redeemedVouchers.find(r => r.id === voucher.id);
    if (isRedeemed) return false;

    // Check if voucher is assigned to this partner or available to all
    const partnerId = partner?.id;
    if (!partnerId) return false;

    // If voucher has assignedPartners, check if this partner is included
    if (voucher.assignedPartners && voucher.assignedPartners.length > 0) {
      return voucher.assignedPartners.includes(partnerId);
    }

    // If no assignedPartners specified, voucher is available to all partners
    return true;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Rewards & Vouchers</h1>
        <p className="text-gray-600">Redeem your reward points for exciting vouchers and offers</p>
      </div>

      {/* Points Balance */}
      <div className="bg-gradient-to-r from-amber-500 to-yellow-500 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">Reward Points Balance</h2>
            <p className="text-amber-100">Earn points by completing waste pickups</p>
          </div>
          <div className="text-right">
            <div className="text-4xl font-bold">0</div>
            <div className="text-amber-100">Points Available</div>
          </div>
        </div>
      </div>

      {/* Success Message */}
      {showSuccessMessage && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-green-800">Voucher redeemed successfully!</p>
            </div>
          </div>
        </div>
      )}

      {/* Reward Rules */}
      {rewardRules.length > 0 && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Reward Rules</h2>
            <div className="space-y-4">
              {rewardRules.map((rule) => (
                <div key={rule.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900">{rule.wasteType}</h3>
                      <p className="text-sm text-gray-600">Points per kg</p>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-bold text-green-600">+{rule.pointsPerKg} Points/kg</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Voucher Marketplace */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Available Vouchers</h2>
          {availableVouchers.length === 0 ? (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No vouchers available</h3>
              <p className="mt-1 text-sm text-gray-500">Check back later for new voucher offers.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {availableVouchers.map((voucher) => (
                <div key={voucher.id} className="border rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
                  <img
                    src={voucher.image}
                    alt={voucher.title}
                    className="w-full h-48 object-cover"
                  />
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900">{voucher.title}</h3>
                    <p className="text-sm text-gray-600 mt-1">{voucher.description}</p>
                    <div className="flex items-center justify-between mt-4">
                      <span className="text-lg font-bold text-amber-600">{voucher.pointsRequired} Points</span>
                      <button
                        onClick={() => handleRedeemClick(voucher)}
                        disabled={partnerRewardPoints < voucher.pointsRequired}
                        className={`px-4 py-2 rounded-lg font-medium text-sm ${
                          partnerRewardPoints >= voucher.pointsRequired
                            ? 'bg-amber-500 text-white hover:bg-amber-600'
                            : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                        }`}
                      >
                        Redeem
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Redeemed Vouchers */}
      {redeemedVouchers.length > 0 && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Redeemed Vouchers</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {redeemedVouchers.map((voucher) => (
                <div key={voucher.id} className="border rounded-lg overflow-hidden opacity-75">
                  <div className="relative">
                    <img
                      src={voucher.image}
                      alt={voucher.title}
                      className="w-full h-48 object-cover"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                      <span className="text-white font-semibold">REDEEMED</span>
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900">{voucher.title}</h3>
                    <p className="text-sm text-gray-600 mt-1">{voucher.description}</p>
                    <p className="text-sm text-green-600 mt-2">
                      Redeemed on {voucher.redeemedDate ? new Date(voucher.redeemedDate).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Reward History */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b pb-4">
              <div className="flex items-center">
                <div className="p-2 rounded-lg mr-4 bg-green-100">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Completed plastic waste pickup</p>
                  <p className="text-sm text-gray-600">{new Date().toLocaleDateString()}</p>
                </div>
              </div>
              <span className="font-semibold text-green-600">+50 Points</span>
            </div>
            <div className="flex items-center justify-between border-b pb-4">
              <div className="flex items-center">
                <div className="p-2 rounded-lg mr-4 bg-green-100">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Completed organic waste collection</p>
                  <p className="text-sm text-gray-600">{new Date(Date.now() - 24 * 60 * 60 * 1000).toLocaleDateString()}</p>
                </div>
              </div>
              <span className="font-semibold text-green-600">+75 Points</span>
            </div>
            {redeemedVouchers.map((voucher, index) => (
              <div key={index} className="flex items-center justify-between border-b pb-4">
                <div className="flex items-center">
                  <div className="p-2 rounded-lg mr-4 bg-red-100">
                    <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Redeemed {voucher.title}</p>
                    <p className="text-sm text-gray-600">{new Date(voucher.redeemedDate).toLocaleDateString()}</p>
                  </div>
                </div>
                <span className="font-semibold text-red-600">-{voucher.pointsRequired} Points</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Redemption Modal */}
      {showRedeemModal && selectedVoucher && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Confirm Redemption</h3>
            <div className="flex items-center mb-4">
              <img
                src={selectedVoucher.image}
                alt={selectedVoucher.title}
                className="w-16 h-16 rounded-lg object-cover mr-4"
              />
              <div>
                <h4 className="font-medium text-gray-900">{selectedVoucher.title}</h4>
                <p className="text-sm text-gray-600">{selectedVoucher.pointsRequired} Points</p>
              </div>
            </div>
            <p className="text-gray-600 mb-6">
              Are you sure you want to redeem this voucher? {selectedVoucher.pointsRequired} points will be deducted from your balance.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={confirmRedemption}
                className="flex-1 bg-amber-500 text-white py-2 px-4 rounded-lg font-medium hover:bg-amber-600"
              >
                Confirm
              </button>
              <button
                onClick={() => setShowRedeemModal(false)}
                className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg font-medium hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RewardsPage;