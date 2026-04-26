import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { dbService } from '../services/dbService';
import { useWasteRequests } from '../hooks/useData';
import { useToast } from '../components/Toast';
import { ScheduledPickup, NearbyArea } from '../types';

const LocationRoutesPage: React.FC = () => {
  const { partner } = useAuth();
  const { streamActive, updateCount } = useWasteRequests();
  const { showToast } = useToast();
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationAddress, setLocationAddress] = useState<string>('');
  const [nearbyAreas, setNearbyAreas] = useState<NearbyArea[]>([]);
  const [locationError, setLocationError] = useState<string>('');
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduledPickups, setScheduledPickups] = useState<ScheduledPickup[]>([]);
  const [scheduleData, setScheduleData] = useState({
    area: '',
    date: '',
    time: '',
    notes: ''
  });

  const getAddressFromCoordinates = async (lat: number, lng: number) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
        { headers: { 'User-Agent': 'Parivartan-WasteManagement' } }
      );
      const data = await response.json();
      if (data.display_name) {
        setLocationAddress(data.display_name);
      }
      
      const city = data.address?.city || data.address?.town || data.address?.village || data.address?.state_district;
      
      if (city) {
        const areaTypes = [
          { query: `market in ${city}`, label: 'Market' },
          { query: `industrial area in ${city}`, label: 'Industrial' },
          { query: `residential area in ${city}`, label: 'Residential' },
          { query: `commercial area in ${city}`, label: 'Commercial' },
          { query: `shopping area in ${city}`, label: 'Shopping' }
        ];
        
        const areaPromises = areaTypes.map(async ({ query, label }) => {
          try {
            const res = await fetch(
              `https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=1`,
              { headers: { 'User-Agent': 'Parivartan-WasteManagement' } }
            );
            const results = await res.json();
            if (results.length > 0) {
              const placeName = results[0].display_name.split(',')[0];
              return {
                id: `area-${label.toLowerCase()}`,
                name: `${placeName} (${label})`,
                fullName: results[0].display_name,
                lat: parseFloat(results[0].lat),
                lng: parseFloat(results[0].lon),
                distance: calculateDistance(lat, lng, parseFloat(results[0].lat), parseFloat(results[0].lon))
              };
            }
          } catch (err) {
            console.error(`Error fetching ${label} area:`, err);
          }
          return null;
        });
        
        const results = await Promise.all(areaPromises);
        const areas = results.filter(area => area !== null);
        setNearbyAreas(areas);
      }
    } catch (error) {
      console.error('Error getting address:', error);
      setLocationAddress('Address not available');
    }
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return (R * c).toFixed(1);
  };

  const getCurrentLocation = () => {
    setLoadingLocation(true);
    setLocationError('');

    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser');
      setLoadingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setUserLocation({ lat, lng });
        setLoadingLocation(false);
        console.log('✅ Location obtained:', lat, lng);
        getAddressFromCoordinates(lat, lng);
      },
      (error) => {
        let errorMessage = 'Unable to get location';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location permission denied. Please enable location access.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information unavailable.';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out.';
            break;
        }
        setLocationError(errorMessage);
        setLoadingLocation(false);
        console.error('❌ Location error:', errorMessage);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  useEffect(() => {
    getCurrentLocation();
  }, []);

  useEffect(() => {
    if (!partner?.id) return;

    // Subscribe to partner's scheduled pickups
    const unsubscribe = dbService.subscribeToScheduledPickups(partner.id, (pickups) => {
      setScheduledPickups(pickups);
    });

    return unsubscribe;
  }, [partner]);

  const handleCompletePickup = async (pickupId: string) => {
    try {
      await dbService.deleteScheduledPickup(pickupId);
      console.log('✅ Scheduled pickup completed and deleted:', pickupId);
    } catch (error) {
      console.error('❌ Error completing pickup:', error);
      showToast('Failed to complete pickup', 'error');
    }
  };

  const handleScheduleClick = (areaName: string) => {
    setScheduleData({ ...scheduleData, area: areaName });
    setShowScheduleModal(true);
  };

  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!partner?.id) {
      console.error('❌ No partner ID found');
      return;
    }

    try {
      const newPickup = {
        partnerId: partner.id,
        area: scheduleData.area,
        date: scheduleData.date,
        time: scheduleData.time,
        notes: scheduleData.notes,
        status: 'Scheduled',
        createdAt: new Date().toISOString()
      };

      console.log('📅 Saving scheduled pickup:', newPickup);
      const pickupId = await dbService.createScheduledPickup(newPickup);
      console.log('✅ Scheduled pickup saved with ID:', pickupId);
      
      showToast(`Waste collection scheduled for ${scheduleData.area} on ${scheduleData.date} at ${scheduleData.time}`, 'success');
      setShowScheduleModal(false);
      setScheduleData({ area: '', date: '', time: '', notes: '' });
    } catch (error) {
      console.error('❌ Error scheduling pickup:', error);
      showToast('Failed to schedule pickup', 'error');
    }
  };

  // Areas for scheduling
  const areas = [
    { id: 'all', name: 'All Areas', color: 'bg-gray-100 text-gray-800' },
    ...nearbyAreas.map((area, index) => ({
      id: area.id,
      name: area.name,
      color: ['bg-blue-100 text-blue-800', 'bg-green-100 text-green-800', 'bg-yellow-100 text-yellow-800', 'bg-purple-100 text-purple-800', 'bg-pink-100 text-pink-800'][index]
    }))
  ];

  // Mock nearby requests (within 5km radius)

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 via-blue-600 to-indigo-600 rounded-2xl p-8 text-white shadow-2xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-5xl font-bold mb-2">Location & Routes</h1>
            <p className="text-emerald-100 text-lg">Manage area-wise scheduling and nearby waste requests</p>
          </div>
          {streamActive && (
            <div className="flex items-center space-x-2 bg-white/20 px-4 py-2 rounded-lg">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
              <span className="text-sm">Pathway Live • {updateCount}</span>
            </div>
          )}
        </div>
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
                <div className="flex-1">
                  <p className="text-sm text-gray-600">Your Location</p>
                  {loadingLocation ? (
                    <p className="font-semibold text-gray-900">Getting location...</p>
                  ) : locationError ? (
                    <p className="font-semibold text-red-600">{locationError}</p>
                  ) : userLocation ? (
                    <>
                      <p className="font-semibold text-gray-900">{locationAddress || 'Loading address...'}</p>
                      <p className="text-xs text-gray-500">Lat: {userLocation.lat.toFixed(4)}, Lng: {userLocation.lng.toFixed(4)}</p>
                    </>
                  ) : (
                    <p className="font-semibold text-gray-900">Location not available</p>
                  )}
                </div>
                <button 
                  onClick={getCurrentLocation}
                  disabled={loadingLocation}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loadingLocation ? (
                    <>
                      <svg className="animate-spin h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Getting...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Update Location
                    </>
                  )}
                </button>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Nearby Waste Requests (within 5km)</h3>
              <div className="text-center py-8 text-gray-500">
                <p>No nearby waste requests at the moment.</p>
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
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-3">Nearby Areas</label>
              {nearbyAreas.length === 0 ? (
                <p className="text-sm text-gray-500">Getting nearby areas...</p>
              ) : (
                <div className="space-y-3">
                  {areas.slice(1).map((area) => (
                    <div key={area.id} className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-100">
                      <div>
                        <h4 className="font-semibold text-gray-900">{area.name}</h4>
                        <p className="text-xs text-gray-500">Click to schedule pickup</p>
                      </div>
                      <button
                        onClick={() => handleScheduleClick(area.name)}
                        className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors duration-200 text-sm"
                      >
                        Schedule Pickup
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Scheduled Pickups */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Scheduled Pickups</h3>
              {scheduledPickups.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No scheduled pickups yet. Schedule a pickup from the areas above.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {scheduledPickups.map((pickup) => (
                    <div key={pickup.id} className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-100">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">{pickup.area}</h4>
                          <p className="text-sm text-gray-600">{new Date(pickup.date).toLocaleDateString()} at {pickup.time}</p>
                          {pickup.notes && <p className="text-xs text-gray-500 mt-1">Notes: {pickup.notes}</p>}
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="inline-flex px-3 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                            {pickup.status}
                          </span>
                          <button
                            onClick={() => handleCompletePickup(pickup.id)}
                            className="bg-green-600 text-white px-3 py-1 rounded-lg hover:bg-green-700 text-xs"
                          >
                            Complete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Schedule Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Schedule Waste Collection</h3>
            <form onSubmit={handleScheduleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Area</label>
                <input
                  type="text"
                  value={scheduleData.area}
                  readOnly
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Date</label>
                <input
                  type="date"
                  value={scheduleData.date}
                  onChange={(e) => setScheduleData({ ...scheduleData, date: e.target.value })}
                  min={new Date().toISOString().split('T')[0]}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Time</label>
                <input
                  type="time"
                  value={scheduleData.time}
                  onChange={(e) => setScheduleData({ ...scheduleData, time: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Notes (Optional)</label>
                <textarea
                  value={scheduleData.notes}
                  onChange={(e) => setScheduleData({ ...scheduleData, notes: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  placeholder="Any special instructions..."
                />
              </div>
              <div className="flex space-x-3">
                <button
                  type="submit"
                  className="flex-1 bg-purple-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-purple-700"
                >
                  Confirm Schedule
                </button>
                <button
                  type="button"
                  onClick={() => setShowScheduleModal(false)}
                  className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg font-medium hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LocationRoutesPage;