import React, { useState, useEffect } from 'react';
import { dbService } from '../services/dbService';
import { Partner } from '../types';

const AdminPartnersPage: React.FC = () => {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'verified' | 'rejected'>('all');
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);
  const [showPerformanceModal, setShowPerformanceModal] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [updatedPartners, setUpdatedPartners] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Set up real-time listener for partners
    const unsubscribe = dbService.subscribeToPartners((partnersList) => {
      setPartners(partnersList);
      setLoading(false);
    });

    // Initial load
    loadPartners();

    // Cleanup listener on unmount
    return () => unsubscribe();
  }, []);

  const loadPartners = async () => {
    try {
      const allPartners = await dbService.getAllPartners();
      setPartners(allPartners);
    } catch (error) {
      console.error('Error loading partners:', error);
      setPartners([]);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (partnerId: string, newStatus: string) => {
    try {
      await dbService.updatePartner(partnerId, { verificationStatus: newStatus as Partner['verificationStatus'] });
      setPartners(partners.map(p =>
        p.id === partnerId ? { ...p, verificationStatus: newStatus as Partner['verificationStatus'] } : p
      ));
      setUpdatedPartners(prev => new Set(prev).add(partnerId));
    } catch (error) {
      console.error('Error updating partner status:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'approved': return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'Pending Verification';
      case 'approved': return 'Verified';
      case 'rejected': return 'Rejected';
      default: return status;
    }
  };

  const filteredPartners = partners.filter(p => {
    if (filter === 'all') return true;
    if (filter === 'pending') return p.verificationStatus === 'pending';
    if (filter === 'verified') return p.verificationStatus === 'approved';
    if (filter === 'rejected') return p.verificationStatus === 'rejected';
    return true;
  });

  const getPartnerPerformance = (partner: Partner) => {
    // Mock performance data - in real app, this would come from database
    return {
      totalRequests: 45,
      completedRequests: 42,
      successRate: 93,
      averageRating: 4.7,
      totalWasteProcessed: 1250, // kg
      co2Reduction: 312.5 // kg
    };
  };

  const getPartnerSubscription = (partner: Partner) => {
    return {
      status: partner.subscription?.status || 'none',
      expiry: partner.subscription?.expiryDate || 'N/A',
      totalEarned: partner.rewardPoints || 0,
      redeemedVouchers: 8
    };
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">🧑‍🤝‍🧑 Partner Management</h2>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                filter === 'all'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All ({partners.length})
            </button>
            <button
              onClick={() => setFilter('pending')}
              className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                filter === 'pending'
                  ? 'bg-yellow-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Pending ({partners.filter(p => p.verificationStatus === 'pending').length})
            </button>
            <button
              onClick={() => setFilter('verified')}
              className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                filter === 'verified'
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Verified ({partners.filter(p => p.verificationStatus === 'approved').length})
            </button>
            <button
              onClick={() => setFilter('rejected')}
              className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                filter === 'rejected'
                  ? 'bg-red-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Rejected ({partners.filter(p => p.verificationStatus === 'rejected').length})
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPartners.map((partner) => (
            <div key={partner.id} className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-shadow duration-300">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900 mb-1">{partner.name}</h3>
                    <p className="text-sm text-gray-600 mb-2">{partner.organization}</p>
                    <div className="flex items-center space-x-2">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getStatusColor(partner.verificationStatus)}`}>
                        {getStatusLabel(partner.verificationStatus)}
                      </span>
                    </div>
                  </div>
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-green-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-lg">
                      {partner.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                </div>

                <div className="space-y-3 mb-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <span className="font-medium w-20">Type:</span>
                    <span>{partner.partnerType || 'Not specified'}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <span className="font-medium w-20">Email:</span>
                    <span className="truncate">{partner.email}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <span className="font-medium w-20">Phone:</span>
                    <span>{partner.phone || 'Not provided'}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <span className="font-medium w-20">Capacity:</span>
                    <span>{partner.capacity || 'Not specified'}</span>
                  </div>
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">Service Areas:</span>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {partner.serviceAreas?.slice(0, 3).map((area, index) => (
                        <span key={index} className="inline-flex px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                          {area}
                        </span>
                      )) || <span className="text-gray-400">Not specified</span>}
                      {partner.serviceAreas && partner.serviceAreas.length > 3 && (
                        <span className="text-xs text-gray-500">+{partner.serviceAreas.length - 3} more</span>
                      )}
                    </div>
                  </div>
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">Waste Types:</span>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {partner.supportedWasteTypes?.slice(0, 3).map((type, index) => (
                        <span key={index} className="inline-flex px-2 py-1 text-xs bg-green-100 text-green-700 rounded">
                          {type}
                        </span>
                      )) || <span className="text-gray-400">Not specified</span>}
                      {partner.supportedWasteTypes && partner.supportedWasteTypes.length > 3 && (
                        <span className="text-xs text-gray-500">+{partner.supportedWasteTypes.length - 3} more</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">Points:</span> {partner.rewardPoints || 0}
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => {
                        setSelectedPartner(partner);
                        setShowPerformanceModal(true);
                      }}
                      className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                    >
                      📊 Performance
                    </button>
                    <button
                      onClick={() => {
                        setSelectedPartner(partner);
                        setShowSubscriptionModal(true);
                      }}
                      className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                    >
                      💰 Rewards
                    </button>
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Update Status:
                    {updatedPartners.has(partner.id) && (
                      <span className="ml-2 text-xs text-orange-600 font-normal">(Status locked after update)</span>
                    )}
                  </label>
                  <select
                    value={partner.verificationStatus}
                    onChange={(e) => handleStatusUpdate(partner.id, e.target.value)}
                    className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="pending">Pending Verification</option>
                    <option value="approved">Verified</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredPartners.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-lg mb-2">🤷‍♂️</div>
            <p className="text-gray-500">No partners found with the selected filter.</p>
          </div>
        )}

        {/* Performance Modal */}
        {showPerformanceModal && selectedPartner && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-gray-900">📊 Performance Summary</h3>
                  <button
                    onClick={() => setShowPerformanceModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>
                <div className="space-y-4">
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-green-500 rounded-full flex items-center justify-center mx-auto mb-3">
                      <span className="text-white font-bold text-xl">
                        {selectedPartner.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <h4 className="text-lg font-semibold text-gray-900">{selectedPartner.name}</h4>
                    <p className="text-sm text-gray-600">{selectedPartner.organization}</p>
                  </div>
                  {(() => {
                    const perf = getPartnerPerformance(selectedPartner);
                    return (
                      <>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-blue-50 p-4 rounded-lg text-center">
                            <div className="text-2xl font-bold text-blue-600">{perf.totalRequests}</div>
                            <div className="text-sm text-blue-700">Total Requests</div>
                          </div>
                          <div className="bg-green-50 p-4 rounded-lg text-center">
                            <div className="text-2xl font-bold text-green-600">{perf.completedRequests}</div>
                            <div className="text-sm text-green-700">Completed</div>
                          </div>
                        </div>
                        <div className="bg-yellow-50 p-4 rounded-lg text-center">
                          <div className="text-3xl font-bold text-yellow-600">{perf.successRate}%</div>
                          <div className="text-sm text-yellow-700">Success Rate</div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-purple-50 p-4 rounded-lg text-center">
                            <div className="text-xl font-bold text-purple-600">{perf.averageRating}⭐</div>
                            <div className="text-sm text-purple-700">Avg Rating</div>
                          </div>
                          <div className="bg-indigo-50 p-4 rounded-lg text-center">
                            <div className="text-xl font-bold text-indigo-600">{perf.totalWasteProcessed}kg</div>
                            <div className="text-sm text-indigo-700">Waste Processed</div>
                          </div>
                        </div>
                        <div className="bg-green-50 p-4 rounded-lg text-center">
                          <div className="text-2xl font-bold text-green-600">{perf.co2Reduction}kg</div>
                          <div className="text-sm text-green-700">CO2 Reduced</div>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Subscription & Rewards Modal */}
        {showSubscriptionModal && selectedPartner && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-gray-900">💰 Subscription & Rewards</h3>
                  <button
                    onClick={() => setShowSubscriptionModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>
                <div className="space-y-4">
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-3">
                      <span className="text-white font-bold text-xl">
                        {selectedPartner.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <h4 className="text-lg font-semibold text-gray-900">{selectedPartner.name}</h4>
                    <p className="text-sm text-gray-600">{selectedPartner.organization}</p>
                  </div>
                  {(() => {
                    const sub = getPartnerSubscription(selectedPartner);
                    return (
                      <>
                        <div className="bg-blue-50 p-4 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-blue-700">Subscription Status</span>
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              sub.status === 'active' ? 'bg-green-100 text-green-800' :
                              sub.status === 'expired' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {sub.status.toUpperCase()}
                            </span>
                          </div>
                          <div className="text-sm text-blue-600">
                            Expires: {sub.expiry}
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-green-50 p-4 rounded-lg text-center">
                            <div className="text-2xl font-bold text-green-600">{sub.totalEarned}</div>
                            <div className="text-sm text-green-700">Reward Points</div>
                          </div>
                          <div className="bg-purple-50 p-4 rounded-lg text-center">
                            <div className="text-2xl font-bold text-purple-600">{sub.redeemedVouchers}</div>
                            <div className="text-sm text-purple-700">Vouchers Redeemed</div>
                          </div>
                        </div>
                        <div className="bg-yellow-50 p-4 rounded-lg">
                          <h5 className="font-medium text-yellow-800 mb-2">Recent Activity</h5>
                          <div className="space-y-2 text-sm text-yellow-700">
                            <div>• Completed waste pickup (+25 points)</div>
                            <div>• Redeemed ₹500 voucher (-100 points)</div>
                            <div>• Monthly subscription renewed (+50 points)</div>
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPartnersPage;