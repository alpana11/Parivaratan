import React, { useState, useEffect, useMemo } from 'react';
import { dbService } from '../services/dbService';
import { Voucher, Partner, RewardTransaction } from '../types';

const AdminVouchersPage: React.FC = () => {
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [transactions, setTransactions] = useState<RewardTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showRedemptionsModal, setShowRedemptionsModal] = useState(false);
  const [selectedVoucher, setSelectedVoucher] = useState<Voucher | null>(null);
  const [filter, setFilter] = useState<'all' | 'available' | 'redeemed' | 'expired' | 'inactive'>('all');

  // Form states
  const [newVoucher, setNewVoucher] = useState({
    title: '',
    description: '',
    pointsRequired: 0,
    category: '',
    maxRedemptions: 0
  });

  const [selectedPartners, setSelectedPartners] = useState<string[]>([]);

  useEffect(() => {
    const unsubscribeVouchers = dbService.listenToVouchers((vouchersData) => {
      setVouchers(vouchersData);
      setLoading(false);
    });

    const unsubscribePartners = dbService.subscribeToPartners((partnersData) => {
      setPartners(partnersData);
    });

    const unsubscribeTransactions = dbService.subscribeToRewardTransactions((transactionsData) => {
      setTransactions(transactionsData);
    });

    return () => {
      unsubscribeVouchers();
      unsubscribePartners();
      unsubscribeTransactions();
    };
  }, []);

  const handleCreateVoucher = async () => {
    if (!newVoucher.title || !newVoucher.pointsRequired) {
      alert('Please fill in all required fields');
      return;
    }

    const voucherData: any = {
      title: newVoucher.title,
      description: newVoucher.description,
      pointsRequired: newVoucher.pointsRequired,
      image: '/voucher-placeholder.png',
      category: newVoucher.category,
      status: 'available',
      createdAt: new Date().toISOString(),
      currentRedemptions: 0
    };

    // Only include maxRedemptions if it's provided and greater than 0
    if (newVoucher.maxRedemptions && newVoucher.maxRedemptions > 0) {
      voucherData.maxRedemptions = newVoucher.maxRedemptions;
    }

    const voucher: Omit<Voucher, 'id'> = voucherData;

    try {
      await dbService.createVoucher(voucher);
      setShowCreateModal(false);
      setNewVoucher({
        title: '',
        description: '',
        pointsRequired: 0,
        category: '',
        maxRedemptions: 0
      });
    } catch (error) {
      console.error('Error creating voucher:', error);
      alert('Failed to create voucher. Please try again.');
    }
  };

  const handleToggleVoucherStatus = async (voucherId: string) => {
    const voucher = vouchers.find(v => v.id === voucherId);
    if (!voucher) return;

    const newStatus = voucher.status === 'available' ? 'inactive' : 'available';

    try {
      await dbService.updateVoucher(voucherId, { status: newStatus });
    } catch (error) {
      console.error('Error updating voucher status:', error);
      alert('Failed to update voucher status. Please try again.');
    }
  };

  const stats = useMemo(() => {
    const now = new Date();
    const total = vouchers.length;
    const available = vouchers.filter(v => v.status === 'available').length;
    const redeemed = vouchers.filter(v => v.status === 'redeemed').length;
    const expired = vouchers.filter(v => new Date(v.expiryDate) < now && v.status !== 'redeemed').length;
    const inactive = vouchers.filter(v => v.status === 'inactive').length;

    return { total, available, redeemed, expired, inactive };
  }, [vouchers]);

  const budget = useMemo(() => {
    const activePartners = partners.filter(p => p.subscription?.status === 'active');
    const monthlyRevenue = activePartners.reduce((sum, p) => sum + (p.subscription?.amount || 0), 0);
    const voucherBudget = Math.floor(monthlyRevenue * 0.1);

    return { monthlyRevenue, voucherBudget };
  }, [partners]);

  const filteredVouchers = useMemo(() => {
    const now = new Date();
    return vouchers.filter(voucher => {
      if (filter === 'all') return true;
      if (filter === 'expired') {
        return new Date(voucher.expiryDate) < now && voucher.status !== 'redeemed';
      }
      return voucher.status === filter;
    });
  }, [vouchers, filter]);

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
          <h2 className="text-2xl font-bold text-gray-900">🎫 Voucher Management</h2>
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2 bg-green-50 px-3 py-1 rounded-full border border-green-200">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-green-700 font-medium">Real-time Updates</span>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              + Create Voucher
            </button>
          </div>
        </div>

        {/* Voucher Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <button
            onClick={() => setFilter('all')}
            className={`p-4 rounded-lg border transition-colors ${
              filter === 'all'
                ? 'bg-blue-50 border-blue-200'
                : 'bg-white border-gray-200 hover:bg-gray-50'
            }`}
          >
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
            <div className="text-sm text-gray-600">Total Vouchers</div>
          </button>
          <button
            onClick={() => setFilter('available')}
            className={`p-4 rounded-lg border transition-colors ${
              filter === 'available'
                ? 'bg-green-50 border-green-200'
                : 'bg-white border-gray-200 hover:bg-gray-50'
            }`}
          >
            <div className="text-2xl font-bold text-green-600">{stats.available}</div>
            <div className="text-sm text-gray-600">Available</div>
          </button>
          <button
            onClick={() => setFilter('redeemed')}
            className={`p-4 rounded-lg border transition-colors ${
              filter === 'redeemed'
                ? 'bg-blue-50 border-blue-200'
                : 'bg-white border-gray-200 hover:bg-gray-50'
            }`}
          >
            <div className="text-2xl font-bold text-blue-600">{stats.redeemed}</div>
            <div className="text-sm text-gray-600">Redeemed</div>
          </button>
          <button
            onClick={() => setFilter('expired')}
            className={`p-4 rounded-lg border transition-colors ${
              filter === 'expired'
                ? 'bg-red-50 border-red-200'
                : 'bg-white border-gray-200 hover:bg-gray-50'
            }`}
          >
            <div className="text-2xl font-bold text-red-600">{stats.expired}</div>
            <div className="text-sm text-gray-600">Expired</div>
          </button>
          <button
            onClick={() => setFilter('inactive')}
            className={`p-4 rounded-lg border transition-colors ${
              filter === 'inactive'
                ? 'bg-gray-50 border-gray-200'
                : 'bg-white border-gray-200 hover:bg-gray-50'
            }`}
          >
            <div className="text-2xl font-bold text-gray-600">{stats.inactive}</div>
            <div className="text-sm text-gray-600">Inactive</div>
          </button>
        </div>

        {/* Vouchers List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVouchers.map((voucher) => {
            const isExpired = new Date(voucher.expiryDate) < new Date() && voucher.status !== 'redeemed';
            const redeemedCount = voucher.currentRedemptions || 0;

            return (
              <div key={voucher.id} className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900 mb-1">{voucher.title}</h3>
                      <p className="text-sm text-gray-600 mb-2">{voucher.description}</p>
                      <div className="flex items-center space-x-2 mb-3">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          voucher.status === 'available' ? 'bg-green-100 text-green-800' :
                          voucher.status === 'redeemed' ? 'bg-blue-100 text-blue-800' :
                          voucher.status === 'expired' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {isExpired && voucher.status !== 'redeemed' ? 'Expired' : voucher.status}
                        </span>
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                          {voucher.category}
                        </span>
                      </div>
                    </div>
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                      <span className="text-white text-lg">🎫</span>
                    </div>
                  </div>

                  <div className="space-y-3 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Points Required:</span>
                      <span className="font-semibold text-orange-600">{voucher.pointsRequired}</span>
                    </div>

                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Times Redeemed:</span>
                      <button
                        onClick={() => {
                          setSelectedVoucher(voucher);
                          setShowRedemptionsModal(true);
                        }}
                        className="font-semibold text-green-600 hover:underline"
                      >
                        {redeemedCount}
                      </button>
                    </div>
                    {voucher.maxRedemptions && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Max Redemptions:</span>
                        <span className="font-semibold text-purple-600">{voucher.maxRedemptions}</span>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => handleToggleVoucherStatus(voucher.id)}
                    className={`w-full px-3 py-2 text-sm rounded-lg transition-colors ${
                      voucher.status === 'available'
                        ? 'bg-red-100 text-red-700 hover:bg-red-200'
                        : 'bg-green-100 text-green-700 hover:bg-green-200'
                    }`}
                  >
                    {voucher.status === 'available' ? 'Deactivate' : 'Activate'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {filteredVouchers.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-lg mb-2">🎫</div>
            <p className="text-gray-500">No vouchers found with the selected filter.</p>
          </div>
        )}

        {/* Create Voucher Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl max-w-md w-full mx-4">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-gray-900">Create New Voucher</h3>
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Voucher Name *</label>
                    <input
                      type="text"
                      value={newVoucher.title}
                      onChange={(e) => setNewVoucher({ ...newVoucher, title: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., ₹500 Cash Voucher"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                      value={newVoucher.description}
                      onChange={(e) => setNewVoucher({ ...newVoucher, description: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={3}
                      placeholder="Describe the voucher benefits..."
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Points Required *</label>
                      <input
                        type="number"
                        value={newVoucher.pointsRequired}
                        onChange={(e) => setNewVoucher({ ...newVoucher, pointsRequired: Number(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="100"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                      <input
                        type="text"
                        value={newVoucher.category}
                        onChange={(e) => setNewVoucher({ ...newVoucher, category: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Food, Shopping, etc."
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Max Redemptions (optional)</label>
                    <input
                      type="number"
                      value={newVoucher.maxRedemptions}
                      onChange={(e) => setNewVoucher({ ...newVoucher, maxRedemptions: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Leave empty for unlimited"
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateVoucher}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    Create Voucher
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Redemptions Modal */}
        {showRedemptionsModal && selectedVoucher && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden flex flex-col">
              <div className="p-6 border-b">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-gray-900">Voucher Redemptions</h3>
                  <button
                    onClick={() => {
                      setShowRedemptionsModal(false);
                      setSelectedVoucher(null);
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>
                <p className="text-sm text-gray-600 mt-2">{selectedVoucher.title}</p>
              </div>
              <div className="p-6 overflow-y-auto">
                {transactions
                  .filter(t => t.type === 'redeemed' && t.voucherId === selectedVoucher.id)
                  .length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No redemptions yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {transactions
                      .filter(t => t.type === 'redeemed' && t.voucherId === selectedVoucher.id)
                      .map((transaction) => {
                        const partner = partners.find(p => p.id === transaction.partnerId);
                        return (
                          <div key={transaction.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-semibold text-gray-900">
                                  {partner?.name || (partner as any)?.userName || (partner as any)?.fullName || 'Unknown User'}
                                </p>
                                <p className="text-sm text-gray-600">{partner?.email || 'N/A'}</p>
                                <p className="text-sm text-gray-500 mt-1">
                                  {partner?.phone || (partner as any)?.userPhone || 'N/A'}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-semibold text-orange-600">-{transaction.points} pts</p>
                                <p className="text-xs text-gray-500 mt-1">
                                  {new Date(transaction.date).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminVouchersPage;