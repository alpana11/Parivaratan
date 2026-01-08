import React, { useState } from 'react';
import { WasteRequest } from '../types';
import { useWasteRequests } from '../hooks/useData';
import { dbService } from '../services/dbService';
import { useAuth } from '../hooks/useAuth';

const AssignedWasteRequestsPage: React.FC = () => {
  const { requests, loading: _loading, refreshRequests } = useWasteRequests();
  const { user } = useAuth();
  const [selectedRequest, setSelectedRequest] = useState<WasteRequest | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [requestToUpdate, setRequestToUpdate] = useState<string | null>(null);
  const [_updating, setUpdating] = useState(false);

  // Debug logging
  console.log('Partner Waste Requests Debug:', {
    currentUserId: user?.uid,
    requestsCount: requests.length,
    requests: requests,
    loading: _loading
  });

  const handleViewDetails = (request: WasteRequest) => {
    setSelectedRequest(request);
    setShowDetailsModal(true);
  };

  const handleViewPhoto = (request: WasteRequest) => {
    setSelectedRequest(request);
    setShowPhotoModal(true);
  };

  const handleUpdateStatus = (requestId: string) => {
    setRequestToUpdate(requestId);
    setShowStatusModal(true);
  };

  const handleStatusChange = async (newStatus: WasteRequest['status']) => {
    if (!requestToUpdate) return;

    setUpdating(true);
    try {
      await dbService.updateWasteRequest(requestToUpdate, { status: newStatus });
      // No need to manually refresh - real-time listener will handle it
      setShowStatusModal(false);
      setRequestToUpdate(null);
    } catch (error) {
      console.error('Error updating request status:', error);
      alert('Failed to update request status');
    } finally {
      setUpdating(false);
    }
  };

  const handleAction = async (id: string, action: 'accept' | 'reject' | 'reschedule' | 'update') => {
    setUpdating(true);
    try {
      let newStatus: WasteRequest['status'];
      switch (action) {
        case 'accept':
          newStatus = 'Accepted';
          break;
        case 'reject':
          newStatus = 'Completed'; // Mock rejection
          break;
        case 'reschedule':
          // In real app, would open reschedule modal
          alert('Reschedule functionality would open a modal here');
          setUpdating(false);
          return;
        default:
          setUpdating(false);
          return;
      }

      await dbService.updateWasteRequest(id, { status: newStatus });
      // No need to manually refresh - real-time listener will handle it
    } catch (error) {
      console.error('Error updating request:', error);
      alert('Failed to update request');
    } finally {
      setUpdating(false);
    }
  };

  const assignedRequests = requests.filter(req => req.status !== 'Completed');

  return (
    <div className="space-y-8">
      <div className="bg-gradient-to-r from-emerald-600 via-blue-600 to-indigo-600 rounded-2xl p-8 text-white shadow-2xl">
        <h1 className="text-3xl font-bold mb-2">Assigned Waste Requests (Real-time)</h1>
        <p className="text-emerald-100 text-lg flex items-center">
          <span className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></span>
          Manage your waste collection assignments
        </p>
      </div>

      <div className="bg-white shadow-2xl rounded-2xl border border-gray-100 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-blue-50">
          <h2 className="text-xl font-bold text-gray-900">Active Requests</h2>
        </div>
        <div className="p-6">
          {assignedRequests.length === 0 ? (
            <div className="text-center py-16">
              <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-gradient-to-r from-gray-100 to-gray-200 mb-6">
                <svg className="h-10 w-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="mt-2 text-xl font-semibold text-gray-900">No active requests</h3>
              <p className="mt-1 text-gray-600">No waste requests have been assigned to you yet.</p>
              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Debug Info:</strong><br/>
                  Total requests loaded: {requests.length}<br/>
                  Requests after filtering: {assignedRequests.length}<br/>
                  {requests.length > 0 && (
                    <span>Available requests: {requests.map(r => `${r.id} (partnerId: ${r.partnerId || 'none'})`).join(', ')}</span>
                  )}
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {assignedRequests.map((request) => (
                <div key={request.id} className="border border-gray-200 rounded-2xl p-6 hover:shadow-lg transition-all duration-300 bg-gradient-to-r from-white to-gray-50">
                  <div className="flex items-start space-x-6">
                    <img
                      src={request.image}
                      alt="Waste"
                      className="w-24 h-24 rounded-2xl object-cover shadow-lg flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-2xl font-bold text-gray-900">{request.type}</h3>
                        <span className={`inline-flex px-4 py-2 text-sm font-bold rounded-full shadow-md ${
                          request.status === 'Assigned' ? 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800' :
                          request.status === 'Accepted' ? 'bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800' :
                          'bg-gradient-to-r from-yellow-100 to-yellow-200 text-yellow-800'
                        }`}>
                          {request.status}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-6 text-sm text-gray-600 mb-6">
                        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                          <span className="font-bold text-gray-900">Quantity:</span> <span className="text-lg">{request.quantity}</span>
                        </div>
                        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                          <span className="font-bold text-gray-900">Location:</span> <span className="text-lg">{request.location}</span>
                        </div>
                        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                          <span className="font-bold text-gray-900">Confidence:</span> <span className="text-lg text-emerald-600 font-semibold">{request.confidence}%</span>
                        </div>
                        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                          <span className="font-bold text-gray-900">Date:</span> <span className="text-lg">{new Date(request.date).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="flex space-x-3">
                        <button 
                          onClick={() => handleViewDetails(request)}
                          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors duration-200"
                        >
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          View Details
                        </button>
                        <button 
                          onClick={() => handleViewPhoto(request)}
                          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-green-600 hover:bg-green-700 transition-colors duration-200"
                        >
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          View Photo
                        </button>
                        {request.status === 'Assigned' && (
                          <>
                            <button
                              onClick={() => handleAction(request.id, 'accept')}
                              className="inline-flex items-center px-6 py-3 border border-transparent text-sm font-bold rounded-xl text-white bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl"
                            >
                              Accept
                            </button>
                            <button
                              onClick={() => handleAction(request.id, 'reject')}
                              className="inline-flex items-center px-6 py-3 border-2 border-gray-300 text-sm font-bold rounded-xl text-gray-700 bg-white hover:border-red-500 hover:text-red-600 hover:bg-red-50 transform hover:scale-105 transition-all duration-300"
                            >
                              Reject
                            </button>
                            <button
                              onClick={() => handleAction(request.id, 'reschedule')}
                              className="inline-flex items-center px-6 py-3 border-2 border-gray-300 text-sm font-bold rounded-xl text-gray-700 bg-white hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50 transform hover:scale-105 transition-all duration-300"
                            >
                              Reschedule
                            </button>
                          </>
                        )}
                        {(request.status === 'Accepted' || request.status === 'In Progress') && (
                          <button
                            onClick={() => handleUpdateStatus(request.id)}
                            className="inline-flex items-center px-6 py-3 border border-transparent text-sm font-bold rounded-xl text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl"
                          >
                            Update Status
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Details Modal */}
      {showDetailsModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-8">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900">Waste Request Details</h3>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="space-y-6">
                <div className="flex items-center space-x-4">
                  <img
                    src={selectedRequest.image}
                    alt="Waste"
                    className="w-20 h-20 rounded-xl object-cover shadow-lg"
                  />
                  <div>
                    <h4 className="text-xl font-semibold text-gray-900">{selectedRequest.type}</h4>
                    <p className="text-gray-600">ID: {selectedRequest.id}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h5 className="font-semibold text-gray-900 mb-2">Quantity</h5>
                    <p className="text-gray-700">{selectedRequest.quantity}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h5 className="font-semibold text-gray-900 mb-2">Location</h5>
                    <p className="text-gray-700">{selectedRequest.location}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h5 className="font-semibold text-gray-900 mb-2">AI Confidence</h5>
                    <p className="text-emerald-600 font-semibold">{selectedRequest.confidence}%</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h5 className="font-semibold text-gray-900 mb-2">Status</h5>
                    <span className={`inline-flex px-3 py-1 text-sm font-bold rounded-full ${
                      selectedRequest.status === 'Assigned' ? 'bg-gray-100 text-gray-800' :
                      selectedRequest.status === 'Accepted' ? 'bg-blue-100 text-blue-800' :
                      selectedRequest.status === 'In Progress' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {selectedRequest.status}
                    </span>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h5 className="font-semibold text-gray-900 mb-2">Request Date</h5>
                  <p className="text-gray-700">{new Date(selectedRequest.date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}</p>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h5 className="font-semibold text-gray-900 mb-2">Description</h5>
                  <p className="text-gray-700">
                    {selectedRequest.type} waste collection request at {selectedRequest.location}.
                    AI classification confidence: {selectedRequest.confidence}%.
                    Quantity: {selectedRequest.quantity}.
                  </p>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    onClick={() => setShowDetailsModal(false)}
                    className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => handleViewPhoto(selectedRequest)}
                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200"
                  >
                    View Photo
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Photo Modal */}
      {showPhotoModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="relative max-w-4xl w-full max-h-[90vh]">
            <button
              onClick={() => setShowPhotoModal(false)}
              className="absolute top-4 right-4 text-white bg-black bg-opacity-50 rounded-full p-2 hover:bg-opacity-75 transition-all duration-200 z-10"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <img
              src={selectedRequest.image}
              alt={`${selectedRequest.type} waste`}
              className="w-full h-auto max-h-[80vh] object-contain rounded-lg shadow-2xl"
            />
            <div className="absolute bottom-4 left-4 bg-black bg-opacity-75 text-white p-4 rounded-lg">
              <h4 className="font-semibold text-lg">{selectedRequest.type}</h4>
              <p className="text-sm opacity-90">Location: {selectedRequest.location}</p>
              <p className="text-sm opacity-90">AI Confidence: {selectedRequest.confidence}%</p>
            </div>
          </div>
        </div>
      )}

      {/* Status Update Modal */}
      {showStatusModal && requestToUpdate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full">
            <div className="p-8">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900">Update Status</h3>
                <button
                  onClick={() => {
                    setShowStatusModal(false);
                    setRequestToUpdate(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>

              <p className="text-gray-600 mb-6">Select the new status for this waste request:</p>

              <div className="space-y-3">
                <button
                  onClick={() => handleStatusChange('Assigned')}
                  className="w-full text-left px-4 py-3 border border-gray-200 rounded-lg hover:border-gray-300 hover:bg-gray-50 transition-all duration-200 flex items-center justify-between"
                >
                  <span className="font-medium text-gray-900">Assigned</span>
                  <span className="text-sm text-gray-500">Request has been assigned to partner</span>
                </button>

                <button
                  onClick={() => handleStatusChange('Accepted')}
                  className="w-full text-left px-4 py-3 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all duration-200 flex items-center justify-between"
                >
                  <span className="font-medium text-blue-900">Accepted</span>
                  <span className="text-sm text-blue-600">Partner has accepted the request</span>
                </button>

                <button
                  onClick={() => handleStatusChange('In Progress')}
                  className="w-full text-left px-4 py-3 border border-gray-200 rounded-lg hover:border-yellow-300 hover:bg-yellow-50 transition-all duration-200 flex items-center justify-between"
                >
                  <span className="font-medium text-yellow-900">In Progress</span>
                  <span className="text-sm text-yellow-600">Collection is currently in progress</span>
                </button>

                <button
                  onClick={() => handleStatusChange('Completed')}
                  className="w-full text-left px-4 py-3 border border-gray-200 rounded-lg hover:border-green-300 hover:bg-green-50 transition-all duration-200 flex items-center justify-between"
                >
                  <span className="font-medium text-green-900">Completed</span>
                  <span className="text-sm text-green-600">Waste collection has been completed</span>
                </button>
              </div>

              <div className="flex justify-end mt-6">
                <button
                  onClick={() => {
                    setShowStatusModal(false);
                    setRequestToUpdate(null);
                  }}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssignedWasteRequestsPage;