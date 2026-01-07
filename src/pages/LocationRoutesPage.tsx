import React, { useState } from 'react';

const LocationRoutesPage: React.FC = () => {
  const [selectedArea, setSelectedArea] = useState<string>('all');
  const [userLocation] = useState({
    lat: 28.6139, // Delhi coordinates as default
    lng: 77.2090,
  });

  // Mock areas for scheduling
  const areas = [
    { id: 'all', name: 'All Areas', color: 'bg-gray-100 text-gray-800' },
    { id: 'downtown', name: 'Downtown Area', color: 'bg-blue-100 text-blue-800' },
    { id: 'residential', name: 'Residential Zone', color: 'bg-green-100 text-green-800' },
    { id: 'industrial', name: 'Industrial Area', color: 'bg-yellow-100 text-yellow-800' },
    { id: 'market', name: 'Market Area', color: 'bg-purple-100 text-purple-800' },
  ];

  // Mock nearby requests (within 5km radius)
  const nearbyRequests = ([] as any[]).filter(() => {
    // Mock distance calculation - in real app, use actual geolocation
    const mockDistance = Math.random() * 10; // Random distance 0-10km
    return mockDistance <= 5;
  });

  // Mock scheduled pickups for area-wise scheduling
  const scheduledPickups = [
    {
      id: '1',
      area: 'Downtown Area',
      time: '09:00 AM',
      date: '2025-12-25',
      requests: 3,
      status: 'Scheduled'
    },
    {
      id: '2',
      area: 'Residential Zone',
      time: '02:00 PM',
      date: '2025-12-25',
      requests: 5,
      status: 'Scheduled'
    },
    {
      id: '3',
      area: 'Market Area',
      time: '11:00 AM',
      date: '2025-12-26',
      requests: 2,
      status: 'Pending'
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 via-blue-600 to-indigo-600 rounded-2xl p-8 text-white shadow-2xl">
        <h1 className="text-5xl font-bold mb-2">Location & Routes</h1>
        <p className="text-emerald-100 text-lg">Manage area-wise scheduling and nearby waste requests</p>
      </div>

      {/* Current Location & Nearby Requests */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Current Location */}
        <div className="bg-white shadow-2xl rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
            <h2 className="text-xl font-bold text-gray-900 flex items-center">
              <svg className="w-6 h-6 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Current Location
            </h2>
          </div>
          <div className="p-6">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Your Location</p>
                  <p className="font-semibold text-gray-900">Delhi, India</p>
                  <p className="text-xs text-gray-500">Lat: {userLocation.lat}, Lng: {userLocation.lng}</p>
                </div>
                <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Update Location
                </button>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Nearby Waste Requests (within 5km)</h3>
              <div className="space-y-3">
                {nearbyRequests.slice(0, 3).map((request) => (
                  <div key={request.id} className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-100">
                    <div className="flex items-center">
                      <img
                        src={request.image}
                        alt={request.type}
                        className="w-12 h-12 rounded-lg object-cover shadow-md"
                      />
                      <div className="ml-3">
                        <p className="font-semibold text-gray-900">{request.type}</p>
                        <p className="text-sm text-gray-600">{request.location}</p>
                        <p className="text-xs text-green-600 font-medium">~{Math.floor(Math.random() * 5) + 1}km away</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        request.status === 'Completed' ? 'bg-emerald-100 text-emerald-800' :
                        request.status === 'In Progress' ? 'bg-yellow-100 text-yellow-800' :
                        request.status === 'Accepted' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {request.status}
                      </span>
                      <p className="text-sm text-gray-600 mt-1">{request.quantity}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Area-wise Scheduling */}
        <div className="bg-white shadow-2xl rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-pink-50">
            <h2 className="text-xl font-bold text-gray-900 flex items-center">
              <svg className="w-6 h-6 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Area-wise Scheduling
            </h2>
          </div>
          <div className="p-6">
            {/* Area Filter */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-3">Filter by Area</label>
              <div className="flex flex-wrap gap-2">
                {areas.map((area) => (
                  <button
                    key={area.id}
                    onClick={() => setSelectedArea(area.id)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      selectedArea === area.id
                        ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg transform scale-105'
                        : area.color + ' hover:shadow-md hover:transform hover:scale-102'
                    }`}
                  >
                    {area.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Scheduled Pickups */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Scheduled Pickups</h3>
              <div className="space-y-4">
                {scheduledPickups.map((pickup) => (
                  <div key={pickup.id} className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-100">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="font-semibold text-gray-900">{pickup.area}</h4>
                        <p className="text-sm text-gray-600">{pickup.date} at {pickup.time}</p>
                      </div>
                      <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                        pickup.status === 'Scheduled' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {pickup.status}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-gray-600">{pickup.requests} waste requests</p>
                      <button className="bg-purple-600 text-white px-3 py-1 rounded-lg hover:bg-purple-700 transition-colors duration-200 text-sm">
                        View Route
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LocationRoutesPage;