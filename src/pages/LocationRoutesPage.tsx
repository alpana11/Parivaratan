import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useAuth } from '../hooks/useAuth';
import { dbService } from '../services/dbService';
import { ScheduledPickup } from '../types';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const partnerIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34],
});

const pickupIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34],
});

const RecenterMap = ({ lat, lng }: { lat: number; lng: number }) => {
  const map = useMap();
  useEffect(() => { map.setView([lat, lng], 13); }, [lat, lng, map]);
  return null;
};

const PickupMarker: React.FC<{ pickup: ScheduledPickup; index: number }> = ({ pickup, index }) => {
  const [coords, setCoords] = useState<[number, number] | null>(null);

  useEffect(() => {
    const address = typeof pickup.location === 'string' ? pickup.location : pickup.area || '';
    if (!address) return;
    fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`,
      { headers: { 'User-Agent': 'Parivartan-WasteManagement' } }
    ).then(r => r.json()).then(data => {
      if (data.length > 0) setCoords([parseFloat(data[0].lat), parseFloat(data[0].lon)]);
    }).catch(() => {});
  }, [pickup]);

  if (!coords) return null;
  return (
    <Marker position={coords} icon={pickupIcon}>
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

const LocationRoutesPage: React.FC = () => {
  const { partner } = useAuth();
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationAddress, setLocationAddress] = useState('');
  const [locationError, setLocationError] = useState('');
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [scheduledPickups, setScheduledPickups] = useState<ScheduledPickup[]>([]);
  const [routeCoords, setRouteCoords] = useState<[number, number][]>([]);
  const [loadingRoute, setLoadingRoute] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleData, setScheduleData] = useState({ area: '', date: '', time: '', notes: '' });

  const getAddressFromCoordinates = async (lat: number, lng: number) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
        { headers: { 'User-Agent': 'Parivartan-WasteManagement' } }
      );
      const data = await res.json();
      if (data.display_name) setLocationAddress(data.display_name);
    } catch { setLocationAddress('Address not available'); }
  };

  const getCurrentLocation = () => {
    setLoadingLocation(true);
    setLocationError('');
    if (!navigator.geolocation) { setLocationError('Geolocation not supported'); setLoadingLocation(false); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        setUserLocation({ lat, lng });
        setLoadingLocation(false);
        getAddressFromCoordinates(lat, lng);
      },
      (err) => {
        setLocationError(err.code === 1 ? 'Location permission denied.' : err.code === 2 ? 'Location unavailable.' : 'Request timed out.');
        setLoadingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const fetchRoute = async (pickups: ScheduledPickup[]) => {
    if (!userLocation || pickups.length === 0) return;
    setLoadingRoute(true);
    try {
      const coords: [number, number][] = [[userLocation.lat, userLocation.lng]];
      for (const pickup of pickups) {
        const address = typeof pickup.location === 'string' ? pickup.location : pickup.area || '';
        if (!address) continue;
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`,
          { headers: { 'User-Agent': 'Parivartan-WasteManagement' } }
        );
        const data = await res.json();
        if (data.length > 0) coords.push([parseFloat(data[0].lat), parseFloat(data[0].lon)]);
      }
      if (coords.length < 2) { setRouteCoords(coords); return; }
      const waypoints = coords.map(c => `${c[1]},${c[0]}`).join(';');
      const routeRes = await fetch(`https://router.project-osrm.org/route/v1/driving/${waypoints}?overview=full&geometries=geojson`);
      const routeData = await routeRes.json();
      if (routeData.routes?.[0]) {
        setRouteCoords(routeData.routes[0].geometry.coordinates.map((c: [number, number]) => [c[1], c[0]]));
      } else {
        setRouteCoords(coords);
      }
    } catch { setRouteCoords([]); }
    finally { setLoadingRoute(false); }
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

  useEffect(() => { getCurrentLocation(); }, []);

  useEffect(() => {
    if (!partner?.id) return;
    const unsubscribe = dbService.subscribeToScheduledPickups(partner.id, (pickups) => {
      setScheduledPickups(pickups);
    });
    return unsubscribe;
  }, [partner]);

  useEffect(() => {
    if (userLocation && scheduledPickups.length > 0) fetchRoute(scheduledPickups);
  }, [userLocation, scheduledPickups]);

  const defaultCenter: [number, number] = userLocation ? [userLocation.lat, userLocation.lng] : [20.5937, 78.9629];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 via-blue-600 to-indigo-600 rounded-2xl p-8 text-white shadow-2xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Location & Routes</h1>
            <p className="text-emerald-100 text-lg">View pickup locations and optimized routes on map</p>
          </div>
          <button
            onClick={() => setShowScheduleModal(true)}
            className="flex items-center px-5 py-3 bg-white text-emerald-700 font-bold rounded-xl hover:bg-emerald-50 transition-all shadow-lg"
          >
            + Create Schedule Now
          </button>
        </div>
      </div>

      {/* Map */}
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-blue-50 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <h2 className="text-xl font-bold text-gray-900">
              🗺️ Pickup Locations Map
              {scheduledPickups.length > 0 && (
                <span className="ml-2 text-sm font-normal text-gray-500">({scheduledPickups.length} pickups)</span>
              )}
            </h2>
          </div>
          <div className="flex items-center space-x-4">
            {loadingLocation ? (
              <span className="text-sm text-gray-500">Getting location...</span>
            ) : locationError ? (
              <span className="text-sm text-red-500">{locationError}</span>
            ) : (
              <span className="text-sm text-gray-600 max-w-xs truncate">{locationAddress}</span>
            )}
            <button
              onClick={getCurrentLocation}
              disabled={loadingLocation}
              className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium disabled:opacity-50"
            >
              {loadingLocation ? 'Getting...' : '↻ Update Location'}
            </button>
            {loadingRoute && (
              <span className="text-sm text-blue-600 flex items-center">
                <svg className="animate-spin w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                </svg>
                Calculating route...
              </span>
            )}
            {routeCoords.length > 1 && !loadingRoute && (
              <span className="text-sm text-green-600 font-medium">✓ Route optimized</span>
            )}
          </div>
        </div>

        <div style={{ height: '550px' }}>
          <MapContainer center={defaultCenter} zoom={13} style={{ height: '100%', width: '100%' }}>
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
            {scheduledPickups.map((pickup, index) => (
              <PickupMarker key={pickup.id} pickup={pickup} index={index} />
            ))}
            {routeCoords.length > 1 && (
              <Polyline positions={routeCoords} color="#3b82f6" weight={4} opacity={0.8} dashArray="10, 5" />
            )}
          </MapContainer>
        </div>

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
            <div className="w-6 h-0.5 border-t-2 border-dashed border-blue-500"></div>
            <span>Optimized Route</span>
          </div>
        </div>
      </div>

      {/* Schedule Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center" style={{ zIndex: 9999 }}>
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Create Schedule</h3>
            <form onSubmit={handleScheduleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Area / Address</label>
                <input
                  type="text"
                  value={scheduleData.area}
                  onChange={(e) => setScheduleData({ ...scheduleData, area: e.target.value })}
                  required
                  placeholder="Enter area or address"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Time</label>
                <input
                  type="time"
                  value={scheduleData.time}
                  onChange={(e) => setScheduleData({ ...scheduleData, time: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Notes (Optional)</label>
                <textarea
                  value={scheduleData.notes}
                  onChange={(e) => setScheduleData({ ...scheduleData, notes: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  placeholder="Any special instructions..."
                />
              </div>
              <div className="flex space-x-3">
                <button type="submit" className="flex-1 bg-emerald-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-emerald-700">
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

export default LocationRoutesPage;
