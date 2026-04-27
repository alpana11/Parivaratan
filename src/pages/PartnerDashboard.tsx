import React, { useState, useEffect, useRef } from 'react';
import { Link, Outlet, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { dbService } from '../services/dbService';
import { fcmService } from '../services/fcmService';
import ChatBot from '../components/ChatBot';

const PartnerDashboard: React.FC = () => {
  const location = useLocation();
  const { user, partner, loading } = useAuth();
  const [loadTimeout, setLoadTimeout] = React.useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const prevUnreadRef = useRef(0);
  const isFirstLoadRef = useRef(true);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (loading || (user && !partner)) {
        setLoadTimeout(true);
      }
    }, 5000);
    return () => clearTimeout(timer);
  }, [loading, user, partner]);

  useEffect(() => {
    if (!user?.uid) return;

    // Request FCM permission and register token
    fcmService.requestPermissionAndGetToken(user.uid);

    // Listen for foreground FCM messages
    const unsubscribeFCM = fcmService.onForegroundMessage((payload) => {
      new Audio('https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3').play().catch(() => {});
      if (payload.notification) {
        new Notification(payload.notification.title || 'Parivartan', {
          body: payload.notification.body,
          icon: '/assets/icon.png'
        });
      }
    });

    const unsubscribe = dbService.subscribeToPartnerNotifications(user.uid, (notifications) => {
      const unread = notifications.filter(n => !n.readAt).length;

      // Skip sound on initial load, only play for genuinely new notifications
      if (!isFirstLoadRef.current && unread > prevUnreadRef.current) {
        new Audio('https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3')
          .play().catch(() => {});
      }

      isFirstLoadRef.current = false;
      prevUnreadRef.current = unread;
      setUnreadCount(unread);
    });
    return () => {
      unsubscribeFCM();
      unsubscribe();
    };
  }, [user?.uid]);

  const demoAuth = localStorage.getItem('partnerAuth');
  const demoPartner = localStorage.getItem('demoPartner');
  const isAuthenticated = user || demoAuth;
  const currentPartner = partner || (demoPartner ? JSON.parse(demoPartner) : null);

  if (!loading && !isAuthenticated) {
    return <Navigate to="/signin" replace />;
  }

  if (loadTimeout && !currentPartner) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Loading Issue</h1>
          <p className="text-gray-600 mb-4">Unable to load partner data. Please try again.</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-emerald-600 text-white px-6 py-2 rounded-lg hover:bg-emerald-700"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  if (loading || (isAuthenticated && !currentPartner)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your account...</p>
        </div>
      </div>
    );
  }

  if (currentPartner?.verificationStatus === 'pending') {
    return <Navigate to="/verification-pending" replace />;
  }

  if (currentPartner?.verificationStatus === 'approved' && (!currentPartner?.subscription || currentPartner?.subscription?.status !== 'active')) {
    return <Navigate to="/subscription-plans" replace />;
  }

  if (currentPartner && currentPartner?.verificationStatus !== 'approved') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-4">Your account status: {currentPartner?.verificationStatus}</p>
          <Link
            to="/verification-pending"
            className="text-green-600 hover:text-green-700"
          >
            Check verification status
          </Link>
        </div>
      </div>
    );
  }

  const partnerName = currentPartner?.name || 'Partner';
  const partnerEmail = currentPartner?.email || 'partner@example.com';

  if (!currentPartner) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Partner Data Not Found</h1>
          <p className="text-gray-600 mb-4">Unable to load partner information.</p>
          <button
            onClick={() => window.location.href = '/signin'}
            className="bg-emerald-600 text-white px-6 py-2 rounded-lg hover:bg-emerald-700"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: '🏠' },
    { name: 'Waste Requests', href: '/dashboard/requests', icon: '📦' },
    { name: 'Location & Routes', href: '/dashboard/location-routes', icon: '📍' },
    { name: 'Pickup History', href: '/dashboard/history', icon: '📋' },
    { name: 'Impact & Analytics', href: '/dashboard/analytics', icon: '📊' },
    { name: 'Notifications', href: '/dashboard/notifications', icon: '🔔' },
    { name: 'Profile', href: '/dashboard/profile', icon: '👤' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar — hidden on mobile, visible on desktop */}
      <div className={`fixed inset-y-0 left-0 w-64 bg-white/95 backdrop-blur-sm shadow-2xl border-r border-gray-200 z-30 transform transition-transform duration-300
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between h-16 bg-gradient-to-r from-emerald-600 to-blue-600 shadow-lg px-4">
            <h1 className="text-2xl font-bold text-white">Parivartan</h1>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-white text-2xl">×</button>
          </div>
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-300 ${
                  location.pathname === item.href
                    ? 'bg-gradient-to-r from-emerald-100 to-blue-100 text-emerald-700 shadow-lg'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-emerald-600'
                }`}
              >
                <span className="mr-3 text-lg">{item.icon}</span>
                {item.name}
                {item.name === 'Notifications' && unreadCount > 0 && (
                  <span className="ml-auto bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </Link>
            ))}
          </nav>
          <div className="p-4 border-t border-gray-200 bg-gray-50/50">
            <div className="flex items-center p-3 bg-white rounded-xl shadow-sm">
              <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-full flex items-center justify-center shadow-lg flex-shrink-0">
                <span className="text-white text-sm font-bold">{partnerName.charAt(0)}</span>
              </div>
              <div className="ml-3 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{partnerName}</p>
                <p className="text-xs text-gray-500 truncate">{partnerEmail}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:ml-64 min-h-screen">
        {/* Mobile top bar */}
        <div className="lg:hidden sticky top-0 z-10 bg-white shadow-md px-4 py-3 flex items-center justify-between">
          <button onClick={() => setSidebarOpen(true)} className="text-gray-600 text-2xl">☰</button>
          <h1 className="text-lg font-bold bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">Parivartan</h1>
          <Link to="/dashboard/notifications" className="relative">
            <span className="text-xl">🔔</span>
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-4 w-4 flex items-center justify-center">{unreadCount}</span>
            )}
          </Link>
        </div>
        <main className="p-4 lg:p-8 pb-20 lg:pb-8">
          <Outlet />
        </main>
      </div>

      {/* Mobile bottom navigation */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-10">
        <div className="flex justify-around items-center py-2">
          {navigation.slice(0, 5).map((item) => (
            <Link
              key={item.name}
              to={item.href}
              className={`flex flex-col items-center px-2 py-1 text-xs ${
                location.pathname === item.href ? 'text-emerald-600' : 'text-gray-500'
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              <span className="mt-0.5 truncate w-12 text-center">{item.name.split(' ')[0]}</span>
              {item.name === 'Notifications' && unreadCount > 0 && (
                <span className="absolute top-1 bg-red-500 text-white text-xs font-bold rounded-full h-4 w-4 flex items-center justify-center">{unreadCount}</span>
              )}
            </Link>
          ))}
        </div>
      </div>

      <ChatBot />
    </div>
  );
};

export default PartnerDashboard;