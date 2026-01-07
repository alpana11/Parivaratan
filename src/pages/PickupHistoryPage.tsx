import React from 'react';
import { useWasteRequests, useImpactMetrics } from '../hooks/useData';

const PickupHistoryPage: React.FC = () => {
  const { requests } = useWasteRequests();
  const { metrics } = useImpactMetrics();

  const pickupHistory = requests.filter(req => req.status === 'Completed');
  const totalEarnings = pickupHistory.length * 50; // Mock: ₹50 per pickup

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Pickup History & Contribution</h1>
        <p className="text-gray-600">Track your completed pickups and environmental impact</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Pickups</p>
              <p className="text-2xl font-bold text-gray-900">{pickupHistory.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Earnings</p>
              <p className="text-2xl font-bold text-gray-900">₹{totalEarnings}</p>
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

      {/* Pickup History */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Pickup History</h2>
          {pickupHistory.length === 0 ? (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No completed pickups</h3>
              <p className="mt-1 text-sm text-gray-500">Your completed pickups will appear here.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pickupHistory.map((pickup) => (
                <div key={pickup.id} className="border rounded-lg p-4">
                  <div className="flex items-start space-x-4">
                    <img
                      src={pickup.image}
                      alt="Waste"
                      className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-medium text-gray-900">{pickup.type}</h3>
                        <div className="text-right">
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                            Completed
                          </span>
                          <p className="text-sm text-gray-600 mt-1">₹50</p>
                        </div>
                      </div>
                      <div className="mt-2 grid grid-cols-2 gap-4 text-sm text-gray-600">
                        <div>
                          <span className="font-medium">Quantity:</span> {pickup.quantity}
                        </div>
                        <div>
                          <span className="font-medium">Location:</span> {pickup.location}
                        </div>
                        <div>
                          <span className="font-medium">Confidence:</span> {pickup.confidence}%
                        </div>
                        <div>
                          <span className="font-medium">Date:</span> {new Date(pickup.date).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
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