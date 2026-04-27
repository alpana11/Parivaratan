import React, { useState, useEffect } from 'react';
import { dbService } from '../services/dbService';
import { WasteRequest, Partner, ScheduledPickup } from '../types';
import { useAdminWasteRequests } from '../hooks/useData';

const AdminWasteRequestsPage: React.FC = () => {
  const { requests, loading } = useAdminWasteRequests();
  const [partners, setPartners] = useState<Partner[]>([]);
  const [partnersLoading, setPartnersLoading] = useState(true);
  const [scheduledPickups, setScheduledPickups] = useState<ScheduledPickup[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'status' | 'location'>('date');

  useEffect(() => {
    loadPartners();
    
    const unsubscribeScheduledPickups = dbService.subscribeToAllScheduledPickups((pickups) => {
      setScheduledPickups(pickups);
    });

    return () => {
      unsubscribeScheduledPickups();
    };
  }, []);

  const loadPartners = async () => {
    try {
      const allPartners = await dbService.getAllPartners();
      setPartners(allPartners);
    } catch (error) {
      console.error('Error loading partners:', error);
    } finally {
      setPartnersLoading(false);
    }
  };



  const getStatusColor = (status: WasteRequest['status']) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'accepted': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPartnerName = (partnerId?: string) => {
    if (!partnerId) return 'Not assigned';
    const partner = partners.find(p => p.id === partnerId);
    return partner ? partner.name : 'Unknown';
  };

  // Combine waste requests and scheduled pickups for display
  const allRequests = [
    ...requests,
    ...scheduledPickups.map(pickup => {
      // Find the original waste request for this scheduled pickup
      const originalRequest = requests.find(r => r.id === pickup.requestId);
      return {
        ...pickup,
        status: 'Scheduled',
        type: pickup.wasteType || originalRequest?.type || 'Scheduled Pickup',
        quantity: pickup.quantity || originalRequest?.quantity || 'N/A',
        location: pickup.location || originalRequest?.location || 'N/A',
        date: pickup.date || pickup.createdAt,
        image: originalRequest?.image || (originalRequest as any)?.wasteImage || pickup.image || pickup.wasteImage || pickup.imageUrl,
        phoneNumber: originalRequest?.phoneNumber || (originalRequest as any)?.userPhone || pickup.phoneNumber || pickup.userPhone,
        partnerId: pickup.partnerId || originalRequest?.partnerId,
      };
    })
  ];

  // Filter and sort requests
  const filteredRequests = allRequests
    .filter(request => {
      let matchesStatus = false;
      if (filterStatus === 'all') {
        matchesStatus = true;
      } else if (filterStatus === 'In Progress') {
        matchesStatus = request.status === 'In Progress' || request.status === 'Scheduled';
      } else {
        matchesStatus = request.status === filterStatus;
      }
      
      const locationStr = typeof request.location === 'string' ? request.location : request.location?.city || '';
      const matchesSearch = searchTerm === '' ||
        request.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        locationStr.toLowerCase().includes(searchTerm.toLowerCase()) ||
        getPartnerName(request.partnerId).toLowerCase().includes(searchTerm.toLowerCase());
      return matchesStatus && matchesSearch;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        case 'status':
          return (a.status || '').localeCompare(b.status || '');
        case 'location':
          const locA = typeof a.location === 'string' ? a.location : a.location?.city || '';
          const locB = typeof b.location === 'string' ? b.location : b.location?.city || '';
          return locA.localeCompare(locB);
        default:
          return 0;
      }
    });

  if (loading || partnersLoading) {
    return (
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-24 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Waste Requests Management (Real-time)</h2>
          <div className="flex items-center space-x-2 bg-green-50 px-3 py-1 rounded-full border border-green-200">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-green-700 font-medium">Real-time Updates</span>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex-1 min-w-64">
              <input
                type="text"
                placeholder="Search by waste type, location, or partner..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">Status:</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="accepted">Accepted</option>
                <option value="In Progress">In Progress</option>
                <option value="rejected">Rejected</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">Sort by:</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'date' | 'status' | 'location')}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="date">Date</option>
                <option value="status">Status</option>
                <option value="location">Location</option>
              </select>
            </div>
          </div>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow text-center">
            <div className="text-2xl font-bold text-gray-900">{requests.length}</div>
            <div className="text-sm text-gray-600">Total Requests</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow text-center">
            <div className="text-2xl font-bold text-blue-600">
              {requests.filter(r => r.status === 'accepted').length}
            </div>
            <div className="text-sm text-gray-600">Accepted</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow text-center">
            <div className="text-2xl font-bold text-orange-600">
              {requests.filter(r => r.status === 'accepted').length + scheduledPickups.length}
            </div>
            <div className="text-sm text-gray-600">In Progress</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow text-center">
            <div className="text-2xl font-bold text-red-600">
              {requests.filter(r => r.status === 'rejected').length}
            </div>
            <div className="text-sm text-gray-600">Rejected</div>
          </div>
        </div>

        {/* Requests List */}
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              Showing {filteredRequests.length} of {allRequests.length} requests
            </h3>
          </div>
          <ul className="divide-y divide-gray-200">
            {filteredRequests.map((request) => (
              <li key={request.id} className="px-6 py-6">
                <div className="flex items-start space-x-4">
                  {/* Waste Image */}
                  <div className="flex-shrink-0">
                    <img
                      className="h-20 w-20 rounded-lg object-cover border"
                      src={request.image || (request as any).imageUrl || (request as any).wasteImage}
                      alt="Waste"
                      onError={(e) => {
                        e.currentTarget.src = 'https://via.placeholder.com/80x80?text=No+Image';
                      }}
                    />
                  </div>

                  {/* Request Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-lg font-semibold text-gray-900">
                        {request.type} - {request.quantity}
                      </h4>
                      <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full border ${getStatusColor(request.status)}`}>
                        {request.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">User Name:</span> {(request as any).userName || (request as any).name || 'N/A'}
                        </p>
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Location:</span> {typeof request.location === 'string' ? request.location : [request.location?.house, request.location?.street, request.location?.city, request.location?.pincode].filter(Boolean).join(', ')}
                        </p>
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Date:</span> {new Date(request.date).toLocaleDateString()} at {new Date(request.date).toLocaleTimeString()}
                        </p>
                        <p className="text-sm">
                          <span className="font-medium text-gray-600">Phone:</span>
                          <span className="font-semibold ml-1 text-emerald-600">
                            {request.phoneNumber || (request as any).userPhone || 'N/A'}
                          </span>
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Assigned Partner:</span> {getPartnerName(request.partnerId)}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <p className="text-xs text-gray-500">Waste requests are automatically assigned by the system</p>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          {filteredRequests.length === 0 && (
            <div className="px-6 py-12 text-center">
              <p className="text-gray-500">No waste requests found matching your criteria.</p>
            </div>
          )}
        </div>


      </div>
    </div>
  );
};

export default AdminWasteRequestsPage;