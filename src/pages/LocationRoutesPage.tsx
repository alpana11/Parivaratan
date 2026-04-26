import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useAuth } from '../hooks/useAuth';
import { dbService } from '../services/dbService';
import { useWasteRequests } from '../hooks/useData';
import { ScheduledPickup } from '../types';

// Fix leaflet default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const partnerIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

const pickupIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

// Component to recenter map when location changes
const RecenterMap = ({ lat, lng }: { lat: number; lng: number }) => {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], 13);
  }, [lat, lng, map]);
  return null;
};

const LocationRoutesPage: React.FC = () => {
  const { partner } = useAuth();
  const { streamActive, updateCount } = useWasteRequests();
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationAddress, setLocationAddress] = useState('');
  const [locationError, setLocationError] = useState('');
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [scheduledPickups, setScheduledPickups] = useState<ScheduledPickup[]>([]);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleData, setScheduleData] = useState({ area: '', date: '', time: '', notes: '' });
  const [routeCoords, setRouteCoords] = useState<[number, number][]>([]);
  const [loadingRoute, setLoadingRoute] = useState(false);
  const [selectedPickup, setSelectedPickup] = useState<ScheduledPickup | null>(null);

  const getAddressFromCoordinates = async (lat: number, lng: number) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
        { headers: { 'User-Agent': 'Parivartan-WasteManagement' } }
      );
      const data = await res.json();
      if (data.display_name) setLocationAddress(data.display_name);
    } catch {
      setLocationAddress('Address not available');
    }
  };

  const getCurrentLocation = () => {
    setLoadingLocation(true);
    setLocationError('');
    if (!navigator.geolocation) {
      setLocationError('Geolocation not supported');
      setLoadingLocation(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        setUserLocation({ lat, lng });
        setLoadingLocation(false);
        getAddressFromCoordinates(lat, lng);
      },
      (err) => {
        setLocationError(
          err.code === 1 ? 'Location permission denied.' :
          err.code === 2 ? 'Location unavailable.' : 'Location request timed out.'
        );
        setLoadingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // Fetch route from OSRM (free routing service)
  const fetchRoute = async (pickups: ScheduledPickup[]) => {
    if (!userLocation || pickups.length === 0) return;

    const geocodeAddress = async (address: string): Promise<[number, number] | null> => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`,
          { headers: { 'User-Agent': 'Parivartan-WasteManagement' } }
        );
        const data = await res.json();
        if (data.length > 0) return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
      } catch {}
      return null;
    };

    setLoadingRoute(true);
    try {
      const coords: [number, number][] = [[userLocation.lat, userLocation.lng]];

      for (const pickup of pickups) {
        const address = typeof pickup.location === 'string'
          ? pickup.location
          : pickup.area || '';
        if (address) {
          const coord = await geocodeAddress(address);
          if (coord) coords.push(coord);
        }
      }

      if (coords.length < 2) {
        setRouteCoords(coords);
        setLoadingRoute(false);
        return;
      }

      // Use OSRM for routing
      const waypoints = coords.map(c => `${c[1]},${c[0]}`).join(';');
      const res = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${waypoints}?overview=full&geometries=geojson`
      );
      const data = await res.json();

      if (data.routes && data.routes[0]) {
        const routePoints: [number, number][] = data.routes[0].geometry.coordinates.map(
          (c: [number, number]) => [c[1], c[0]]
        );
        setRouteCoords(routePoints);
      } else {
        setRouteCoords(coords);
      }
    } catch {
      setRouteCoords([]);
    } finally {
      setLoadingRoute(false);
    }
  };

  useEffect(() => { getCurrentLocation(); }, []);

  useEffect(() => {
    if (!partner?.id) return;
    const unsubscribe = dbService.subscribeToScheduledPickups(partner.id, (pickups) => {
      setScheduledPickups(pickups);
    });
    return unsubscribe;
  }, [partner]);

  useEffect(() => {
    if (userLocation && scheduledPickups.length > 0) {
      fetchRoute(scheduledPickups);
    }
  }, [userLocation, scheduledPickups]);

  const handleCompletePickup = async (pickupId: string) => {
    try {
      await dbService.deleteScheduledPickup(pickupId);
    } catch {}
  };

  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!partner?.id) return;
    try {
      await dbService.createScheduledPickup({
        partnerId: partner.id,
        area: scheduleData.area,
        date: scheduleData.date,
        time: scheduleData.time,
        notes: scheduleData.notes,
        status: 'Scheduled',
        createdAt: new Date().toISOString()
      });
      setShowScheduleModal(false);
      setScheduleData({ area: '', date: '', time: '', notes: '' });
    } catch {}
  };

  const defaultCenter: [number, number] = userLocation
    ? [userLocation.lat, userLocation.lng]
    : [20.5937, 78.9629]; // India center as fallback

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 via-blue-600 to-indigo-600 rounded-2xl p-8 text-white shadow-2xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Location & Routes</h1>
            <p className="text-emerald-100 text-lg">View pickup locations and optimized routes on map</p>
          </div>
          {streamActive && (
            <div className="flex items-center space-x-2 bg-white/20 px-4 py-2 rounded-lg">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
              <span className="text-sm">Live • {updateCount}</span>
            </div>
          )}
        </div>
      </div>

      {/* Location Bar */}
      <div className="bg-white rounded-2xl shadow p-4 flex items-center justify-between border border-gray-100">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <div>
            <p className="text-xs text-gray-500">Your Location</p>
            {loadingLocation ? (
              <p className="text-sm font-medium text-gray-700">Getting location...</p>
            ) : locationError ? (
              <p className="text-sm font-medium text-red-600">{locationError}</p>
            ) : (
              <p className="text-sm font-medium text-gray-900 max-w-lg truncate">{locationAddress || 'Location not set'}</p>
            )}
          </div>
        </div>
        <button
          onClick={getCurrentLocation}
          disabled={loadingLocation}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium disabled:opacity-50"
        >
          {loadingLocation ? 'Getting...' : '↻ Update'}
        </button>
      </div>

      {/* Map */}
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-blue-50 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">
            🗺️ Pickup Locations Map
            {scheduledPickups.length > 0 && (
              <span className="ml-2 text-sm font-normal text-gray-500">({scheduledPickups.length} pickups)</span>
            )}
          </h2>
          {loadingRoute && (
            <span className="text-sm text-blue-600 flex items-center">
              <svg className="animate-spin w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
              </svg>
              Calculating route...
            </span>
          )}
          {routeCoords.length > 0 && !loadingRoute && (
            <span className="text-sm text-green-600 font-medium">✓ Route optimized</span>
          )}
        </div>

        <div style={{ height: '500px' }}>
          <MapContainer
            center={defaultCenter}
            zoom={13}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {userLocation && (
              <>
                <RecenterMap lat={userLocation.lat} lng={userLocation.lng} />
                <Marker position={[userLocation.lat, userLocation.lng]} icon={partnerIcon}>
                  <Popup>
                    <div className="text-sm">
                      <p className="font-bold text-green-700">📍 Your Location</p>
                      <p className="text-gray-600 text-xs mt-1">{locationAddress}</p>
                    </div>
                  </Popup>
                </Marker>
              </>
            )}

            {/* Scheduled pickup markers */}
            {scheduledPickups.map((pickup, index) => {
              const address = typeof pickup.location === 'string'
                ? pickup.location
                : pickup.area || '';
              return (
                <PickupMarker
                  key={pickup.id}
                  pickup={pickup}
                  index={index}
                  icon={pickupIcon}
                  onSelect={setSelectedPickup}
                />
              );
            })}

            {/* Route line */}
            {routeCoords.length > 1 && (
              <Polyline
                positions={routeCoords}
                color="#3b82f6"
                weight={4}
                opacity={0.8}
                dashArray="10, 5"
              />
            )}
          </MapContainer>
        </div>

        {/* Map Legend */}
        <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 flex items-center space-x-6 text-sm text-gray-600">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span>Your Location</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span>Pickup Location</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-6 h-0.5 bg-blue-500 border-dashed border-t-2 border-blue-500"></div>
            <span>Optimized Route</span>
          </div>
        </div>
      </div>

      {/* Scheduled Pickups List */}
      <div className="bg-white shadow-2xl rounded-2xl border border-gray-100 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-pink-50 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">📋 Scheduled Pickups</h2>
          <button
            onClick={() => setShowScheduleModal(true)}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm font-medium"
          >
            + Schedule New
          </button>
        </div>
        <div className="p-6">
          {scheduledPickups.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <div className="text-4xl mb-3">📍</div>
              <p>No scheduled pickups yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {scheduledPickups.map((pickup, index) => (
                <div key={pickup.id} className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-all bg-gradient-to-r from-white to-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center text-red-600 font-bold text-sm">
                        {index + 1}
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">{pickup.userName || pickup.area}</h4>
                        <p className="text-sm text-gray-600">
                          {typeof pickup.location === 'string' ? pickup.location : pickup.area}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(pickup.date).toLocaleDateString()} at {pickup.time}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="inline-flex px-3 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                        {pickup.status}
                      </span>
                      <button
                        onClick={() => handleCompletePickup(pickup.id)}
                        className="px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 text-xs font-medium"
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

      {/* Schedule Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Schedule Waste Collection</h3>
            <form onSubmit={handleScheduleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Area / Address</label>
                <input
                  type="text"
                  value={scheduleData.area}
                  onChange={(e) => setScheduleData({ ...scheduleData, area: e.target.value })}
                  required
                  placeholder="Enter area or address"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
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
                <button type="submit" className="flex-1 bg-purple-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-purple-700">
                  Confirm Schedule
                </button>
                <button type="button" onClick={() => setShowScheduleModal(false)} className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg font-medium hover:bg-gray-300">
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

// Separate component for pickup markers that geocodes the address
const PickupMarker: React.FC<{
  pickup: ScheduledPickup;
  index: number;
  icon: L.Icon;
  onSelect: (p: ScheduledPickup) => void;
}> = ({ pickup, index, icon, onSelect }) => {
  const [coords, setCoords] = useState<[number, number] | null>(null);

  useEffect(() => {
    const address = typeof pickup.location === 'string'
      ? pickup.location
      : pickup.area || '';
    if (!address) return;

    fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`,
      { headers: { 'User-Agent': 'Parivartan-WasteManagement' } }
    )
      .then(r => r.json())
      .then(data => {
        if (data.length > 0) {
          setCoords([parseFloat(data[0].lat), parseFloat(data[0].lon)]);
        }
      })
      .catch(() => {});
  }, [pickup]);

  if (!coords) return null;

  return (
    <Marker position={coords} icon={icon}>
      <Popup>
        <div className="text-sm min-w-[160px]">
          <p className="font-bold text-red-700">📦 Stop {index + 1}</p>
          <p className="font-medium text-gray-900 mt-1">{pickup.userName || 'Pickup'}</p>
          <p className="text-gray-600 text-xs">{typeof pickup.location === 'string' ? pickup.location : pickup.area}</p>
          <p className="text-gray-500 text-xs mt-1">{new Date(pickup.date).toLocaleDateString()} at {pickup.time}</p>
          {pickup.type && <p className="text-xs text-blue-600 mt-1">Type: {pickup.type}</p>}
        </div>
      </Popup>
    </Marker>
  );
};

export default LocationRoutesPage;
