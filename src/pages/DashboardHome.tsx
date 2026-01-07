import React from 'react';
import { useWasteRequests, useImpactMetrics } from '../hooks/useData';
import { useAuth } from '../hooks/useAuth';

const DashboardHome: React.FC = () => {
  const { partner } = useAuth();
  const { requests } = useWasteRequests();
  const { metrics } = useImpactMetrics();

  const activeRequests = requests.filter(req => req.status !== 'Completed');
  const completedToday = requests.filter(req =>
    req.status === 'Completed' &&
    new Date(req.date).toDateString() === new Date().toDateString()
  );

  return (
    <div className="space-y-8">
      <div className="bg-gradient-to-r from-emerald-600 via-blue-600 to-indigo-600 rounded-2xl p-8 text-white shadow-2xl">
        <h1 className="text-3xl font-bold mb-2">Welcome back, {partner?.name || 'Partner'}!</h1>
        <p className="text-emerald-100 text-lg">Here's your overview for today.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 border border-gray-100">
          <div className="flex items-center">
            <div className="p-3 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className="ml-4 min-w-0 flex-1">
              <p className="text-sm font-semibold text-gray-600 truncate">Active Requests</p>
              <p className="text-3xl font-bold text-gray-900">{activeRequests.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 border border-gray-100">
          <div className="flex items-center">
            <div className="p-3 bg-gradient-to-br from-emerald-100 to-emerald-200 rounded-xl">
              <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div className="ml-4 min-w-0 flex-1">
              <p className="text-sm font-semibold text-gray-600 truncate">Completed Today</p>
              <p className="text-3xl font-bold text-gray-900">{completedToday.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 border border-gray-100">
          <div className="flex items-center">
            <div className="p-3 bg-gradient-to-br from-yellow-100 to-orange-200 rounded-xl">
              <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <div className="ml-4 min-w-0 flex-1">
              <p className="text-sm font-semibold text-gray-600 truncate">Waste Processed</p>
              <p className="text-2xl font-bold text-gray-900">{metrics.wasteProcessed}<span className="text-lg">kg</span></p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 border border-gray-100">
          <div className="flex items-center">
            <div className="p-3 bg-gradient-to-br from-amber-100 to-yellow-200 rounded-xl">
              <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <div className="ml-4 min-w-0 flex-1">
              <p className="text-sm font-semibold text-gray-600 truncate">Reward Points</p>
              <p className="text-3xl font-bold text-gray-900">{partner?.rewardPoints || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white shadow-2xl rounded-2xl border border-gray-100 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-blue-50">
          <h2 className="text-xl font-bold text-gray-900">Recent Activity</h2>
        </div>
        <div className="p-6">
          <div className="space-y-6">
            {requests.slice(0, 3).map((request) => (
              <div key={request.id} className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-300">
                <div className="flex flex-col md:flex-row">
                  {/* Waste Image */}
                  <div className="md:w-1/3 p-4">
                    <div className="relative">
                      <img
                        src={request.image}
                        alt={`${request.type} waste`}
                        className="w-full h-32 md:h-40 object-cover rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300"
                      />
                      <div className="absolute top-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded-full">
                        {request.confidence}% AI
                      </div>
                    </div>
                  </div>

                  {/* Waste Details */}
                  <div className="md:w-2/3 p-4 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="text-lg font-bold text-gray-900">{request.type}</h3>
                          <p className="text-sm text-gray-600 flex items-center mt-1">
                            <svg className="w-4 h-4 mr-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            {request.location}
                          </p>
                        </div>
                        <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                          request.status === 'Completed' ? 'bg-emerald-100 text-emerald-800' :
                          request.status === 'In Progress' ? 'bg-yellow-100 text-yellow-800' :
                          request.status === 'Accepted' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {request.status}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mt-3">
                        <div className="bg-white/70 rounded-lg p-3">
                          <p className="text-xs text-gray-500 uppercase tracking-wide">Quantity</p>
                          <p className="text-lg font-semibold text-gray-900">{request.quantity}</p>
                        </div>
                        <div className="bg-white/70 rounded-lg p-3">
                          <p className="text-xs text-gray-500 uppercase tracking-wide">Date</p>
                          <p className="text-sm font-semibold text-gray-900">
                            {new Date(request.date).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardHome;