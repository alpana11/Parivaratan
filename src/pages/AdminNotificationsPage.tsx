import React, { useState, useEffect } from 'react';
import { dbService } from '../services/dbService';
import { Partner, Notification, WasteRequest } from '../types';

const AdminNotificationsPage: React.FC = () => {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [wasteRequests, setWasteRequests] = useState<WasteRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Form state for creating notifications
  const [newNotification, setNewNotification] = useState({
    title: '',
    message: '',
    type: 'system' as Notification['type'],
    category: 'general' as Notification['category'],
    priority: 'medium' as Notification['priority'],
    targetPartners: [] as string[], // Empty array means broadcast to all
    isBroadcast: true,
    metadata: {} as any
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [partnersData, notificationsData, wasteRequestsData] = await Promise.all([
        dbService.getAllPartners(),
        dbService.getAllNotifications(),
        dbService.getAllWasteRequests()
      ]);

      setPartners(partnersData);
      setNotifications(notificationsData);
      setWasteRequests(wasteRequestsData);
    } catch (error) {
      console.error('Error loading notification data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNotification = async () => {
    if (!newNotification.title || !newNotification.message) {
      alert('Please fill in title and message');
      return;
    }

    try {
      if (newNotification.isBroadcast) {
        // Create broadcast notification for all partners
        const notifications = partners.map(partner => ({
          partnerId: partner.id,
          title: newNotification.title,
          message: newNotification.message,
          type: newNotification.type,
          category: newNotification.category,
          priority: newNotification.priority,
          status: 'pending' as const,
          metadata: newNotification.metadata
        }));

        await dbService.createBulkNotifications(notifications);
      } else {
        // Create targeted notifications
        const notifications = newNotification.targetPartners.map(partnerId => ({
          partnerId,
          title: newNotification.title,
          message: newNotification.message,
          type: newNotification.type,
          category: newNotification.category,
          priority: newNotification.priority,
          status: 'pending' as const,
          metadata: newNotification.metadata
        }));

        await dbService.createBulkNotifications(notifications);
      }

      // Reset form
      setNewNotification({
        title: '',
        message: '',
        type: 'system',
        category: 'general',
        priority: 'medium',
        targetPartners: [],
        isBroadcast: true,
        metadata: {}
      });

      setShowCreateModal(false);
      loadData(); // Refresh data
    } catch (error) {
      console.error('Error creating notification:', error);
      alert('Failed to create notification');
    }
  };

  const handleSendNotification = async (notificationId: string) => {
    try {
      await dbService.sendNotification(notificationId);
      loadData(); // Refresh data
    } catch (error) {
      console.error('Error sending notification:', error);
      alert('Failed to send notification');
    }
  };

  const handleSendBulkNotifications = async () => {
    try {
      const pendingNotifications = notifications.filter(n => n.status === 'pending');
      for (const notification of pendingNotifications) {
        await dbService.sendNotification(notification.id);
      }
      loadData(); // Refresh data
    } catch (error) {
      console.error('Error sending bulk notifications:', error);
      alert('Failed to send bulk notifications');
    }
  };

  const createVerificationUpdate = (partner: Partner) => {
    setNewNotification({
      title: 'Verification Status Update',
      message: `Your verification status has been updated to: ${partner.status.replace('_', ' ').toUpperCase()}`,
      type: 'verification',
      category: 'verification_update',
      priority: 'high',
      targetPartners: [partner.id],
      isBroadcast: false,
      metadata: {
        verificationStatus: partner.status
      }
    });
    setShowCreateModal(true);
  };

  const createPickupAssignment = (wasteRequest: WasteRequest) => {
    const assignedPartner = partners.find(p => p.id === wasteRequest.assignedPartner);
    if (!assignedPartner) return;

    setNewNotification({
      title: 'New Pickup Assignment',
      message: `You have been assigned a new pickup: ${wasteRequest.type} (${wasteRequest.quantity}) at ${wasteRequest.location}`,
      type: 'pickup',
      category: 'pickup_assignment',
      priority: 'high',
      targetPartners: [assignedPartner.id],
      isBroadcast: false,
      metadata: {
        wasteRequestId: wasteRequest.id,
        pickupDate: wasteRequest.date
      }
    });
    setShowCreateModal(true);
  };

  const createRewardAnnouncement = () => {
    setNewNotification({
      title: 'Reward Points Earned!',
      message: 'Congratulations! You have earned reward points for completing waste pickups. Check your dashboard for details.',
      type: 'reward',
      category: 'reward_announcement',
      priority: 'medium',
      targetPartners: [],
      isBroadcast: true,
      metadata: {}
    });
    setShowCreateModal(true);
  };

  const createSubscriptionReminder = () => {
    setNewNotification({
      title: 'Subscription Renewal Reminder',
      message: 'Your subscription is expiring soon. Please renew to continue enjoying premium features.',
      type: 'subscription',
      category: 'subscription_reminder',
      priority: 'high',
      targetPartners: [],
      isBroadcast: true,
      metadata: {}
    });
    setShowCreateModal(true);
  };

  const getStatusColor = (status: Notification['status']) => {
    switch (status) {
      case 'sent': return 'bg-green-100 text-green-800 border-green-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'failed': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeColor = (type: Notification['type']) => {
    switch (type) {
      case 'verification': return 'bg-blue-100 text-blue-800';
      case 'pickup': return 'bg-purple-100 text-purple-800';
      case 'reward': return 'bg-green-100 text-green-800';
      case 'subscription': return 'bg-orange-100 text-orange-800';
      case 'system': return 'bg-gray-100 text-gray-800';
      case 'broadcast': return 'bg-indigo-100 text-indigo-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: Notification['priority']) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredNotifications = notifications.filter(notification => {
    const matchesType = filterType === 'all' || notification.type === filterType;
    const matchesStatus = filterStatus === 'all' || notification.status === filterStatus;
    const matchesSearch = searchTerm === '' ||
      notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notification.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (notification.partnerId && partners.find(p => p.id === notification.partnerId)?.name.toLowerCase().includes(searchTerm.toLowerCase()));

    return matchesType && matchesStatus && matchesSearch;
  });

  const pendingCount = notifications.filter(n => n.status === 'pending').length;
  const sentCount = notifications.filter(n => n.status === 'sent').length;

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
          <h2 className="text-2xl font-bold text-gray-900">🔔 Notifications & Communication</h2>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              + Create Notification
            </button>
            {pendingCount > 0 && (
              <button
                onClick={handleSendBulkNotifications}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
              >
                Send All Pending ({pendingCount})
              </button>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <button
            onClick={createVerificationUpdate}
            className="p-4 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors text-left"
          >
            <div className="text-blue-600 font-medium">Verification Updates</div>
            <div className="text-sm text-blue-500">Notify partners about verification status</div>
          </button>
          <button
            onClick={createPickupAssignment}
            className="p-4 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors text-left"
          >
            <div className="text-purple-600 font-medium">Pickup Assignments</div>
            <div className="text-sm text-purple-500">Notify about new pickup assignments</div>
          </button>
          <button
            onClick={createRewardAnnouncement}
            className="p-4 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors text-left"
          >
            <div className="text-green-600 font-medium">Reward Announcements</div>
            <div className="text-sm text-green-500">Announce reward points earned</div>
          </button>
          <button
            onClick={createSubscriptionReminder}
            className="p-4 bg-orange-50 border border-orange-200 rounded-lg hover:bg-orange-100 transition-colors text-left"
          >
            <div className="text-orange-600 font-medium">Subscription Reminders</div>
            <div className="text-sm text-orange-500">Remind about subscription renewals</div>
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow border">
            <div className="text-2xl font-bold text-blue-600">{notifications.length}</div>
            <div className="text-sm text-gray-600">Total Notifications</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border">
            <div className="text-2xl font-bold text-yellow-600">{pendingCount}</div>
            <div className="text-sm text-gray-600">Pending</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border">
            <div className="text-2xl font-bold text-green-600">{sentCount}</div>
            <div className="text-sm text-gray-600">Sent</div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
              <input
                type="text"
                placeholder="Search notifications..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Types</option>
                <option value="verification">Verification</option>
                <option value="pickup">Pickup</option>
                <option value="reward">Reward</option>
                <option value="subscription">Subscription</option>
                <option value="system">System</option>
                <option value="broadcast">Broadcast</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="sent">Sent</option>
                <option value="failed">Failed</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={() => {
                  setFilterType('all');
                  setFilterStatus('all');
                  setSearchTerm('');
                }}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Notifications List */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Notification
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Partner
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Priority
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredNotifications.map(notification => {
                  const partner = notification.partnerId ? partners.find(p => p.id === notification.partnerId) : null;
                  return (
                    <tr key={notification.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{notification.title}</div>
                          <div className="text-sm text-gray-500 truncate max-w-xs">{notification.message}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {partner ? partner.name : 'All Partners (Broadcast)'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(notification.type)}`}>
                          {notification.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(notification.priority)}`}>
                          {notification.priority}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getStatusColor(notification.status)}`}>
                          {notification.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(notification.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {notification.status === 'pending' && (
                          <button
                            onClick={() => handleSendNotification(notification.id)}
                            className="text-blue-600 hover:text-blue-900 mr-3"
                          >
                            Send
                          </button>
                        )}
                        <button
                          onClick={() => setSelectedNotification(notification)}
                          className="text-gray-600 hover:text-gray-900"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {filteredNotifications.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No notifications found matching your criteria.
            </div>
          )}
        </div>

        {/* Create Notification Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-gray-900">Create New Notification</h3>
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                    <input
                      type="text"
                      value={newNotification.title}
                      onChange={(e) => setNewNotification({ ...newNotification, title: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Notification title"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                    <textarea
                      value={newNotification.message}
                      onChange={(e) => setNewNotification({ ...newNotification, message: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={4}
                      placeholder="Notification message"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                      <select
                        value={newNotification.type}
                        onChange={(e) => setNewNotification({ ...newNotification, type: e.target.value as Notification['type'] })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="system">System</option>
                        <option value="verification">Verification</option>
                        <option value="pickup">Pickup</option>
                        <option value="reward">Reward</option>
                        <option value="subscription">Subscription</option>
                        <option value="broadcast">Broadcast</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                      <select
                        value={newNotification.priority}
                        onChange={(e) => setNewNotification({ ...newNotification, priority: e.target.value as Notification['priority'] })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Target Audience</label>
                    <div className="space-y-2">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          checked={newNotification.isBroadcast}
                          onChange={() => setNewNotification({ ...newNotification, isBroadcast: true, targetPartners: [] })}
                          className="mr-2"
                        />
                        <span className="text-sm">Broadcast to all partners</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          checked={!newNotification.isBroadcast}
                          onChange={() => setNewNotification({ ...newNotification, isBroadcast: false })}
                          className="mr-2"
                        />
                        <span className="text-sm">Select specific partners</span>
                      </label>
                    </div>

                    {!newNotification.isBroadcast && (
                      <div className="mt-3 max-h-40 overflow-y-auto border border-gray-300 rounded-lg p-3">
                        {partners.map(partner => (
                          <label key={partner.id} className="flex items-center mb-2">
                            <input
                              type="checkbox"
                              checked={newNotification.targetPartners.includes(partner.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setNewNotification({
                                    ...newNotification,
                                    targetPartners: [...newNotification.targetPartners, partner.id]
                                  });
                                } else {
                                  setNewNotification({
                                    ...newNotification,
                                    targetPartners: newNotification.targetPartners.filter(id => id !== partner.id)
                                  });
                                }
                              }}
                              className="mr-2"
                            />
                            <span className="text-sm">{partner.name}</span>
                          </label>
                        ))}
                      </div>
                    )}
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
                    onClick={handleCreateNotification}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    Create Notification
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Notification Details Modal */}
        {selectedNotification && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl max-w-lg w-full mx-4">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-gray-900">Notification Details</h3>
                  <button
                    onClick={() => setSelectedNotification(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Title</label>
                    <p className="text-sm text-gray-900">{selectedNotification.title}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Message</label>
                    <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">{selectedNotification.message}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Type</label>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(selectedNotification.type)}`}>
                        {selectedNotification.type}
                      </span>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Priority</label>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(selectedNotification.priority)}`}>
                        {selectedNotification.priority}
                      </span>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Status</label>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getStatusColor(selectedNotification.status)}`}>
                        {selectedNotification.status}
                      </span>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Partner</label>
                      <p className="text-sm text-gray-900">
                        {selectedNotification.partnerId
                          ? partners.find(p => p.id === selectedNotification.partnerId)?.name || 'Unknown'
                          : 'All Partners (Broadcast)'
                        }
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Created</label>
                      <p className="text-sm text-gray-900">
                        {new Date(selectedNotification.createdAt).toLocaleString()}
                      </p>
                    </div>
                    {selectedNotification.sentAt && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Sent</label>
                        <p className="text-sm text-gray-900">
                          {new Date(selectedNotification.sentAt).toLocaleString()}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-end mt-6">
                  <button
                    onClick={() => setSelectedNotification(null)}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                  >
                    Close
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

export default AdminNotificationsPage;