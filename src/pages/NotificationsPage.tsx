import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { dbService } from '../services/dbService';
import { useWasteRequests } from '../hooks/useData';

const NotificationsPage: React.FC = () => {
  const { partner } = useAuth();
  const { streamActive, updateCount: pathwayUpdateCount } = useWasteRequests();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [updateCount, setUpdateCount] = useState(0);

  useEffect(() => {
    if (!partner?.id) return;
    const unsubscribe = dbService.subscribeToPartnerNotifications(partner.id, (data) => {
      setNotifications(data);
      setUpdateCount(prev => prev + 1);
    });
    return () => unsubscribe();
  }, [partner?.id]);

  const markAsRead = async (id: string) => {
    try {
      await dbService.markNotificationAsRead(id);
      setNotifications(prev =>
        prev.map(notif =>
          notif.id === id ? { ...notif, readAt: new Date().toISOString() } : notif
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleAvailabilityResponse = async (notificationId: string, response: 'confirmed' | 'declined') => {
    try {
      await dbService.respondToAvailabilityConfirmation(notificationId, response);
      setNotifications(prev =>
        prev.map(notif =>
          notif.id === notificationId 
            ? { ...notif, status: response, respondedAt: new Date().toISOString() } 
            : notif
        )
      );
      
      const responseText = response === 'confirmed' 
        ? 'confirmed your availability! The partner will proceed with the pickup.' 
        : 'declined. The partner will contact you to reschedule.';
      
      alert(`✅ You have ${responseText}`);
    } catch (error) {
      console.error('Error responding to availability confirmation:', error);
      alert('Failed to send response');
    }
  };

  const markAllAsRead = async () => {
    try {
      const unreadIds = notifications.filter(n => !n.readAt).map(n => n.id);
      await Promise.all(unreadIds.map(id => dbService.markNotificationAsRead(id)));
      setNotifications(prev =>
        prev.map(notif => ({ ...notif, readAt: new Date().toISOString() }))
      );
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const unreadCount = notifications.filter(n => !n.readAt).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
            {streamActive && (
              <div className="flex items-center space-x-2 bg-green-50 px-3 py-1 rounded-full border border-green-200">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                <span className="text-xs text-green-700 font-medium">Pathway Live • {pathwayUpdateCount}</span>
              </div>
            )}
          </div>
          <p className="text-gray-600">Stay updated with your activities and system messages</p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
          >
            Mark All as Read
          </button>
        )}
      </div>

      {/* Notification Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Notifications</p>
              <p className="text-2xl font-bold text-gray-900">{notifications.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM4.868 12.683A17.925 17.925 0 0112 21c7.962 0 12-1.21 12-2.683m-12 2.683a17.925 17.925 0 01-7.132-8.317M12 21c4.411 0 8-4.03 8-9s-3.589-9-8-9-8 4.03-8 9a9.23 9.23 0 001.868 5.683z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Unread</p>
              <p className="text-2xl font-bold text-gray-900">{unreadCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Read</p>
              <p className="text-2xl font-bold text-gray-900">{notifications.length - unreadCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Notifications List */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          {notifications.length === 0 ? (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM4.868 12.683A17.925 17.925 0 0112 21c7.962 0 12-1.21 12-2.683m-12 2.683a17.925 17.925 0 01-7.132-8.317M12 21c4.411 0 8-4.03 8-9s-3.589-9-8-9-8 4.03-8 9a9.23 9.23 0 001.868 5.683z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No notifications</h3>
              <p className="mt-1 text-sm text-gray-500">You'll receive notifications about new requests and updates here.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`border rounded-lg p-4 ${
                    !notification.readAt ? 'bg-blue-50 border-blue-200' : 'bg-white'
                  } ${
                    notification.type === 'availability_confirmation' && !notification.respondedAt
                      ? 'border-l-4 border-l-purple-500'
                      : ''
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {notification.type === 'availability_confirmation' && (
                        <div className="flex items-center mb-2">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                            </svg>
                            Partner is asking you
                          </span>
                        </div>
                      )}
                      <p className={`text-sm ${
                        !notification.readAt ? 'font-medium text-gray-900' : 'text-gray-700'
                      }`}>
                        {notification.message}
                      </p>
                      {notification.metadata?.pickupDate && notification.metadata?.pickupTime && (
                        <div className="mt-2 text-sm text-gray-600 bg-gray-50 p-2 rounded">
                          <span className="font-semibold">Pickup Details:</span> {new Date(notification.metadata.pickupDate).toLocaleDateString()} at {notification.metadata.pickupTime}
                        </div>
                      )}
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(notification.createdAt).toLocaleDateString()} at {new Date(notification.createdAt).toLocaleTimeString()}
                      </p>
                      {notification.respondedAt && (
                        <p className="text-xs text-green-600 mt-1 font-medium">
                          ✓ Responded: {notification.status === 'confirmed' ? 'Confirmed' : 'Declined'} on {new Date(notification.respondedAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <div className="ml-4 flex flex-col space-y-2">
                      {notification.type === 'availability_confirmation' && !notification.respondedAt ? (
                        <>
                          <button
                            onClick={() => handleAvailabilityResponse(notification.id, 'confirmed')}
                            className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
                          >
                            ✓ Yes, I'm Available
                          </button>
                          <button
                            onClick={() => handleAvailabilityResponse(notification.id, 'declined')}
                            className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
                          >
                            ✗ No, Not Available
                          </button>
                        </>
                      ) : (
                        !notification.readAt && (
                          <button
                            onClick={() => markAsRead(notification.id)}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                          >
                            Mark as read
                          </button>
                        )
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationsPage;