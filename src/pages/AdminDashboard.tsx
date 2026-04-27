import React, { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import FloatingActionButton from '../components/FloatingActionButton';

const AdminDashboard: React.FC = () => {
  const { admin, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/', { replace: true });
      window.history.pushState(null, '', '/');
      window.addEventListener('popstate', () => {
        window.history.pushState(null, '', '/');
      });
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const isActiveRoute = (path: string) => {
    return location.pathname === path;
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Header */}
      <header className="bg-gradient-to-r from-white to-gray-50 shadow-lg border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden mr-4 text-gray-600 text-2xl hover:text-gray-900"
              >
                ☰
              </button>
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-green-500 rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-lg">P</span>
                </div>
                <div className="hidden sm:block">
                  <h1 className="text-xl font-bold text-gray-900">PARIVARTAN</h1>
                  <p className="text-xs text-gray-500">Admin Panel</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">
                    {admin?.name?.charAt(0)?.toUpperCase() || 'A'}
                  </span>
                </div>
                <div className="hidden md:block">
                  <span className="text-sm font-medium text-gray-900">{admin?.name}</span>
                  <p className="text-xs text-gray-500">Administrator</p>
                </div>
              </div>
              <button
                onClick={handleSignOut}
                className="text-sm text-gray-500 hover:text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors duration-200 flex items-center space-x-2"
              >
                <span>🚪</span>
                <span className="hidden sm:block">Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar — hidden on mobile, visible on desktop */}
        <nav className={`fixed inset-y-0 left-0 w-64 bg-white shadow-lg h-screen border-r border-gray-200 overflow-y-auto z-30 transform transition-transform duration-300
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:sticky lg:top-0 lg:h-screen lg:w-64 lg:flex-shrink-0`}>
          <div className="p-6">
            <div className="mb-8">
              {/* Title moved to header */}
            </div>
            <ul className="space-y-2 pb-6">
              <li>
                <Link
                  to="/admin/dashboard"
                  onClick={() => setSidebarOpen(false)}
                  className={`group flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                    isActiveRoute('/admin/dashboard')
                      ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg transform scale-105'
                      : 'text-gray-700 hover:bg-gray-100 hover:shadow-md'
                  }`}
                >
                  <span className="text-lg mr-3">📊</span>
                  <span>Dashboard Overview</span>
                  {isActiveRoute('/admin/dashboard') && (
                    <div className="ml-auto w-2 h-2 bg-white rounded-full"></div>
                  )}
                </Link>
              </li>
              <li>
                <Link
                  to="/admin/users"
                  onClick={() => setSidebarOpen(false)}
                  className={`group flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                    isActiveRoute('/admin/users')
                      ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg transform scale-105'
                      : 'text-gray-700 hover:bg-gray-100 hover:shadow-md'
                  }`}
                >
                  <span className="text-lg mr-3">👥</span>
                  <span>Users Management</span>
                  {isActiveRoute('/admin/users') && (
                    <div className="ml-auto w-2 h-2 bg-white rounded-full"></div>
                  )}
                </Link>
              </li>
              <li>
                <Link
                  to="/admin/waste-requests"
                  onClick={() => setSidebarOpen(false)}
                  className={`group flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                    isActiveRoute('/admin/waste-requests')
                      ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg transform scale-105'
                      : 'text-gray-700 hover:bg-gray-100 hover:shadow-md'
                  }`}
                >
                  <span className="text-lg mr-3">♻️</span>
                  <span>Waste Requests</span>
                  {isActiveRoute('/admin/waste-requests') && (
                    <div className="ml-auto w-2 h-2 bg-white rounded-full"></div>
                  )}
                </Link>
              </li>
              <li>
                <Link
                  to="/admin/partners"
                  onClick={() => setSidebarOpen(false)}
                  className={`group flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                    isActiveRoute('/admin/partners')
                      ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg transform scale-105'
                      : 'text-gray-700 hover:bg-gray-100 hover:shadow-md'
                  }`}
                >
                  <span className="text-lg mr-3">🧑‍🤝‍🧑</span>
                  <span>Partner Management</span>
                  {isActiveRoute('/admin/partners') && (
                    <div className="ml-auto w-2 h-2 bg-white rounded-full"></div>
                  )}
                </Link>
              </li>
              <li>
                <Link
                  to="/admin/documents"
                  onClick={() => setSidebarOpen(false)}
                  className={`group flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                    isActiveRoute('/admin/documents')
                      ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg transform scale-105'
                      : 'text-gray-700 hover:bg-gray-100 hover:shadow-md'
                  }`}
                >
                  <span className="text-lg mr-3">📄</span>
                  <span>Document Verification</span>
                  {isActiveRoute('/admin/documents') && (
                    <div className="ml-auto w-2 h-2 bg-white rounded-full"></div>
                  )}
                </Link>
              </li>
              <li>
                <Link
                  to="/admin/subscriptions"
                  onClick={() => setSidebarOpen(false)}
                  className={`group flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                    isActiveRoute('/admin/subscriptions')
                      ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg transform scale-105'
                      : 'text-gray-700 hover:bg-gray-100 hover:shadow-md'
                  }`}
                >
                  <span className="text-lg mr-3">💳</span>
                  <span>Subscriptions</span>
                  {isActiveRoute('/admin/subscriptions') && (
                    <div className="ml-auto w-2 h-2 bg-white rounded-full"></div>
                  )}
                </Link>
              </li>
              <li>
                <Link
                  to="/admin/rewards"
                  onClick={() => setSidebarOpen(false)}
                  className={`group flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                    isActiveRoute('/admin/rewards')
                      ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg transform scale-105'
                      : 'text-gray-700 hover:bg-gray-100 hover:shadow-md'
                  }`}
                >
                  <span className="text-lg mr-3">🎁</span>
                  <span>Rewards Management</span>
                  {isActiveRoute('/admin/rewards') && (
                    <div className="ml-auto w-2 h-2 bg-white rounded-full"></div>
                  )}
                </Link>
              </li>
              <li>
                <Link
                  to="/admin/vouchers"
                  onClick={() => setSidebarOpen(false)}
                  className={`group flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                    isActiveRoute('/admin/vouchers')
                      ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg transform scale-105'
                      : 'text-gray-700 hover:bg-gray-100 hover:shadow-md'
                  }`}
                >
                  <span className="text-lg mr-3">🎟️</span>
                  <span>Voucher Management</span>
                  {isActiveRoute('/admin/vouchers') && (
                    <div className="ml-auto w-2 h-2 bg-white rounded-full"></div>
                  )}
                </Link>
              </li>
              <li>
                <Link
                  to="/admin/scheduling"
                  onClick={() => setSidebarOpen(false)}
                  className={`group flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                    isActiveRoute('/admin/scheduling')
                      ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg transform scale-105'
                      : 'text-gray-700 hover:bg-gray-100 hover:shadow-md'
                  }`}
                >
                  <span className="text-lg mr-3">📅</span>
                  <span>Scheduling</span>
                  {isActiveRoute('/admin/scheduling') && (
                    <div className="ml-auto w-2 h-2 bg-white rounded-full"></div>
                  )}
                </Link>
              </li>
              <li>
                <Link
                  to="/admin/analytics"
                  onClick={() => setSidebarOpen(false)}
                  className={`group flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                    isActiveRoute('/admin/analytics')
                      ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg transform scale-105'
                      : 'text-gray-700 hover:bg-gray-100 hover:shadow-md'
                  }`}
                >
                  <span className="text-lg mr-3">📈</span>
                  <span>Analytics</span>
                  {isActiveRoute('/admin/analytics') && (
                    <div className="ml-auto w-2 h-2 bg-white rounded-full"></div>
                  )}
                </Link>
              </li>
              <li>
                <Link
                  to="/admin/notifications"
                  onClick={() => setSidebarOpen(false)}
                  className={`group flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                    isActiveRoute('/admin/notifications')
                      ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg transform scale-105'
                      : 'text-gray-700 hover:bg-gray-100 hover:shadow-md'
                  }`}
                >
                  <span className="text-lg mr-3">🔔</span>
                  <span>Notifications</span>
                  {isActiveRoute('/admin/notifications') && (
                    <div className="ml-auto w-2 h-2 bg-white rounded-full"></div>
                  )}
                </Link>
              </li>
              <li>
                <Link
                  to="/admin/community"
                  onClick={() => setSidebarOpen(false)}
                  className={`group flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                    isActiveRoute('/admin/community')
                      ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg transform scale-105'
                      : 'text-gray-700 hover:bg-gray-100 hover:shadow-md'
                  }`}
                >
                  <span className="text-lg mr-3">🌱</span>
                  <span>Community</span>
                  {isActiveRoute('/admin/community') && (
                    <div className="ml-auto w-2 h-2 bg-white rounded-full"></div>
                  )}
                </Link>
              </li>

            </ul>
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex-1 overflow-x-hidden px-4 sm:px-8 pt-8 pb-8 lg:ml-0">
          <Outlet />
        </main>
      </div>
      <FloatingActionButton actions={[
        { icon: '🧑🤝🧑', label: 'Partners', onClick: () => navigate('/admin/partners'), color: 'bg-blue-500' },
        { icon: '♻️', label: 'Waste Requests', onClick: () => navigate('/admin/waste-requests'), color: 'bg-green-500' },
        { icon: '🎫', label: 'Vouchers', onClick: () => navigate('/admin/vouchers'), color: 'bg-purple-500' },
        { icon: '🔔', label: 'Notifications', onClick: () => navigate('/admin/notifications'), color: 'bg-orange-500' },
      ]} />
    </div>
  );
};

export default AdminDashboard;