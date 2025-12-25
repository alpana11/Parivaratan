import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { mockPartner } from '../data/mockData';

const PartnerDashboard: React.FC = () => {
  const location = useLocation();

  // Mock check - in real app, this would come from auth context
  if (mockPartner.status !== 'approved') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-4">Your account is not yet approved.</p>
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

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: '🏠' },
    { name: 'Waste Requests', href: '/dashboard/requests', icon: '📦' },
    { name: 'Location & Routes', href: '/dashboard/location-routes', icon: '📍' },
    { name: 'Pickup History', href: '/dashboard/history', icon: '📋' },
    { name: 'Impact & Analytics', href: '/dashboard/analytics', icon: '📊' },
    { name: 'Rewards', href: '/dashboard/rewards', icon: '🎁' },
    { name: 'Notifications', href: '/dashboard/notifications', icon: '🔔' },
    { name: 'Profile', href: '/dashboard/profile', icon: '👤' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 w-64 bg-white/95 backdrop-blur-sm shadow-2xl border-r border-gray-200">
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-center h-16 bg-gradient-to-r from-emerald-600 to-blue-600 shadow-lg">
            <h1 className="text-xl font-bold text-white">Parivartan</h1>
          </div>

          <nav className="flex-1 px-4 py-6 space-y-2">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-300 ${
                  location.pathname === item.href
                    ? 'bg-gradient-to-r from-emerald-100 to-blue-100 text-emerald-700 shadow-lg transform scale-105'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-emerald-600 hover:shadow-md hover:transform hover:scale-102'
                }`}
              >
                <span className="mr-3 text-lg">{item.icon}</span>
                {item.name}
              </Link>
            ))}
          </nav>

          <div className="p-4 border-t border-gray-200 bg-gray-50/50">
            <div className="flex items-center p-3 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-full flex items-center justify-center shadow-lg">
                  <span className="text-white text-sm font-bold">
                    {mockPartner.name.charAt(0)}
                  </span>
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-semibold text-gray-900">{mockPartner.name}</p>
                <p className="text-xs text-gray-500">{mockPartner.email}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="ml-64">
        <main className="p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default PartnerDashboard;