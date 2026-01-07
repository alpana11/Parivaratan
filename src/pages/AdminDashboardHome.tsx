import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { dbService } from '../services/dbService';

const AdminDashboardHome: React.FC = () => {
  const [stats, setStats] = useState({
    totalRequests: 0,
    pendingRequests: 0,
    assignedRequests: 0,
    inProgressRequests: 0,
    completedRequests: 0,
    totalPartners: 0,
    verifiedPartners: 0,
    pendingPartners: 0,
    activeSubscriptions: 0,
    totalRevenue: 0,
    totalPoints: 0,
    co2Reduction: 0,
    wasteDiverted: 0,
    activeVouchers: 0,
    redeemedVouchers: 0,
  });

  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Set up real-time listeners for instant updates
    const unsubscribeWasteRequests = dbService.subscribeToWasteRequests((wasteRequests) => {
      updateDashboardData(wasteRequests, null);
    });

    const unsubscribePartners = dbService.subscribeToPartners((partners) => {
      updateDashboardData(null, partners);
    });

    // Initial load
    loadDashboardData();

    // Cleanup listeners on unmount
    return () => {
      unsubscribeWasteRequests();
      unsubscribePartners();
    };
  }, []);

  const updateDashboardData = (wasteRequestsData: any[] | null, partnersData: any[] | null) => {
    // Use current state if data not provided
    const wasteRequests = wasteRequestsData !== null ? wasteRequestsData : [];
    const partners = partnersData !== null ? partnersData : [];

    // Calculate request stats
    const requestStats = {
      totalRequests: wasteRequests.length,
      pendingRequests: wasteRequests.filter((r: any) => r.status === 'Assigned').length,
      assignedRequests: wasteRequests.filter((r: any) => r.status === 'Accepted').length,
      inProgressRequests: wasteRequests.filter((r: any) => r.status === 'In Progress').length,
      completedRequests: wasteRequests.filter((r: any) => r.status === 'Completed').length,
    };

    // Calculate partner stats
    const partnerStats = {
      totalPartners: partners.length,
      verifiedPartners: partners.filter((p: any) => p.verificationStatus === 'approved').length,
      pendingPartners: partners.filter((p: any) => p.verificationStatus === 'pending').length,
    };

    // Calculate subscription stats
    const subscriptionStats = {
      activeSubscriptions: partners.filter((p: any) => p.subscription?.status === 'active').length,
    };

    // Calculate financial metrics
    const totalRevenue = partners
      .filter((p: any) => p.subscription?.status === 'active')
      .reduce((sum: number, p: any) => sum + (p.subscription?.amount || 0), 0);

    const totalPoints = partners.reduce((sum: number, p: any) => sum + (p.rewardPoints || 0), 0);

    // Calculate environmental impact
    const wasteDiverted = wasteRequests
      .filter((r: any) => r.status === 'Completed')
      .reduce((sum: number, r: any) => sum + parseFloat(r.quantity.replace(' kg', '')), 0);

    const co2Reduction = wasteDiverted * 2.5; // 2.5 kg CO2 saved per kg waste diverted

    // Mock voucher stats (would come from database)
    const voucherStats = {
      activeVouchers: 25,
      redeemedVouchers: 12,
    };

    setStats({
      ...requestStats,
      ...partnerStats,
      ...subscriptionStats,
      totalRevenue,
      totalPoints,
      co2Reduction,
      wasteDiverted,
      ...voucherStats,
    });

    // Generate recent activity (mock data)
    const activities = [
      { id: 1, type: 'request', message: 'New waste request submitted', time: '2 min ago' },
      { id: 2, type: 'partner', message: 'Partner verification completed', time: '15 min ago' },
      { id: 3, type: 'subscription', message: 'New subscription activated', time: '1 hour ago' },
      { id: 4, type: 'reward', message: 'Reward points issued', time: '2 hours ago' },
      { id: 5, type: 'voucher', message: 'Voucher redeemed', time: '3 hours ago' },
    ];
    setRecentActivity(activities);
  };

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);

      let wasteRequests: any[] = [];
      let partners: any[] = [];

      try {
        wasteRequests = await dbService.getAllWasteRequests();
      } catch (error) {
        console.error('Error loading waste requests:', error);
      }

      try {
        partners = await dbService.getAllPartners();
      } catch (error) {
        console.error('Error loading partners:', error);
      }

      updateDashboardData(wasteRequests, partners);

    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-green-500 rounded-xl flex items-center justify-center shadow-lg">
            <span className="text-white text-xl font-bold">P</span>
          </div>
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Dashboard Overview</h2>
            <p className="text-gray-600 mt-1">Monitor and manage your waste management platform</p>
          </div>
        </div>
        <button
          onClick={loadDashboardData}
          disabled={isLoading}
          className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-3 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5"
        >
          <span className="text-lg">🔄</span>
          <span className="font-medium">{isLoading ? 'Refreshing...' : 'Force Refresh'}</span>
        </button>
      </div>

      {/* Enhanced Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Waste Requests Section */}
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 hover:shadow-xl transition-shadow duration-300">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Waste Requests</h3>
            <div className="text-2xl">♻️</div>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 flex items-center">
                <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                Total
              </span>
              <span className="font-bold text-blue-600 text-lg">{stats.totalRequests}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 flex items-center">
                <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></div>
                Pending
              </span>
              <span className="font-bold text-yellow-600">{stats.pendingRequests}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 flex items-center">
                <div className="w-2 h-2 bg-orange-500 rounded-full mr-2"></div>
                In Progress
              </span>
              <span className="font-bold text-orange-600">{stats.inProgressRequests}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                Completed
              </span>
              <span className="font-bold text-green-600">{stats.completedRequests}</span>
            </div>
          </div>
        </div>

        {/* Partners Section */}
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 hover:shadow-xl transition-shadow duration-300">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Partners</h3>
            <div className="text-2xl">🧑‍🤝‍🧑</div>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 flex items-center">
                <div className="w-2 h-2 bg-gray-500 rounded-full mr-2"></div>
                Total
              </span>
              <span className="font-bold text-gray-900 text-lg">{stats.totalPartners}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                Verified
              </span>
              <span className="font-bold text-green-600">{stats.verifiedPartners}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 flex items-center">
                <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></div>
                Pending
              </span>
              <span className="font-bold text-yellow-600">{stats.pendingPartners}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 flex items-center">
                <div className="w-2 h-2 bg-purple-500 rounded-full mr-2"></div>
                Active Subs
              </span>
              <span className="font-bold text-purple-600">{stats.activeSubscriptions}</span>
            </div>
          </div>
        </div>

        {/* Financial & Rewards Section */}
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 hover:shadow-xl transition-shadow duration-300">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Financial & Rewards</h3>
            <div className="text-2xl">💰</div>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                Revenue
              </span>
              <span className="font-bold text-green-600">₹{stats.totalRevenue.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 flex items-center">
                <div className="w-2 h-2 bg-indigo-500 rounded-full mr-2"></div>
                Reward Points
              </span>
              <span className="font-bold text-indigo-600">{stats.totalPoints.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 flex items-center">
                <div className="w-2 h-2 bg-pink-500 rounded-full mr-2"></div>
                Active Vouchers
              </span>
              <span className="font-bold text-pink-600">{stats.activeVouchers}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 flex items-center">
                <div className="w-2 h-2 bg-gray-500 rounded-full mr-2"></div>
                Redeemed
              </span>
              <span className="font-bold text-gray-600">{stats.redeemedVouchers}</span>
            </div>
          </div>
        </div>

        {/* Environmental Impact Section */}
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 hover:shadow-xl transition-shadow duration-300">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Environmental Impact</h3>
            <div className="text-2xl">🌱</div>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 flex items-center">
                <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                Waste Diverted
              </span>
              <span className="font-bold text-blue-600">{stats.wasteDiverted.toFixed(1)} kg</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 flex items-center">
                <div className="w-2 h-2 bg-teal-500 rounded-full mr-2"></div>
                CO₂ Reduction
              </span>
              <span className="font-bold text-teal-600">{stats.co2Reduction.toFixed(1)} kg</span>
            </div>
            <div className="mt-4 p-2 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg">
              <div className="text-xs text-gray-600 text-center">
                🌍 Making a difference, one pickup at a time
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-900">Recent Activity</h3>
            <div className="text-sm text-green-600 bg-green-100 px-3 py-1 rounded-full flex items-center">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
              Real-time Updates
            </div>
          </div>
          <div className="space-y-4">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-start space-x-4 p-4 bg-gradient-to-r from-gray-50 to-white rounded-lg border border-gray-100 hover:shadow-md transition-shadow duration-200">
                <div className="flex-shrink-0 w-10 h-10 bg-white rounded-full shadow-sm flex items-center justify-center border-2 border-gray-100">
                  {activity.type === 'request' && <span className="text-xl">📦</span>}
                  {activity.type === 'partner' && <span className="text-xl">👥</span>}
                  {activity.type === 'subscription' && <span className="text-xl">💳</span>}
                  {activity.type === 'reward' && <span className="text-xl">🎁</span>}
                  {activity.type === 'voucher' && <span className="text-xl">🎟️</span>}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 leading-5">{activity.message}</p>
                  <div className="flex items-center mt-1">
                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mr-2"></div>
                    <p className="text-xs text-gray-500">{activity.time}</p>
                  </div>
                </div>
                <div className="flex-shrink-0">
                  <div className={`w-2 h-2 rounded-full ${
                    activity.type === 'request' ? 'bg-blue-500' :
                    activity.type === 'partner' ? 'bg-green-500' :
                    activity.type === 'subscription' ? 'bg-purple-500' :
                    activity.type === 'reward' ? 'bg-yellow-500' : 'bg-pink-500'
                  }`}></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-900">Quick Actions</h3>
            <div className="text-sm text-gray-500 bg-blue-50 px-3 py-1 rounded-full text-blue-600">Admin Tools</div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Link
              to="/admin/waste-requests"
              className="group bg-gradient-to-br from-blue-50 to-blue-100 p-5 rounded-xl hover:from-blue-100 hover:to-blue-200 transition-all duration-300 text-center border border-blue-200 hover:border-blue-300 hover:shadow-lg transform hover:-translate-y-1"
            >
              <div className="text-3xl mb-3 group-hover:scale-110 transition-transform duration-300">♻️</div>
              <h4 className="font-semibold text-blue-900 mb-1">Waste Requests</h4>
              <p className="text-xs text-blue-700">Manage collection requests</p>
            </Link>
            <Link
              to="/admin/partners"
              className="group bg-gradient-to-br from-green-50 to-green-100 p-5 rounded-xl hover:from-green-100 hover:to-green-200 transition-all duration-300 text-center border border-green-200 hover:border-green-300 hover:shadow-lg transform hover:-translate-y-1"
            >
              <div className="text-3xl mb-3 group-hover:scale-110 transition-transform duration-300">🧑‍🤝‍🧑</div>
              <h4 className="font-semibold text-green-900 mb-1">Partners</h4>
              <p className="text-xs text-green-700">Verify & manage partners</p>
            </Link>
            <Link
              to="/admin/documents"
              className="group bg-gradient-to-br from-yellow-50 to-yellow-100 p-5 rounded-xl hover:from-yellow-100 hover:to-yellow-200 transition-all duration-300 text-center border border-yellow-200 hover:border-yellow-300 hover:shadow-lg transform hover:-translate-y-1"
            >
              <div className="text-3xl mb-3 group-hover:scale-110 transition-transform duration-300">📄</div>
              <h4 className="font-semibold text-yellow-900 mb-1">Documents</h4>
              <p className="text-xs text-yellow-700">Review verifications</p>
            </Link>
            <Link
              to="/admin/analytics"
              className="group bg-gradient-to-br from-purple-50 to-purple-100 p-5 rounded-xl hover:from-purple-100 hover:to-purple-200 transition-all duration-300 text-center border border-purple-200 hover:border-purple-300 hover:shadow-lg transform hover:-translate-y-1"
            >
              <div className="text-3xl mb-3 group-hover:scale-110 transition-transform duration-300">📊</div>
              <h4 className="font-semibold text-purple-900 mb-1">Analytics</h4>
              <p className="text-xs text-purple-700">View insights & trends</p>
            </Link>
            <Link
              to="/admin/subscriptions"
              className="group bg-gradient-to-br from-indigo-50 to-indigo-100 p-5 rounded-xl hover:from-indigo-100 hover:to-indigo-200 transition-all duration-300 text-center border border-indigo-200 hover:border-indigo-300 hover:shadow-lg transform hover:-translate-y-1"
            >
              <div className="text-3xl mb-3 group-hover:scale-110 transition-transform duration-300">💳</div>
              <h4 className="font-semibold text-indigo-900 mb-1">Subscriptions</h4>
              <p className="text-xs text-indigo-700">Manage payments</p>
            </Link>
            <Link
              to="/admin/rewards"
              className="group bg-gradient-to-br from-pink-50 to-pink-100 p-5 rounded-xl hover:from-pink-100 hover:to-pink-200 transition-all duration-300 text-center border border-pink-200 hover:border-pink-300 hover:shadow-lg transform hover:-translate-y-1"
            >
              <div className="text-3xl mb-3 group-hover:scale-110 transition-transform duration-300">🎁</div>
              <h4 className="font-semibold text-pink-900 mb-1">Rewards</h4>
              <p className="text-xs text-pink-700">Configure points system</p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardHome;