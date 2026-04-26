import React, { useState, useEffect } from 'react';
import { dbService } from '../services/dbService';
import { Partner, Notification, WasteRequest } from '../types';
import { useToast } from '../components/Toast';

const AdminNotificationsPage: React.FC = () => {
  const { showToast } = useToast();
  const [partners, setPartners] = useState<Partner[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [wasteRequests, setWasteRequests] = useState<WasteRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterRecipient, setFilterRecipient] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [prevNotificationCount, setPrevNotificationCount] = useState(0);

  // Form state for creating notifications
  const [newNotification, setNewNotification] = useState({
    title: '',
    message: '',
    type: 'system' as Notification['type'],
    recipientType: 'all-partners' as 'all-partners' | 'all-users' | 'partner' | 'user',
    selectedPartnerId: '',
    selectedUserId: '',
  });

  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    loadData();
    loadUsers();
    
    // Set up real-time listeners
    const unsubscribeNotifications = dbService.subscribeToNotifications((notificationsData) => {
      console.log('📬 Notifications received:', notificationsData.length, notificationsData);
      
      // Play sound if new notification
      if (notificationsData.length > prevNotificationCount && prevNotificationCount > 0) {
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3');
        audio.play().catch(e => console.log('Audio play failed:', e));
      }
      
      setPrevNotificationCount(notificationsData.length);
      setNotifications(notificationsData);
    });

    return () => {
      unsubscribeNotifications();
    };
  }, []);

  const loadUsers = async () => {
    try {
      const usersSnapshot = await dbService.getAllWasteRequests();
      const uniqueUsers = Array.from(
        new Map(
          usersSnapshot
            .filter(wr => (wr as any).userId)
            .map(wr => [(wr as any).userId, { id: (wr as any).userId, name: (wr as any).userName || 'User' }])
        ).values()
      );
      setUsers(uniqueUsers as any[]);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const loadData = async () => {
    try {
      const [partnersData, wasteRequestsData] = await Promise.all([
        dbService.getAllPartners(),
        dbService.getAllWasteRequests()
      ]);

      setPartners(partnersData);
      setWasteRequests(wasteRequestsData);
    } catch (error) {
      console.error('Error loading notification data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getUserName = (notification: Notification) => {
    if (notification.userId) {
      const wasteRequest = wasteRequests.find(wr => (wr as any).userId === notification.userId);
      return (wasteRequest as any)?.userName || 'User';
    }
    return null;
  };

  const handleCreateNotification = async () => {
    if (!newNotification.title || !newNotification.message) {
      showToast('Please fill in title and message', 'warning');
      return;
    }

    try {
      if (newNotification.recipientType === 'all-partners') {
        // Broadcast to all partners
        const notifications = partners.map(partner => ({
          partnerId: partner.id,
          title: newNotification.title,
          message: newNotification.message,
          type: newNotification.type,
          status: 'pending' as const,
          createdAt: new Date().toISOString(),
          priority: 'medium' as const,
          category: 'general' as const,
        }));
        await dbService.createBulkNotifications(notifications);
      } else if (newNotification.recipientType === 'all-users') {
        // Broadcast to all users
        const notifications = users.map(user => ({
          userId: user.id,
          title: newNotification.title,
          message: newNotification.message,
          type: newNotification.type,
          status: 'pending' as const,
          createdAt: new Date().toISOString(),
          priority: 'medium' as const,
          category: 'general' as const,
        }));
        await dbService.createBulkNotifications(notifications);
      } else if (newNotification.recipientType === 'partner') {
        // Send to specific partner
        if (!newNotification.selectedPartnerId) {
          showToast('Please select a partner', 'warning');
          return;
        }
        await dbService.createNotification({
          partnerId: newNotification.selectedPartnerId,
          title: newNotification.title,
          message: newNotification.message,
          type: newNotification.type,
          status: 'pending',
          createdAt: new Date().toISOString(),
          priority: 'medium',
          category: 'general',
        });
      } else if (newNotification.recipientType === 'user') {
        // Send to specific user
        if (!newNotification.selectedUserId) {
          showToast('Please select a user', 'warning');
          return;
        }
        await dbService.createNotification({
          userId: newNotification.selectedUserId,
          title: newNotification.title,
          message: newNotification.message,
          type: newNotification.type,
          status: 'pending',
          createdAt: new Date().toISOString(),
          priority: 'medium',
          category: 'general',
        });
      }

      // Reset form
      setNewNotification({
        title: '',
        message: '',
        type: 'system',
        recipientType: 'all-partners',
        selectedPartnerId: '',
        selectedUserId: '',
      });

      setShowCreateModal(false);
    } catch (error) {
      console.error('Error creating notification:', error);
      showToast('Failed to create notification', 'error');
    }
  };

  const handleClearAllNotifications = async () => {
    if (!confirm('Are you sure you want to delete all notifications? This cannot be undone.')) {
      return;
    }
    
    try {
      for (const notification of notifications) {
        await dbService.deleteNotification(notification.id);
      }
      showToast('All notifications cleared', 'success');
    } catch (error) {
      console.error('Error clearing notifications:', error);
      showToast('Failed to clear notifications', 'error');
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
    const matchesRecipient = filterRecipient === 'all' || 
      (filterRecipient === 'partner' && notification.partnerId) ||
      (filterRecipient === 'user' && notification.userId && !notification.partnerId) ||
      (filterRecipient === 'broadcast' && !notification.partnerId && !notification.userId) ||
      (filterRecipient === 'admin' && (notification as any).recipientCount);
    const matchesSearch = searchTerm === '' ||
      notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notification.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (notification.partnerId && partners.find(p => p.id === notification.partnerId)?.name.toLowerCase().includes(searchTerm.toLowerCase()));

    return matchesType && matchesRecipient && matchesSearch;
  });

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
            <div className="flex items-center space-x-2 bg-green-50 px-3 py-1 rounded-full border border-green-200">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-green-700 font-medium">Real-time Updates</span>
            </div>
            <div className="flex items-center space-x-4">
            <button
              onClick={handleClearAllNotifications}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
            >
              Clear All
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              + Create Notification
            </button>
          </div>
        </div>
        </div>

{/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow border">
            <div className="text-2xl font-bold text-blue-600">{notifications.length}</div>
            <div className="text-sm text-gray-600">Total Notifications</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border">
            <div className="text-2xl font-bold text-indigo-600">{notifications.filter(n => (n as any).recipientCount).length}</div>
            <div className="text-sm text-gray-600">Admin Created</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border">
            <div className="text-2xl font-bold text-purple-600">{notifications.filter(n => n.partnerId).length}</div>
            <div className="text-sm text-gray-600">Partner Notifications</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border">
            <div className="text-2xl font-bold text-green-600">{notifications.filter(n => n.userId && !n.partnerId).length}</div>
            <div className="text-sm text-gray-600">User Notifications</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border">
            <div className="text-2xl font-bold text-yellow-600">{notifications.filter(n => n.status === 'pending').length}</div>
            <div className="text-sm text-gray-600">Pending</div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Recipient</label>
              <select
                value={filterRecipient}
                onChange={(e) => setFilterRecipient(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Recipients</option>
                <option value="admin">Admin Created</option>
                <option value="partner">Partners</option>
                <option value="user">Users/Citizens</option>
                <option value="broadcast">Broadcast</option>
              </select>
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
            <div className="flex items-end">
              <button
                onClick={() => {
                  setFilterType('all');
                  setFilterRecipient('all');
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
                    Recipient
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
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
                          {partner ? (
                            <>
                              <span className="font-medium">{partner.name}</span>
                              <span className="ml-2 text-xs bg-purple-100 text-purple-800 px-2 py-0.5 rounded">Partner</span>
                            </>
                          ) : notification.userId ? (
                            <>
                              <span className="font-medium">{getUserName(notification)}</span>
                              <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded">Citizen</span>
                            </>
                          ) : (
                            <>
                              <span className="font-medium">All Users</span>
                              <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">Broadcast</span>
                            </>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(notification.type)}`}>
                          {notification.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(notification.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
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

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Send To</label>
                    <select
                      value={newNotification.recipientType}
                      onChange={(e) => setNewNotification({ ...newNotification, recipientType: e.target.value as any })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="all-partners">All Partners</option>
                      <option value="all-users">All Users</option>
                      <option value="partner">Specific Partner</option>
                      <option value="user">Specific User</option>
                    </select>
                  </div>

                  {newNotification.recipientType === 'partner' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Select Partner</label>
                      <select
                        value={newNotification.selectedPartnerId}
                        onChange={(e) => setNewNotification({ ...newNotification, selectedPartnerId: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Choose a partner...</option>
                        {partners.map(partner => (
                          <option key={partner.id} value={partner.id}>{partner.name}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {newNotification.recipientType === 'user' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Select User</label>
                      <select
                        value={newNotification.selectedUserId}
                        onChange={(e) => setNewNotification({ ...newNotification, selectedUserId: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Choose a user...</option>
                        {users.map(user => (
                          <option key={user.id} value={user.id}>{user.name}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Notification Type</label>
                    <select
                      value={newNotification.type}
                      onChange={(e) => setNewNotification({ ...newNotification, type: e.target.value as Notification['type'] })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="system">System</option>
                      <option value="reward">Reward</option>
                      <option value="subscription">Subscription</option>
                    </select>
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
                    Send Notification
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
                      <label className="block text-sm font-medium text-gray-700">Recipient</label>
                      <p className="text-sm text-gray-900">
                        {selectedNotification.partnerId
                          ? partners.find(p => p.id === selectedNotification.partnerId)?.name || 'Unknown Partner'
                          : selectedNotification.userId
                          ? getUserName(selectedNotification) || 'Unknown User'
                          : 'All Users (Broadcast)'
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