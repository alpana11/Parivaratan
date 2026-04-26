import React, { useState, useEffect } from 'react';
import { WasteRequest } from '../types';
import { useWasteRequests } from '../hooks/useData';
import { dbService } from '../services/dbService';
import { notificationScheduler } from '../services/notificationScheduler';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../components/Toast';

const AssignedWasteRequestsPage: React.FC = () => {
  const { requests, loading: _loading, updateCount } = useWasteRequests();
  const { user, partner } = useAuth();
  const { showToast } = useToast();
  const [selectedRequest, setSelectedRequest] = useState<WasteRequest | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [requestToSchedule, setRequestToSchedule] = useState<string | null>(null);
  const [requestToUpdate, setRequestToUpdate] = useState<string | null>(null);
  const [_updating, setUpdating] = useState(false);
  const [localRequests, setLocalRequests] = useState<WasteRequest[]>([]);

  useEffect(() => {
    setLocalRequests(requests);
  }, [requests]);

  // Auto-check and send availability confirmations on mount and every hour
  useEffect(() => {
    if (!user || !partner) return;
    notificationScheduler.checkAndSendAvailabilityConfirmations(user.uid, partner.name);
    const interval = setInterval(() => {
      notificationScheduler.checkAndSendAvailabilityConfirmations(user.uid, partner.name);
    }, 60 * 60 * 1000); // re-check every hour
    return () => clearInterval(interval);
  }, [user, partner]);

  const handleSchedulePickup = (requestId: string) => {
    setRequestToSchedule(requestId);
    setShowScheduleModal(true);
  };

  const handleScheduleSubmit = async (scheduleData: { method: 'pickup' | 'dropoff'; date: string; time: string }) => {
    if (!requestToSchedule || !user) return;

    setUpdating(true);
    try {
      const request = requests.find(r => r.id === requestToSchedule);
      if (!request) {
        showToast('Request not found', 'error');
        return;
      }

      // Update local state immediately
      setLocalRequests(prev => prev.map(r => 
        r.id === requestToSchedule 
          ? { ...r, scheduleMethod: scheduleData.method, scheduledDate: scheduleData.date, scheduledTime: scheduleData.time, status: 'In Progress' }
          : r
      ));

      setShowScheduleModal(false);
      setRequestToSchedule(null);

      await dbService.updateWasteRequest(requestToSchedule, {
        scheduleMethod: scheduleData.method,
        scheduledDate: scheduleData.date,
        scheduledTime: scheduleData.time,
        status: 'In Progress'
      });

      await dbService.createScheduledPickup({
        partnerId: user.uid,
        requestId: requestToSchedule,
        type: request.type,
        image: (request as any).imageUrl || request.image,
        imageUrl: (request as any).imageUrl || request.image,
        userName: (request as any).userName || 'User',
        phoneNumber: request.phoneNumber || (request as any).userPhone || 'N/A',
        location: typeof request.location === 'string' ? request.location : request.location || 'Unknown',
        area: typeof request.location === 'string' ? request.location : request.location || 'Unknown',
        date: scheduleData.date,
        time: scheduleData.time,
        scheduledDate: scheduleData.date,
        scheduledTime: scheduleData.time,
        scheduleMethod: scheduleData.method,
        status: 'scheduled'
      });

      const userId = (request as any).userId || (request as any).userID || (request as any).user_id;
      if (userId) {
        await dbService.createNotification({
          type: 'waste_request',
          title: 'Pickup Scheduled',
          message: `Your waste pickup has been scheduled for ${new Date(scheduleData.date).toLocaleDateString()} at ${scheduleData.time} by ${partner?.name || 'partner'}`,
          userId: userId,
          status: 'pending',
          category: 'pickup_assignment',
          priority: 'medium',
          createdAt: new Date().toISOString()
        });
        console.log('✅ Notification created for user:', userId);
      } else {
        console.warn('⚠️ No userId found in request:', request);
      }

      showToast('Pickup scheduled successfully!', 'success');
    } catch (error) {
      console.error('Error scheduling pickup:', error);
      setLocalRequests(requests);
      showToast('Failed to schedule pickup', 'error');
    } finally {
      setUpdating(false);
    }
  };

  const handleSendAvailabilityConfirmation = async (requestId: string, scheduledDate: string, scheduledTime: string) => {
    if (!user || !partner) return;

    try {
      const request = localRequests.find(r => r.id === requestId);
      if (!request) { showToast('Request not found', 'error'); return; }

      const userId = (request as any).userId || (request as any).userID || (request as any).user_id;
      const userPhone = request.phoneNumber || (request as any).userPhone || 'N/A';

      if (!userId) { showToast('User information not found', 'error'); return; }

      // Optimistically hide the button immediately
      setLocalRequests(prev => prev.map(r =>
        r.id === requestId ? { ...r, confirmationSentAt: new Date().toISOString(), confirmationStatus: 'pending' as const } : r
      ));

      await dbService.sendAvailabilityConfirmation(
        requestId, user.uid, userId, scheduledDate, scheduledTime, partner.name, userPhone
      );

      await dbService.updateWasteRequest(requestId, {
        confirmationStatus: 'pending' as const,
        confirmationSentAt: new Date().toISOString()
      });

      showToast('Availability question sent to user!', 'success');
    } catch (error) {
      console.error('Error sending availability question:', error);
      setLocalRequests(requests);
      showToast('Failed to send question to user', 'error');
    }
  };

  // Debug logging
  console.log('📊 PARTNER DASHBOARD DEBUG:', {
    partnerUID: user?.uid,
    totalRequests: requests.length,
    requestsByStatus: {
      assigned: requests.filter(r => r.status === 'Assigned').length,
      accepted: requests.filter(r => r.status === 'accepted').length,
      completed: requests.filter(r => r.status === 'Completed').length,
      rejected: requests.filter(r => r.status === 'rejected').length
    },
    requestDetails: requests.map(r => ({
      id: r.id,
      wasteType: r.type,
      status: r.status,
      statusType: typeof r.status
    })),
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

  const handleAction = async (id: string, action: 'accept' | 'reject' | 'reschedule' | 'update') => {
    setUpdating(true);
    try {
      let newStatus: WasteRequest['status'];
      let notificationMessage = '';
      
      switch (action) {
        case 'accept':
          newStatus = 'accepted';
          notificationMessage = `Your waste request has been accepted by ${partner?.name || 'partner'}`;
          break;
        case 'reject':
          newStatus = 'rejected';
          notificationMessage = `Your waste request has been rejected by ${partner?.name || 'partner'}`;
          break;
        case 'reschedule':
          showToast('Reschedule functionality would open a modal here', 'info');
          setUpdating(false);
          return;
        default:
          setUpdating(false);
          return;
      }

      setLocalRequests(prev => prev.map(r => r.id === id ? {...r, status: newStatus} : r));

      await dbService.updateWasteRequest(id, { status: newStatus });
      
      const request = localRequests.find(r => r.id === id);
      if (request && (request as any).userId) {
        await dbService.createNotification({
          type: 'waste_request',
          title: action === 'accept' ? 'Request Accepted' : 'Request Rejected',
          message: notificationMessage,
          userId: (request as any).userId,
          status: 'pending',
          category: 'pickup_assignment',
          priority: 'medium',
          createdAt: new Date().toISOString()
        });
      }
      
      showToast(`Request ${action === 'accept' ? 'accepted' : 'rejected'} successfully!`, 'success');
    } catch (error) {
      console.error('Error updating request:', error);
      setLocalRequests(requests);
      showToast('Failed to update request', 'error');
    } finally {
      setUpdating(false);
    }
  };

  const assignedRequests = localRequests
    .filter(req => {
      const status = (req.status || '').toLowerCase();
      return status !== 'rejected' && status !== 'completed';
    })
    .sort((a, b) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  // Map wasteType to type for compatibility
  const mappedRequests = assignedRequests.map(req => ({
    ...req,
    type: req.type || (req as any).wasteType || 'Unknown',
    quantity: req.quantity || `${(req as any).itemCount || 0} items`
  }));

  // Debug: Log filtering info
  console.log('🔍 WASTE REQUEST FILTER DEBUG:', {
    totalRequests: requests.length,
    partnerSupportedTypes: partner?.supportedWasteTypes,
    requestTypes: requests.map(r => ({ 
      type: r.type, 
      wasteType: (r as any).wasteType,
      status: r.status, 
      hasType: !!(r.type || (r as any).wasteType)
    })),
    filteredCount: mappedRequests.length,
    note: 'Supporting both type and wasteType fields'
  });

  const rejectedRequests = localRequests
    .filter(req => (req.status || '').toLowerCase() === 'rejected')
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div className="space-y-8">
      <div className="bg-gradient-to-r from-emerald-600 via-blue-600 to-indigo-600 rounded-2xl p-8 text-white shadow-2xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Assigned Waste Requests</h1>
            <p className="text-emerald-100 text-lg flex items-center">
              <span className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></span>
              Pathway Real-time Streaming Active
            </p>
          </div>
          <div className="bg-white/20 px-4 py-2 rounded-lg">
            <div className="text-xs text-emerald-100">Stream Updates</div>
            <div className="text-2xl font-bold">{updateCount}</div>
          </div>
        </div>
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
            </div>
          ) : (
            <div className="space-y-6">
              {mappedRequests.map((request) => (
                <div key={request.id} className="border border-gray-200 rounded-2xl p-6 hover:shadow-lg transition-all duration-300 bg-gradient-to-r from-white to-gray-50">
                  <div className="flex items-start space-x-6">
                    <img
                      src={(request as any).imageUrl || request.image}
                      alt="Waste"
                      className="w-24 h-24 rounded-2xl object-cover shadow-lg flex-shrink-0"
                      style={{ width: '96px', height: '96px', objectFit: 'cover', border: '2px solid #e5e7eb' }}
                      onError={(e) => {
                        console.error('❌ Image failed to load:', (request as any).imageUrl || request.image);
                        console.log('Full request data:', request);
                        e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="96" height="96"%3E%3Crect fill="%23ddd" width="96" height="96"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="14" fill="%23999"%3ENo Image%3C/text%3E%3C/svg%3E';
                        e.currentTarget.onerror = null;
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-2xl font-bold text-gray-900">{request.type || 'Type Not Set'}</h3>
                        <span className={`inline-flex px-4 py-2 text-sm font-bold rounded-full shadow-md ${
                          request.status === 'Assigned' || request.status === 'Requested' ? 'bg-gradient-to-r from-yellow-100 to-yellow-200 text-yellow-800' :
                          request.status === 'pending' ? 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800' :
                          request.status === 'accepted' ? 'bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800' :
                          'bg-gradient-to-r from-red-100 to-red-200 text-red-800'
                        }`}>
                          {request.status === 'Requested' ? 'Assigned' : request.status}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-6 text-sm text-gray-600 mb-6">
                        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                          <span className="font-bold text-gray-900">Quantity:</span> <span className="text-lg">{request.quantity}</span>
                        </div>
                        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                          <span className="font-bold text-gray-900">User:</span> <span className="text-lg">{(request as any).userName || (request as any).userId?.substring(0, 8) || 'User'}</span>
                        </div>
                        <div className="col-span-2 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                          <span className="font-bold text-gray-900">Address:</span> 
                          <span className="text-sm ml-2">
                            {typeof request.location === 'string' 
                              ? request.location 
                              : [(request.location as any)?.house, (request.location as any)?.street, (request.location as any)?.city, (request.location as any)?.pincode].filter(Boolean).join(', ')
                            }
                          </span>
                        </div>
                        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                          <span className="font-bold text-gray-900">Phone:</span> <span className="text-lg text-emerald-600 font-semibold">{request.phoneNumber || (request as any).userPhone || 'N/A'}</span>
                        </div>
                        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                          <span className="font-bold text-gray-900">Date:</span> <span className="text-lg">{new Date(request.date).toLocaleDateString()}</span>
                        </div>
                        {request.scheduledDate && request.scheduledTime && (
                          <div className="col-span-2 bg-emerald-50 p-4 rounded-xl shadow-sm border border-emerald-200">
                            <span className="font-bold text-emerald-900">Scheduled:</span>
                            <span className="text-lg ml-2">{new Date(request.scheduledDate).toLocaleDateString()} at {request.scheduledTime}</span>
                          </div>
                        )}
                        {request.scheduledDate && (
                          <div className="col-span-2 bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
                            <div>
                              <span className="font-bold text-gray-900 text-sm block mb-1">User Availability</span>
                              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                                (request as any).confirmationStatus === 'confirmed'
                                  ? 'bg-green-100 text-green-800'
                                  : (request as any).confirmationStatus === 'not_available'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {(request as any).confirmationStatus === 'confirmed'
                                  ? '✓ Confirmed'
                                  : (request as any).confirmationStatus === 'not_available'
                                  ? '✗ Not Available'
                                  : (request as any).confirmationSentAt
                                  ? '⏳ Awaiting Response'
                                  : '— Not Asked Yet'}
                              </span>
                            </div>
                            {!(request as any).confirmationSentAt && (
                              <button
                                onClick={() => handleSendAvailabilityConfirmation(request.id, request.scheduledDate!, request.scheduledTime!)}
                                className="text-xs px-3 py-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
                              >
                                Ask User Now
                              </button>
                            )}
                          </div>
                        )}
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
                        {(() => {
                          const statusLower = request.status?.toLowerCase();
                          const showButtons = statusLower === 'pending' || statusLower === 'assigned' || statusLower === 'requested';
                          console.log('🔍 BUTTON DEBUG:', {
                            requestId: request.id,
                            originalStatus: request.status,
                            statusLower,
                            showButtons,
                            partnerId: request.partnerId,
                            currentPartner: user?.uid
                          });
                          return showButtons ? (
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
                            </>
                          ) : null;
                        })()}
                        {request.status === 'accepted' && (
                          <button
                            onClick={() => handleSchedulePickup(request.id)}
                            className="inline-flex items-center px-6 py-3 border border-transparent text-sm font-bold rounded-xl text-white bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl"
                          >
                            Schedule Pickup
                          </button>
                        )}
                        {(request.status === 'accepted' || request.status === 'In Progress') && (
                          <button
                            onClick={() => handleUpdateStatus(request.id)}
                            className="inline-flex items-center px-6 py-3 border border-transparent text-sm font-bold rounded-xl text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl"
                          >
                            Mark Complete
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

      {/* Rejected Requests Section */}
      {rejectedRequests.length > 0 && (
        <div className="bg-white shadow-2xl rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-red-50 to-pink-50">
            <h2 className="text-xl font-bold text-gray-900">Rejected Requests</h2>
            <p className="text-sm text-gray-600 mt-1">Requests you have declined</p>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {rejectedRequests.map((request) => (
                <div key={request.id} className="border border-red-200 rounded-xl p-4 bg-red-50">
                  <div className="flex items-center space-x-4">
                    <img
                      src={(request as any).imageUrl || request.image}
                      alt="Waste"
                      className="w-16 h-16 rounded-lg object-cover opacity-75"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-gray-900">{request.type}</h3>
                        <span className="inline-flex px-3 py-1 text-sm font-bold rounded-full bg-red-100 text-red-800">
                          Rejected
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mt-2">
                        <div><span className="font-medium">Quantity:</span> {request.quantity}</div>
                        <div><span className="font-medium">Location:</span> {typeof request.location === 'string' ? request.location : [(request.location as any)?.house, (request.location as any)?.street, (request.location as any)?.city, (request.location as any)?.pincode].filter(Boolean).join(', ')}</div>
                      </div>
                      <div className="text-xs text-gray-500 mt-2">
                        Rejected on {new Date(request.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

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
                    src={(selectedRequest as any).imageUrl || selectedRequest.image}
                    alt="Waste"
                    className="w-20 h-20 rounded-xl object-cover shadow-lg"
                    style={{ width: '80px', height: '80px', objectFit: 'cover' }}
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
                    <p className="text-gray-700">{typeof selectedRequest.location === 'string' ? selectedRequest.location : [(selectedRequest.location as any)?.house, (selectedRequest.location as any)?.street, (selectedRequest.location as any)?.city, (selectedRequest.location as any)?.pincode].filter(Boolean).join(', ')}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h5 className="font-semibold text-gray-900 mb-2">Phone Number</h5>
                    <p className="text-emerald-600 font-semibold">{selectedRequest.phoneNumber || (selectedRequest as any).userPhone || 'N/A'}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h5 className="font-semibold text-gray-900 mb-2">Status</h5>
                    <span className={`inline-flex px-3 py-1 text-sm font-bold rounded-full ${
                      selectedRequest.status === 'Assigned' || selectedRequest.status === 'Requested' ? 'bg-yellow-100 text-yellow-800' :
                      selectedRequest.status === 'pending' ? 'bg-gray-100 text-gray-800' :
                      selectedRequest.status === 'accepted' ? 'bg-blue-100 text-blue-800' :
                      selectedRequest.status === 'Completed' ? 'bg-green-100 text-green-800' :
                      selectedRequest.status === 'rejected' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
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
                    {selectedRequest.type} waste collection request at {typeof selectedRequest.location === 'string' ? selectedRequest.location : [(selectedRequest.location as any)?.house, (selectedRequest.location as any)?.street, (selectedRequest.location as any)?.city, (selectedRequest.location as any)?.pincode].filter(Boolean).join(', ')}.
                    Contact: {selectedRequest.phoneNumber || 'N/A'}.
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
              src={(selectedRequest as any).imageUrl || selectedRequest.image}
              alt={`${selectedRequest.type} waste`}
              className="w-full h-auto max-h-[80vh] object-contain rounded-lg shadow-2xl"
              style={{ maxHeight: '80vh', objectFit: 'contain' }}
              onError={(e) => {
                console.error('❌ Photo modal image failed:', (selectedRequest as any).imageUrl || selectedRequest.image);
                e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="800" height="600"%3E%3Crect fill="%23ddd" width="800" height="600"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="24" fill="%23999"%3EImage Not Available%3C/text%3E%3C/svg%3E';
              }}
            />
            <div className="absolute bottom-4 left-4 bg-black bg-opacity-75 text-white p-4 rounded-lg">
              <h4 className="font-semibold text-lg">{selectedRequest.type}</h4>
              <p className="text-sm opacity-90">Location: {typeof selectedRequest.location === 'string' ? selectedRequest.location : [selectedRequest.location?.house, selectedRequest.location?.street, selectedRequest.location?.city, selectedRequest.location?.pincode].filter(Boolean).join(', ')}</p>
              <p className="text-sm opacity-90">Phone: {selectedRequest.phoneNumber || (selectedRequest as any).userPhone || 'N/A'}</p>
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
                <p className="text-sm text-gray-600 mb-4">Mark this request as completed:</p>
                <button
                  onClick={async () => {
                    if (!requestToUpdate) return;
                    try {
                      const request = localRequests.find(r => r.id === requestToUpdate);
                      
                      setLocalRequests(prev => prev.map(r => r.id === requestToUpdate ? {...r, status: 'Completed'} : r));
                      setShowStatusModal(false);
                      setRequestToUpdate(null);
                      
                      await dbService.updateWasteRequest(requestToUpdate, { status: 'Completed' });
                      
                      if (request && (request as any).userId) {
                        await dbService.createNotification({
                          type: 'waste_request',
                          message: `Your waste request has been completed by ${partner?.name || 'partner'}. Thank you!`,
                          userId: (request as any).userId,
                          status: 'pending',
                          title: 'Waste Request Completed',
                          category: 'pickup_assignment',
                          priority: 'medium',
                          createdAt: new Date().toISOString()
                        });
                      }
                      
                      showToast('Request marked as completed!', 'success');
                    } catch (error) {
                      console.error('❌ Error marking as completed:', error);
                      setLocalRequests(requests);
                      showToast('Failed to update status', 'error');
                    }
                  }}
                  className="w-full text-left px-4 py-3 border border-gray-200 rounded-lg hover:border-green-300 hover:bg-green-50 transition-all duration-200 flex items-center justify-between"
                >
                  <span className="font-medium text-green-900">Mark as Completed</span>
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
      {/* Schedule Pickup Modal */}
      {showScheduleModal && requestToSchedule && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full">
            <div className="p-8">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900">Schedule Collection</h3>
                <button
                  onClick={() => {
                    setShowScheduleModal(false);
                    setRequestToSchedule(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>

              <ScheduleForm onSubmit={handleScheduleSubmit} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const ScheduleForm: React.FC<{ onSubmit: (data: { method: 'pickup' | 'dropoff'; date: string; time: string }) => void }> = ({ onSubmit }) => {
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || !time) {
      // handled by required fields
      return;
    }
    onSubmit({ method: 'pickup', date, time });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-bold text-gray-700 mb-2">Date</label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          min={new Date().toISOString().split('T')[0]}
          className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-bold text-gray-700 mb-2">Time</label>
        <select
          value={time}
          onChange={(e) => setTime(e.target.value)}
          className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
          required
        >
          <option value="">Select Time</option>
          <option value="09:00-11:00">9:00 AM - 11:00 AM</option>
          <option value="11:00-13:00">11:00 AM - 1:00 PM</option>
          <option value="13:00-15:00">1:00 PM - 3:00 PM</option>
          <option value="15:00-17:00">3:00 PM - 5:00 PM</option>
          <option value="17:00-19:00">5:00 PM - 7:00 PM</option>
        </select>
      </div>

      <button
        type="submit"
        className="w-full py-3 px-4 bg-gradient-to-r from-emerald-600 to-green-600 text-white font-bold rounded-xl hover:from-emerald-700 hover:to-green-700 transition-all duration-300"
      >
        Schedule Collection
      </button>
    </form>
  );
};

export default AssignedWasteRequestsPage;