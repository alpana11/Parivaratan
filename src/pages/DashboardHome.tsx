import React, { useEffect } from 'react';
import { useWasteRequests, useImpactMetrics } from '../hooks/useData';
import { useAuth } from '../hooks/useAuth';
import AOS from 'aos';
import 'aos/dist/aos.css';

const DashboardHome: React.FC = () => {
  const { partner, user } = useAuth();
  useEffect(() => { AOS.init({ duration: 600, once: true }); }, []);
  const { requests, streamActive: pathwayStreamActive, updateCount: pathwayUpdateCount } = useWasteRequests();
  const { metrics } = useImpactMetrics();

  const activeRequests = requests.filter(req => {
    const status = (req.status || '').toLowerCase();
    return status !== 'completed';
  });
  const completedRequests = requests.filter(req => {
    const status = (req.status || '').toLowerCase();
    return status === 'completed';
  });

  console.log('📊 DASHBOARD DEBUG:', {
    totalRequests: requests.length,
    activeCount: activeRequests.length,
    completedCount: completedRequests.length,
    allStatuses: requests.map(r => ({ status: r.status, date: r.date }))
  });

  // AI insights disabled on partner dashboard (available in AI Summary page)
  const analysis = null;
  const insightsLoading = false;

  if (!partner) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="bg-gradient-to-r from-emerald-600 via-blue-600 to-indigo-600 rounded-2xl p-8 text-white shadow-2xl">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold mb-2">Welcome back, {partner?.name || 'Partner'}!</h1>
            <p className="text-emerald-100 text-lg">Here's your overview for today.</p>
          </div>
          {pathwayStreamActive && (
            <div className="flex items-center space-x-2 bg-white/20 px-4 py-2 rounded-lg">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
              <span className="text-sm">Pathway Live • {pathwayUpdateCount}</span>
            </div>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div data-aos="fade-up" data-aos-delay="0" className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 border border-gray-100">
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

        <div data-aos="fade-up" data-aos-delay="100" className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 border border-gray-100">
          <div className="flex items-center">
            <div className="p-3 bg-gradient-to-br from-emerald-100 to-emerald-200 rounded-xl">
              <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div className="ml-4 min-w-0 flex-1">
              <p className="text-sm font-semibold text-gray-600 truncate">Completed</p>
              <p className="text-3xl font-bold text-gray-900">{completedRequests.length}</p>
            </div>
          </div>
        </div>

        <div data-aos="fade-up" data-aos-delay="200" className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 border border-gray-100">
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
      </div>

      {/* AI Insights Section - Powered by Pathway */}
      {insightsLoading && !pathwayStreamActive && (
        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-2xl p-6 border border-purple-200 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900 flex items-center">
              <span className="text-2xl mr-2">🤖</span>
              AI Insights - Powered by Pathway
            </h2>
            <div className="flex items-center space-x-2 bg-yellow-100 px-3 py-1 rounded-full">
              <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
              <span className="text-xs text-yellow-700 font-medium">Initializing...</span>
            </div>
          </div>
          <div className="animate-pulse space-y-4">
            <div className="h-20 bg-white rounded-lg"></div>
            <div className="h-32 bg-white rounded-lg"></div>
          </div>
        </div>
      )}
      {pathwayStreamActive && analysis && (
        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-2xl p-6 border border-purple-200 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900 flex items-center">
              <span className="text-2xl mr-2">🤖</span>
              AI Insights - Powered by Pathway
            </h2>
            <div className="flex items-center space-x-2 bg-green-100 px-3 py-1 rounded-full">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              <span className="text-xs text-green-700 font-medium">Live Stream Active</span>
            </div>
          </div>

          {/* Performance Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="bg-white rounded-lg p-4 border border-purple-100">
              <div className="text-sm text-gray-600">Success Rate</div>
              <div className="text-2xl font-bold text-purple-600">
                {analysis.totalRequests > 0 
                  ? Math.round((requests.filter(r => r.status === 'Completed').length / analysis.totalRequests) * 100)
                  : 0}%
              </div>
            </div>
            <div className="bg-white rounded-lg p-4 border border-purple-100">
              <div className="text-sm text-gray-600">Top Waste Type</div>
              <div className="text-lg font-bold text-purple-600">{analysis.topWasteType || 'N/A'}</div>
            </div>
            <div className="bg-white rounded-lg p-4 border border-purple-100">
              <div className="text-sm text-gray-600">Most Active Area</div>
              <div className="text-lg font-bold text-purple-600">{analysis.topArea || 'N/A'}</div>
            </div>
          </div>

          {/* AI Recommendations */}
          {analysis.recommendations && analysis.recommendations.length > 0 && (
            <div className="bg-white rounded-lg p-4 border border-purple-100">
              <h3 className="font-semibold text-gray-900 mb-2 flex items-center">
                <span className="mr-2">💡</span>
                AI Recommendations for You
              </h3>
              <div className="space-y-2">
                {analysis.recommendations.slice(0, 3).map((rec: string, index: number) => (
                  <div key={index} className="flex items-start text-sm text-gray-700">
                    <span className="text-purple-500 mr-2">→</span>
                    <span>{rec}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="text-xs text-gray-500 mt-3">
            Updates: {pathwayUpdateCount} | Real-time streaming analytics
          </div>
        </div>
      )}

      {/* Recent Activity */}
      <div className="bg-white shadow-2xl rounded-2xl border border-gray-100 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-blue-50">
          <h2 className="text-xl font-bold text-gray-900">Recent Activity</h2>
        </div>
        <div className="p-6">
          <div className="space-y-6">
            {requests
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
              .slice(0, 3)
              .map((request) => (
              <div key={request.id} className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-300">
                <div className="flex flex-col md:flex-row">
                  {/* Waste Image */}
                  <div className="md:w-1/3 p-4">
                    <div className="relative">
                      <img
                        src={request.image || (request as any).imageUrl || 'https://via.placeholder.com/400x300?text=No+Image'}
                        alt={`${request.type} waste`}
                        className="w-full h-32 md:h-40 object-cover rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300"
                        onError={(e) => {
                          e.currentTarget.src = 'https://via.placeholder.com/400x300?text=Image+Not+Found';
                        }}
                      />
                      <div className="absolute top-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded-full">
                        {request.type}
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
                            {typeof request.location === 'string' ? request.location : request.location?.city || 'Location'}
                          </p>
                        </div>
                        <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                          (request.status || '').toLowerCase() === 'completed' ? 'bg-emerald-100 text-emerald-800' :
                          (request.status || '').toLowerCase() === 'in progress' ? 'bg-yellow-100 text-yellow-800' :
                          (request.status || '').toLowerCase() === 'accepted' ? 'bg-blue-100 text-blue-800' :
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