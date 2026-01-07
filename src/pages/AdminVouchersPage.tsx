import React, { useState, useEffect } from 'react';
import { dbService } from '../services/dbService';
import { Voucher, VoucherAssignment, Partner } from '../types';

const AdminVouchersPage: React.FC = () => {
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [assignments, setAssignments] = useState<VoucherAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedVoucher, setSelectedVoucher] = useState<Voucher | null>(null);
  const [filter, setFilter] = useState<'all' | 'available' | 'redeemed' | 'expired' | 'inactive'>('all');

  // Form states
  const [newVoucher, setNewVoucher] = useState({
    title: '',
    description: '',
    pointsRequired: 0,
    category: '',
    expiryDate: '',
    maxRedemptions: 0
  });

  const [selectedPartners, setSelectedPartners] = useState<string[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [vouchersData, partnersData, assignmentsData] = await Promise.all([
        dbService.getVouchers(),
        dbService.getAllPartners(),
        // Mock assignments data - in real app, this would come from database
        Promise.resolve([] as VoucherAssignment[])
      ]);

      setVouchers(vouchersData);
      setPartners(partnersData);
      setAssignments(assignmentsData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateVoucher = async () => {
    if (!newVoucher.title || !newVoucher.pointsRequired || !newVoucher.expiryDate) {
      alert('Please fill in all required fields');
      return;
    }

    const voucherData: any = {
      title: newVoucher.title,
      description: newVoucher.description,
      pointsRequired: newVoucher.pointsRequired,
      image: '/voucher-placeholder.png', // Default image
      category: newVoucher.category,
      status: 'available',
      expiryDate: new Date(newVoucher.expiryDate).toISOString(),
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
      setVouchers([...vouchers, { ...voucher, id: `temp-${Date.now()}` }]); // Temporary until reload
      setShowCreateModal(false);
      setNewVoucher({
        title: '',
        description: '',
        pointsRequired: 0,
        category: '',
        expiryDate: '',
        maxRedemptions: 0
      });
      // Reload data to get the actual ID
      loadData();
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
      setVouchers(vouchers.map(v =>
        v.id === voucherId
          ? { ...v, status: newStatus }
          : v
      ));
    } catch (error) {
      console.error('Error updating voucher status:', error);
      alert('Failed to update voucher status. Please try again.');
    }
  };

  const handleAssignVouchers = async () => {
    if (!selectedVoucher || selectedPartners.length === 0) {
      alert('Please select a voucher and partners');
      return;
    }

    try {
      // Update voucher with assigned partners
      const currentAssigned = selectedVoucher.assignedPartners || [];
      const newAssigned = [...new Set([...currentAssigned, ...selectedPartners])];

      await dbService.updateVoucher(selectedVoucher.id, {
        assignedPartners: newAssigned
      });

      // Update local state
      setVouchers(vouchers.map(v =>
        v.id === selectedVoucher.id
          ? {
              ...v,
              assignedPartners: newAssigned
            }
          : v
      ));

      setShowAssignModal(false);
      setSelectedVoucher(null);
      setSelectedPartners([]);
    } catch (error) {
      console.error('Error assigning vouchers:', error);
      alert('Failed to assign vouchers. Please try again.');
    }
  };

  const getVoucherStats = () => {
    const total = vouchers.length;
    const available = vouchers.filter(v => v.status === 'available').length;
    const redeemed = vouchers.filter(v => v.status === 'redeemed').length;
    const expired = vouchers.filter(v => new Date(v.expiryDate) < new Date() && v.status !== 'redeemed').length;
    const inactive = vouchers.filter(v => v.status === 'inactive').length;

    return { total, available, redeemed, expired, inactive };
  };

  const getBudgetInfo = () => {
    // Mock subscription revenue calculation
    const activeSubscriptions = partners.filter(p =>
      p.subscription?.status === 'active'
    ).length;

    const monthlyRevenue = activeSubscriptions * 99; // Assuming ₹99/month
    const voucherBudget = Math.floor(monthlyRevenue * 0.1); // 10% of revenue for vouchers

    return { monthlyRevenue, voucherBudget };
  };

  const filteredVouchers = vouchers.filter(voucher => {
    if (filter === 'all') return true;
    if (filter === 'expired') {
      return new Date(voucher.expiryDate) < new Date() && voucher.status !== 'redeemed';
    }
    return voucher.status === filter;
  });

  const stats = getVoucherStats();
  const budget = getBudgetInfo();

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
          <div className="flex space-x-3">
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              + Create Voucher
            </button>
            <button
              onClick={() => setShowAssignModal(true)}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
            >
              Assign Vouchers
            </button>
          </div>
        </div>

        {/* Budget Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Monthly Revenue</p>
                <p className="text-2xl font-bold text-green-600">₹{budget.monthlyRevenue}</p>
              </div>
              <div className="text-green-500 text-2xl">💰</div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Voucher Budget</p>
                <p className="text-2xl font-bold text-blue-600">₹{budget.voucherBudget}</p>
              </div>
              <div className="text-blue-500 text-2xl">🎫</div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Budget Utilized</p>
                <p className="text-2xl font-bold text-purple-600">
                  {budget.voucherBudget > 0 ? Math.round((stats.redeemed * 50) / budget.voucherBudget * 100) : 0}%
                </p>
              </div>
              <div className="text-purple-500 text-2xl">📊</div>
            </div>
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
            const assignedCount = voucher.assignedPartners?.length || 0;
            const redeemedCount = voucher.redeemedBy?.length || 0;

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
                      <span className="text-gray-600">Expires:</span>
                      <span className={`font-semibold ${isExpired ? 'text-red-600' : 'text-gray-900'}`}>
                        {new Date(voucher.expiryDate).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Assigned:</span>
                      <span className="font-semibold text-blue-600">{assignedCount}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Redeemed:</span>
                      <span className="font-semibold text-green-600">{redeemedCount}</span>
                    </div>
                    {voucher.maxRedemptions && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Max Redemptions:</span>
                        <span className="font-semibold text-purple-600">{voucher.maxRedemptions}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleToggleVoucherStatus(voucher.id)}
                      className={`flex-1 px-3 py-2 text-sm rounded-lg transition-colors ${
                        voucher.status === 'available'
                          ? 'bg-red-100 text-red-700 hover:bg-red-200'
                          : 'bg-green-100 text-green-700 hover:bg-green-200'
                      }`}
                    >
                      {voucher.status === 'available' ? 'Deactivate' : 'Activate'}
                    </button>
                    <button
                      onClick={() => {
                        setSelectedVoucher(voucher);
                        setShowAssignModal(true);
                      }}
                      className="px-3 py-2 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                    >
                      Assign
                    </button>
                  </div>
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date *</label>
                    <input
                      type="date"
                      value={newVoucher.expiryDate}
                      onChange={(e) => setNewVoucher({ ...newVoucher, expiryDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
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

        {/* Assign Voucher Modal */}
        {showAssignModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-gray-900">Assign Vouchers to Partners</h3>
                  <button
                    onClick={() => setShowAssignModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Select Voucher</label>
                  <select
                    value={selectedVoucher?.id || ''}
                    onChange={(e) => {
                      const voucher = vouchers.find(v => v.id === e.target.value);
                      setSelectedVoucher(voucher || null);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Choose a voucher...</option>
                    {vouchers.filter(v => v.status === 'available').map((voucher) => (
                      <option key={voucher.id} value={voucher.id}>
                        {voucher.title} ({voucher.pointsRequired} points)
                      </option>
                    ))}
                  </select>
                </div>

                {selectedVoucher && (
                  <div className="mb-6">
                    <div className="bg-blue-50 p-4 rounded-lg mb-4">
                      <h4 className="font-semibold text-blue-900">{selectedVoucher.title}</h4>
                      <p className="text-sm text-blue-700">{selectedVoucher.description}</p>
                      <p className="text-sm text-blue-600 mt-1">
                        Points Required: {selectedVoucher.pointsRequired} |
                        Expires: {new Date(selectedVoucher.expiryDate).toLocaleDateString()}
                      </p>
                    </div>

                    <label className="block text-sm font-medium text-gray-700 mb-2">Select Partners</label>
                    <div className="max-h-60 overflow-y-auto border border-gray-300 rounded-lg">
                      {partners
                        .filter(p => p.subscription?.status === 'active') // Only show partners with active subscriptions
                        .map((partner) => (
                        <div key={partner.id} className="flex items-center p-3 border-b border-gray-200 last:border-b-0">
                          <input
                            type="checkbox"
                            id={`partner-${partner.id}`}
                            checked={selectedPartners.includes(partner.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedPartners([...selectedPartners, partner.id]);
                              } else {
                                setSelectedPartners(selectedPartners.filter(id => id !== partner.id));
                              }
                            }}
                            className="mr-3"
                          />
                          <label htmlFor={`partner-${partner.id}`} className="flex-1 cursor-pointer">
                            <div className="font-medium text-gray-900">{partner.name}</div>
                            <div className="text-sm text-gray-600">
                              {partner.organization} | {partner.rewardPoints} points available
                            </div>
                          </label>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Only partners with active subscriptions are shown
                    </p>
                  </div>
                )}

                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setShowAssignModal(false)}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAssignVouchers}
                    disabled={!selectedVoucher || selectedPartners.length === 0}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      selectedVoucher && selectedPartners.length > 0
                        ? 'bg-green-500 text-white hover:bg-green-600'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    Assign to {selectedPartners.length} Partner{selectedPartners.length !== 1 ? 's' : ''}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminVouchersPage;