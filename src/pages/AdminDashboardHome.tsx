import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { dbService } from '../services/dbService';

const AdminDashboardHome: React.FC = () => {
  const [stats, setStats] = useState({
    totalRequests: 0,
    acceptedRequests: 0,
    inProgressRequests: 0,
    completedRequests: 0,
    totalPartners: 0,
    verifiedPartners: 0,
    pendingPartners: 0,
    activeSubscriptions: 0,
    activeUsers: 0,
    totalPoints: 0,
    co2Reduction: 0,
    wasteDiverted: 0,
    activeVouchers: 0,
    redeemedVouchers: 0,
  });

  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [wasteRequests, setWasteRequests] = useState<any[]>([]);
  const [partners, setPartners] = useState<any[]>([]);
  const [vouchers, setVouchers] = useState<any[]>([]);
  const [scheduledPickups, setScheduledPickups] = useState<any[]>([]);

  useEffect(() => {
    const unsubscribeWasteRequests = dbService.subscribeToWasteRequests((requests) => {
      setWasteRequests(requests);
    });

    const unsubscribePartners = dbService.subscribeToPartners((partnersList) => {
      setPartners(partnersList);
    });

    const unsubscribeVouchers = dbService.listenToVouchers((vouchersList) => {
      setVouchers(vouchersList);
    });

    const unsubscribeScheduledPickups = dbService.subscribeToAllScheduledPickups((pickups) => {
      setScheduledPickups(pickups);
    });

    return () => {
      unsubscribeWasteRequests();
      unsubscribePartners();
      unsubscribeVouchers();
      unsubscribeScheduledPickups();
    };
  }, []);

  useEffect(() => {
    if (wasteRequests.length > 0 || partners.length > 0 || vouchers.length > 0 || scheduledPickups.length > 0) {
      updateDashboardData(wasteRequests, partners, vouchers, scheduledPickups);
      setIsLoading(false);
    }
  }, [wasteRequests, partners, vouchers, scheduledPickups]);

  const updateDashboardData = (wasteRequestsData: any[], partnersData: any[], vouchersData: any[], scheduledPickupsData: any[]) => {

    // Calculate request stats
    const requestStats = {
      totalRequests: wasteRequestsData.length,
      acceptedRequests: wasteRequestsData.filter((r: any) => r.status === 'Accepted' || r.status === 'accepted' || r.status === 'Assigned' || r.status === 'pending').length,
      inProgressRequests: wasteRequestsData.filter((r: any) => {
        const status = r.status?.toLowerCase();
        return status === 'in progress' || status === 'scheduled' || status === 'in_progress' || r.status === 'In Progress' || r.status === 'Scheduled';
      }).length + scheduledPickupsData.length,
      completedRequests: wasteRequestsData.filter((r: any) => r.status === 'Completed').length,
    };

    // Calculate partner stats
    const partnerStats = {
      totalPartners: partnersData.length,
      verifiedPartners: partnersData.filter((p: any) => p.verificationStatus === 'approved').length,
      pendingPartners: partnersData.filter((p: any) => p.verificationStatus === 'pending').length,
    };

    // Calculate subscription stats
    const subscriptionStats = {
      activeSubscriptions: partnersData.filter((p: any) => p.subscription?.status === 'active').length,
    };

    // Calculate active users (unique users who submitted requests)
    const uniqueUserIds = new Set(wasteRequestsData.map((r: any) => r.userId).filter(Boolean));
    const activeUsers = uniqueUserIds.size;

    // Calculate reward points
    const totalPoints = partnersData.reduce((sum: number, p: any) => sum + (p.rewardPoints || 0), 0);

    // Calculate environmental impact
    const wasteDiverted = wasteRequestsData
      .filter((r: any) => r.status === 'Completed')
      .reduce((sum: number, r: any) => {
        const qty = r.quantity?.toString() || '0';
        const num = parseFloat(qty.replace(/[^0-9.]/g, '')) || 0;
        return sum + num;
      }, 0);

    const co2Reduction = wasteDiverted * 2.5;

    // Calculate voucher stats from real-time data
    const voucherStats = {
      activeVouchers: vouchersData.filter((v: any) => v.status === 'available').length,
      redeemedVouchers: vouchersData.filter((v: any) => v.status === 'redeemed').length,
    };

    setStats({
      ...requestStats,
      ...partnerStats,
      ...subscriptionStats,
      activeUsers,
      totalPoints,
      co2Reduction,
      wasteDiverted,
      ...voucherStats,
    });

    // Generate real-time recent activity from actual data
    const activities: { id: string; type: string; message: string; time: string; timestamp: number }[] = [];

    // Get recent waste requests (last 5)
    const sortedRequests = [...wasteRequestsData]
      .filter((r: any) => r.createdAt)
      .sort((a: any, b: any) => {
        const timeA = new Date(a.createdAt).getTime();
        const timeB = new Date(b.createdAt).getTime();
        return timeB - timeA;
      })
      .slice(0, 5);

    sortedRequests.forEach((request: any) => {
      const requestTime = new Date(request.createdAt);
      const now = new Date();
      const diffMs = now.getTime() - requestTime.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      let timeAgo = '';
      if (diffMins < 1) timeAgo = 'Just now';
      else if (diffMins < 60) timeAgo = `${diffMins} min ago`;
      else if (diffHours < 24) timeAgo = `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
      else timeAgo = `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;

      activities.push({
        id: `request-${request.id}`,
        type: 'request',
        message: `New waste request - ${request.wasteType || request.type || 'Collection'} (${request.status || 'Pending'})`,
        time: timeAgo,
        timestamp: requestTime.getTime(),
      });
    });

    // Get recent partners (last 3)
    const sortedPartners = [...partnersData]
      .filter((p: any) => p.createdAt)
      .sort((a: any, b: any) => {
        const timeA = new Date(a.createdAt).getTime();
        const timeB = new Date(b.createdAt).getTime();
        return timeB - timeA;
      })
      .slice(0, 3);

    sortedPartners.forEach((partner: any) => {
      const partnerTime = new Date(partner.createdAt);
      const now = new Date();
      const diffMs = now.getTime() - partnerTime.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      let timeAgo = '';
      if (diffMins < 1) timeAgo = 'Just now';
      else if (diffMins < 60) timeAgo = `${diffMins} min ago`;
      else if (diffHours < 24) timeAgo = `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
      else timeAgo = `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;

      activities.push({
        id: `partner-${partner.id}`,
        type: 'partner',
        message: `Partner "${partner.businessName || partner.name || 'New Partner'}" - ${partner.verificationStatus || 'pending'}`,
        time: timeAgo,
        timestamp: partnerTime.getTime(),
      });
    });

    // Add subscription activities
    partnersData
      .filter((p: any) => p.subscription?.status === 'active' && p.subscription?.startDate)
      .slice(0, 2)
      .forEach((partner: any) => {
        const subTime = new Date(partner.subscription.startDate);
        const now = new Date();
        const diffMs = now.getTime() - subTime.getTime();
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        let timeAgo = '';
        if (diffHours < 24) timeAgo = `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
        else timeAgo = `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;

        activities.push({
          id: `subscription-${partner.id}`,
          type: 'subscription',
          message: `Subscription activated for ${partner.businessName || 'Partner'}`,
          time: timeAgo,
          timestamp: subTime.getTime(),
        });
      });

    // Sort all activities by timestamp (most recent first)
    activities.sort((a, b) => b.timestamp - a.timestamp);

    // Take only the 5 most recent activities
    const recentActivities = activities.slice(0, 5);

    setRecentActivity(recentActivities);
  };

  const loadDashboardData = async () => {
    setIsLoading(true);
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Dashboard Overview</h2>
        </div>
        <div className="flex items-center space-x-2 bg-green-50 px-3 py-1 rounded-full border border-green-200">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-sm text-green-700 font-medium">Real-time Updates</span>
        </div>
      </div>

      {/* Enhanced Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        {/* Active Users Card */}
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 hover:shadow-xl transition-shadow duration-300">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Active Users</h3>
            <div className="text-2xl">👥</div>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                Total Users
              </span>
              <span className="font-bold text-green-600 text-2xl">{stats.activeUsers}</span>
            </div>
            <div className="mt-4 p-2 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg">
              <div className="text-xs text-gray-600 text-center">
                📊 Real-time updates
              </div>
            </div>
          </div>
        </div>

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
                <div className="w-2 h-2 bg-purple-500 rounded-full mr-2"></div>
                Accepted
              </span>
              <span className="font-bold text-purple-600">{stats.acceptedRequests}</span>
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

        {/* Rewards Section */}
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 hover:shadow-xl transition-shadow duration-300">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Rewards</h3>
            <div className="text-2xl">🎁</div>
          </div>
          <div className="space-y-3">
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
            <div className="text-2xl flex items-center justify-center">🌱</div>
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
                <span>CO₂ Reduction</span>
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