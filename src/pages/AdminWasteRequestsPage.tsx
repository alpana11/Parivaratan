import React, { useState, useEffect } from 'react';
import { dbService } from '../services/dbService';
import { WasteRequest, Partner } from '../types';

const AdminWasteRequestsPage: React.FC = () => {
  const [requests, setRequests] = useState<WasteRequest[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<WasteRequest | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'status' | 'location'>('date');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [wasteRequests, allPartners] = await Promise.all([
        dbService.getAllWasteRequests(),
        dbService.getAllPartners()
      ]);
      setRequests(wasteRequests);
      setPartners(allPartners);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (requestId: string, newStatus: WasteRequest['status']) => {
    try {
      await dbService.updateWasteRequest(requestId, { status: newStatus });
      
      // Store waste request update in database
      await dbService.storeWasteRequest({
        id: requestId,
        status: newStatus,
        updatedAt: new Date().toISOString(),
        updatedBy: 'admin'
      });
      
      // Create audit log
      await dbService.createAuditLog({
        adminId: 'admin',
        actionType: 'waste_request_updated',
        entityType: 'waste_request',
        entityId: requestId,
        description: `Status updated to ${newStatus}`,
        metadata: { newStatus }
      });
      
      setRequests(requests.map(req =>
        req.id === requestId ? { ...req, status: newStatus } : req
      ));
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const handlePartnerAssignment = async (requestId: string, partnerId: string) => {
    try {
      await dbService.updateWasteRequest(requestId, { assignedPartner: partnerId });
      setRequests(requests.map(req =>
        req.id === requestId ? { ...req, assignedPartner: partnerId } : req
      ));
      setShowModal(false);
    } catch (error) {
      console.error('Error assigning partner:', error);
    }
  };

  const approveAIPartner = async (request: WasteRequest) => {
    if (request.aiRecommendedPartner) {
      await handlePartnerAssignment(request.id, request.aiRecommendedPartner);
    }
  };

  const getStatusColor = (status: WasteRequest['status']) => {
    switch (status) {
      case 'Assigned': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Accepted': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'In Progress': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'Completed': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 90) return 'text-green-600';
    if (confidence >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getPartnerName = (partnerId?: string) => {
    if (!partnerId) return 'Not assigned';
    const partner = partners.find(p => p.id === partnerId);
    return partner ? partner.name : 'Unknown';
  };

  // Filter and sort requests
  const filteredRequests = requests
    .filter(request => {
      const matchesStatus = filterStatus === 'all' || request.status === filterStatus;
      const matchesSearch = searchTerm === '' ||
        request.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        getPartnerName(request.assignedPartner).toLowerCase().includes(searchTerm.toLowerCase());
      return matchesStatus && matchesSearch;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        case 'status':
          return a.status.localeCompare(b.status);
        case 'location':
          return a.location.localeCompare(b.location);
        default:
          return 0;
      }
    });

  if (loading) {
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
          <h2 className="text-2xl font-bold text-gray-900">Waste Requests Management</h2>
          <button
            onClick={loadData}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
          >
            <span>🔄</span>
            <span>Refresh</span>
          </button>
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
                <option value="Assigned">Assigned</option>
                <option value="Accepted">Accepted</option>
                <option value="In Progress">In Progress</option>
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
            <div className="text-2xl font-bold text-yellow-600">
              {requests.filter(r => r.status === 'Assigned').length}
            </div>
            <div className="text-sm text-gray-600">Pending Assignment</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow text-center">
            <div className="text-2xl font-bold text-blue-600">
              {requests.filter(r => r.status === 'In Progress').length}
            </div>
            <div className="text-sm text-gray-600">In Progress</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow text-center">
            <div className="text-2xl font-bold text-green-600">
              {requests.filter(r => r.status === 'Completed').length}
            </div>
            <div className="text-sm text-gray-600">Completed</div>
          </div>
        </div>

        {/* Requests List */}
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              Showing {filteredRequests.length} of {requests.length} requests
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
                      src={request.image}
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
                          <span className="font-medium">Location:</span> {request.location}
                        </p>
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Date:</span> {new Date(request.date).toLocaleDateString()} at {new Date(request.date).toLocaleTimeString()}
                        </p>
                        <p className="text-sm">
                          <span className="font-medium text-gray-600">AI Confidence:</span>
                          <span className={`font-semibold ml-1 ${getConfidenceColor(request.confidence)}`}>
                            {request.confidence}%
                          </span>
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Assigned Partner:</span> {getPartnerName(request.assignedPartner)}
                        </p>
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">AI Recommended:</span> {getPartnerName(request.aiRecommendedPartner)}
                        </p>
                        {request.aiRecommendedPartner && request.assignedPartner !== request.aiRecommendedPartner && (
                          <p className="text-sm text-orange-600 font-medium">
                            ⚠️ Different from AI recommendation
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-2">
                      <select
                        value={request.status}
                        onChange={(e) => handleStatusUpdate(request.id, e.target.value as WasteRequest['status'])}
                        className="px-3 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="Assigned">Assigned</option>
                        <option value="Accepted">Accepted</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Completed">Completed</option>
                      </select>

                      <button
                        onClick={() => {
                          setSelectedRequest(request);
                          setShowModal(true);
                        }}
                        className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
                      >
                        Assign Partner
                      </button>

                      {request.aiRecommendedPartner && request.assignedPartner !== request.aiRecommendedPartner && (
                        <button
                          onClick={() => approveAIPartner(request)}
                          className="px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600"
                        >
                          ✓ Approve AI Partner
                        </button>
                      )}

                      <button
                        className="px-3 py-1 bg-gray-500 text-white text-sm rounded hover:bg-gray-600"
                        title="Schedule pickup (feature coming soon)"
                      >
                        📅 Schedule
                      </button>
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

        {/* Partner Assignment Modal */}
        {showModal && selectedRequest && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white max-h-96 overflow-y-auto">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Assign Partner for {selectedRequest.type} - {selectedRequest.quantity}
                </h3>
                <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>AI Recommended:</strong> {getPartnerName(selectedRequest.aiRecommendedPartner)}
                  </p>
                  <p className="text-sm text-blue-800">
                    <strong>Location:</strong> {selectedRequest.location}
                  </p>
                </div>
                <div className="space-y-2">
                  {partners
                    .filter(p => p.status === 'approved')
                    .sort((a, b) => {
                      // Sort AI recommended partner first
                      if (a.id === selectedRequest.aiRecommendedPartner) return -1;
                      if (b.id === selectedRequest.aiRecommendedPartner) return 1;
                      return a.name.localeCompare(b.name);
                    })
                    .map((partner) => (
                    <button
                      key={partner.id}
                      onClick={() => handlePartnerAssignment(selectedRequest.id, partner.id)}
                      className={`w-full text-left p-3 border rounded hover:bg-gray-50 ${
                        partner.id === selectedRequest.aiRecommendedPartner
                          ? 'border-green-300 bg-green-50'
                          : 'border-gray-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{partner.name}</div>
                          <div className="text-sm text-gray-500">
                            {partner.organization} - {partner.partnerType}
                          </div>
                          <div className="text-sm text-gray-500">
                            Areas: {partner.serviceAreas?.join(', ') || 'Not specified'}
                          </div>
                        </div>
                        {partner.id === selectedRequest.aiRecommendedPartner && (
                          <span className="text-green-600 font-semibold">🤖 AI Recommended</span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
                <div className="flex justify-end mt-4 space-x-2">
                  <button
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminWasteRequestsPage;