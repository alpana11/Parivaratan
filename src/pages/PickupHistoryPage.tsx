import React, { useState, useEffect } from 'react';
import { useWasteRequests, useImpactMetrics } from '../hooks/useData';
import { dbService } from '../services/dbService';
import { useAuth } from '../hooks/useAuth';

const PickupHistoryPage: React.FC = () => {
  const { requests, streamActive, updateCount } = useWasteRequests();
  const { metrics } = useImpactMetrics();
  const { user } = useAuth();
  const [scheduledFromDB, setScheduledFromDB] = useState<any[]>([]);
  const [filter, setFilter] = useState<'all' | 'scheduled' | 'completed'>('all');

  useEffect(() => {
    if (!user) return;
    const unsubscribe = dbService.subscribeToScheduledPickups(user.uid, (pickups) => {
      setScheduledFromDB(pickups);
    });
    return () => unsubscribe();
  }, [user]);

  const completedPickups = requests
    .filter(req => req.status === 'Completed')
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  
  // Combine scheduled pickups from both sources and deduplicate
  const scheduledFromRequests = requests.filter(req => req.scheduledDate && req.scheduledTime && req.status !== 'Completed');
  const allScheduled = [...scheduledFromRequests, ...scheduledFromDB];
  
  // Deduplicate by requestId or id and sort by date
  const scheduledPickups = Array.from(
    new Map(allScheduled.map(item => [
      item.requestId || item.id,
      item
    ])).values()
  ).sort((a, b) => {
    const dateA = new Date(a.scheduledDate || a.date).getTime();
    const dateB = new Date(b.scheduledDate || b.date).getTime();
    return dateB - dateA;
  });

  console.log('📦 Pickup History Debug:', {
    totalRequests: requests.length,
    completedCount: completedPickups.length,
    scheduledCount: scheduledPickups.length,
    scheduledFromDB: scheduledFromDB.length,
    allStatuses: requests.map(r => r.status),
    scheduledPickups: scheduledPickups
  });

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Pickup History & Contribution</h1>
            <p className="text-gray-600">Track your completed pickups and environmental impact</p>
          </div>
          {streamActive && (
            <div className="flex items-center space-x-2 bg-green-50 px-3 py-1 rounded-full border border-green-200">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              <span className="text-xs text-green-700 font-medium">Pathway Live • {updateCount}</span>
            </div>
          )}
        </div>
        <div className="flex gap-2 mt-4">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 text-sm rounded-lg transition-colors ${
              filter === 'all' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All ({scheduledPickups.length + completedPickups.length})
          </button>
          <button
            onClick={() => setFilter('scheduled')}
            className={`px-4 py-2 text-sm rounded-lg transition-colors ${
              filter === 'scheduled' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Scheduled Pickups ({scheduledPickups.length})
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`px-4 py-2 text-sm rounded-lg transition-colors ${
              filter === 'completed' ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Completed Pickups ({completedPickups.length})
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Pickups</p>
              <p className="text-2xl font-bold text-gray-900">{completedPickups.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">CO₂ Impact</p>
              <p className="text-2xl font-bold text-gray-900">{metrics.co2Reduction}kg</p>
            </div>
          </div>
        </div>
      </div>

      {/* Scheduled Pickups and Completed Pickups - Side by Side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Scheduled Pickups - Left */}
        {(filter === 'all' || filter === 'scheduled') && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Scheduled Pickups</h2>
            {scheduledPickups.length === 0 ? (
              <div className="text-center py-12">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No scheduled pickups</h3>
                <p className="mt-1 text-sm text-gray-500">Scheduled pickups will appear here.</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-[600px] overflow-y-auto">
                {scheduledPickups.map((pickup) => {
                  const imageUrl = pickup.imageUrl || pickup.image || '';
                  const statusColors = {
                    'Assigned': 'bg-yellow-100 text-yellow-800',
                    'Accepted': 'bg-blue-100 text-blue-800',
                    'In Progress': 'bg-purple-100 text-purple-800'
                  };
                  return (
                    <div key={pickup.id} className="border rounded-lg p-4 bg-blue-50">
                      <div className="flex items-start space-x-4">
                        {imageUrl ? (
                          <img
                            src={imageUrl}
                            alt="Waste"
                            className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-lg bg-gray-200 flex items-center justify-center flex-shrink-0">
                            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h3 className="text-lg font-medium text-gray-900">{pickup.type}</h3>
                            {pickup.status && (
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusColors[pickup.status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'}`}>
                                {pickup.status}
                              </span>
                            )}
                          </div>
                          <div className="mt-2 grid grid-cols-2 gap-4 text-sm text-gray-600">
                            <div>
                              <span className="font-medium">User Name:</span> {pickup.userName || 'N/A'}
                            </div>
                            <div>
                              <span className="font-medium">Phone:</span> {pickup.userPhone || pickup.phoneNumber || 'N/A'}
                            </div>
                            <div>
                              <span className="font-medium">Location:</span> {typeof pickup.location === 'string' ? pickup.location : pickup.area || [pickup.location?.house, pickup.location?.street, pickup.location?.city, pickup.location?.pincode].filter(Boolean).join(', ')}
                            </div>
                            <div className="col-span-2 bg-blue-100 p-2 rounded">
                              <span className="font-medium text-blue-900">📅 Scheduled:</span> <span className="text-blue-900 font-semibold">{pickup.scheduledDate ? new Date(pickup.scheduledDate).toLocaleDateString() : pickup.date ? new Date(pickup.date).toLocaleDateString() : 'N/A'} at {pickup.scheduledTime || pickup.time || 'N/A'}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
        )}

        {/* Completed Pickups - Right */}
        {(filter === 'all' || filter === 'completed') && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Completed Pickups</h2>
            {completedPickups.length === 0 ? (
              <div className="text-center py-12">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No completed pickups</h3>
                <p className="mt-1 text-sm text-gray-500">Your completed pickups will appear here.</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-[600px] overflow-y-auto">
                {completedPickups.map((pickup) => {
                  const imageUrl = pickup.imageUrl || pickup.image || '';
                  return (
                    <div key={pickup.id} className="border rounded-lg p-4 bg-blue-50">
                      <div className="flex items-start space-x-4">
                        {imageUrl ? (
                          <img
                            src={imageUrl}
                            alt="Waste"
                            className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-lg bg-gray-200 flex items-center justify-center flex-shrink-0">
                            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h3 className="text-lg font-medium text-gray-900">{pickup.type}</h3>
                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                              Completed
                            </span>
                          </div>
                          <div className="mt-2 grid grid-cols-2 gap-4 text-sm text-gray-600">
                            <div>
                              <span className="font-medium">Quantity:</span> {pickup.quantity}
                            </div>
                            <div>
                              <span className="font-medium">Location:</span> {typeof pickup.location === 'string' ? pickup.location : [pickup.location?.house, pickup.location?.street, pickup.location?.city, pickup.location?.pincode].filter(Boolean).join(', ')}
                            </div>
                            <div>
                              <span className="font-medium">Phone:</span> {pickup.userPhone || pickup.phoneNumber || 'N/A'}
                            </div>
                            <div>
                              <span className="font-medium">Date:</span> {new Date(pickup.date).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
        )}
      </div>

      {/* Environmental Impact */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Environmental Impact</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="text-center">
              <div className="bg-green-50 p-6 rounded-lg">
                <svg className="mx-auto h-12 w-12 text-green-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900">Waste Processed</h3>
                <p className="text-3xl font-bold text-green-600 mt-2">{metrics.wasteProcessed} kg</p>
                <p className="text-sm text-gray-600 mt-1">Equivalent to recycling {metrics.wasteProcessed > 0 ? Math.round(metrics.wasteProcessed / 10) : 0} plastic bottles</p>
              </div>
            </div>
            <div className="text-center">
              <div className="bg-blue-50 p-6 rounded-lg">
                <svg className="mx-auto h-12 w-12 text-blue-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900">CO₂ Reduction</h3>
                <p className="text-3xl font-bold text-blue-600 mt-2">{metrics.co2Reduction} kg</p>
                <p className="text-sm text-gray-600 mt-1">Equivalent to planting {metrics.co2Reduction > 0 ? Math.round(metrics.co2Reduction / 20) : 0} trees</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PickupHistoryPage;