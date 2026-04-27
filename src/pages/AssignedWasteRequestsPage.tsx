import React, { useState, useEffect } from 'react';
import { WasteRequest } from '../types';
import { useWasteRequests } from '../hooks/useData';
import { dbService } from '../services/dbService';
import { notificationScheduler } from '../services/notificationScheduler';
import { useAuth } from '../hooks/useAuth';

const AssignedWasteRequestsPage: React.FC = () => {
  const { requests, loading: _loading, updateCount } = useWasteRequests();
  const { user, partner } = useAuth();
  const [selectedRequest, setSelectedRequest] = useState<WasteRequest | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [requestToSchedule, setRequestToSchedule] = useState<string | null>(null);
  const [requestToUpdate, setRequestToUpdate] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !partner) return;
    notificationScheduler.checkAndSendAvailabilityConfirmations(user.uid, partner.name);
    const interval = setInterval(() => {
      notificationScheduler.checkAndSendAvailabilityConfirmations(user.uid, partner.name);
    }, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, [user, partner]);

  const handleSchedulePickup = (requestId: string) => {
    setRequestToSchedule(requestId);
    setShowScheduleModal(true);
  };

  const handleScheduleSubmit = async (scheduleData: { method: 'pickup' | 'dropoff'; date: string; time: string }) => {
    if (!requestToSchedule || !user) return;

    const requestId = requestToSchedule; // capture before clearing state
    setShowScheduleModal(false);
    setRequestToSchedule(null);

    try {
      const request = requests.find(r => r.id === requestId);
      if (!request) { alert('Request not found'); return; }

      await dbService.updateWasteRequest(requestId, {
        scheduleMethod: scheduleData.method,
        scheduledDate: scheduleData.date,
        scheduledTime: scheduleData.time,
        status: 'In Progress'
      } as any);

      // Fire these in background — don't block success message
      dbService.createScheduledPickup({
        partnerId: user.uid,
        requestId,
        type: request.type,
        image: (request as any).imageUrl || request.image,
        imageUrl: (request as any).imageUrl || request.image,
        userName: (request as any).userName || 'User',
        phoneNumber: request.phoneNumber || (request as any).userPhone || 'N/A',
        location: typeof request.location === 'string' ? request.location : (request.location as any)?.city || 'Unknown',
        area: typeof request.location === 'string' ? request.location : (request.location as any)?.city || 'Unknown',
        date: scheduleData.date,
        time: scheduleData.time,
        scheduledDate: scheduleData.date,
        scheduledTime: scheduleData.time,
        scheduleMethod: scheduleData.method,
        status: 'scheduled'
      }).catch(() => {});

      alert('Pickup scheduled successfully!');

      const userId = (request as any).userId || (request as any).userID || (request as any).user_id;
      if (userId) {
        dbService.createNotification({
          type: 'waste_request',
          title: 'Pickup Scheduled',
          message: `Your waste pickup has been scheduled for ${new Date(scheduleData.date).toLocaleDateString()} at ${scheduleData.time} by ${partner?.name || 'partner'}`,
          userId,
          status: 'pending',
          category: 'pickup_assignment',
          priority: 'medium',
          createdAt: new Date().toISOString()
        }).catch(() => {});
      }
    } catch (error) {
      alert('Failed to schedule pickup');
    }
  };

  const handleSendAvailabilityConfirmation = async (requestId: string, scheduledDate: string, scheduledTime: string) => {
    if (!user || !partner) return;
    try {
      const request = requests.find(r => r.id === requestId);
      if (!request) { alert('Request not found'); return; }

      const userId = (request as any).userId || (request as any).userID || (request as any).user_id;
      const userPhone = request.phoneNumber || (request as any).userPhone || 'N/A';
      if (!userId) { alert('User information not found'); return; }

      await dbService.sendAvailabilityConfirmation(requestId, user.uid, userId, scheduledDate, scheduledTime, partner.name, userPhone);
      await dbService.updateWasteRequest(requestId, {
        confirmationStatus: 'pending' as const,
        confirmationSentAt: new Date().toISOString()
      } as any);

      alert('✅ Availability question sent to user!');
    } catch (error) {
      console.error('Error sending availability question:', error);
      alert('Failed to send question to user');
    }
  };

  const handleViewDetails = (request: WasteRequest) => { setSelectedRequest(request); setShowDetailsModal(true); };
  const handleViewPhoto = (request: WasteRequest) => { setSelectedRequest(request); setShowPhotoModal(true); };
  const handleUpdateStatus = (requestId: string) => { setRequestToUpdate(requestId); setShowStatusModal(true); };

  const handleAction = async (id: string, action: 'accept' | 'reject') => {
    try {
      const newStatus = action === 'accept' ? 'accepted' : 'rejected';
      const notificationMessage = action === 'accept'
        ? `Your waste request has been accepted by ${partner?.name || 'partner'}`
        : `Your waste request has been rejected by ${partner?.name || 'partner'}`;

      await dbService.updateWasteRequest(id, { status: newStatus as any });

      const request = requests.find(r => r.id === id);
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

      alert(`Request ${action === 'accept' ? 'accepted' : 'rejected'} successfully!`);
    } catch (error) {
      console.error('Error updating request:', error);
      alert('Failed to update request');
    }
  };

  const handleMarkComplete = async (requestId: string) => {
    try {
      setShowStatusModal(false);
      setRequestToUpdate(null);

      await dbService.updateWasteRequest(requestId, { status: 'Completed' });

      const request = requests.find(r => r.id === requestId);
      if (request && (request as any).userId) {
        await dbService.createNotification({
          type: 'waste_request',
          title: 'Pickup Completed',
          message: `Your waste request has been completed by ${partner?.name || 'partner'}. Thank you!`,
          userId: (request as any).userId,
          status: 'pending',
          category: 'pickup_assignment',
          priority: 'medium',
          createdAt: new Date().toISOString()
        });
      }

      alert('✅ Request marked as completed!');
    } catch (error) {
      console.error('Error marking as completed:', error);
      alert('Failed to update status');
    }
  };

  const assignedRequests = requests
    .filter(req => {
      const status = (req.status || '').toLowerCase();
      return status !== 'rejected' && status !== 'completed';
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .map(req => ({
      ...req,
      type: req.type || (req as any).wasteType || 'Unknown',
      quantity: req.quantity || `${(req as any).itemCount || 0} items`
    }));

  const rejectedRequests = requests
    .filter(req => (req.status || '').toLowerCase() === 'rejected')
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const formatLocation = (location: any) =>
    typeof location === 'string' ? location : [location?.house, location?.street, location?.city, location?.pincode].filter(Boolean).join(', ');

  return (
    <div className="space-y-8">
      <div className="bg-gradient-to-r from-emerald-600 via-blue-600 to-indigo-600 rounded-2xl p-8 text-white shadow-2xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Assigned Waste Requests</h1>
            <p className="text-emerald-100 text-lg flex items-center">
              <span className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></span>
              Real-time Updates Active
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
              <h3 className="mt-2 text-xl font-semibold text-gray-900">No active requests</h3>
              <p className="mt-1 text-gray-600">No waste requests have been assigned to you yet.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {assignedRequests.map((request) => (
                <div key={request.id} className="border border-gray-200 rounded-2xl p-6 hover:shadow-lg transition-all duration-300 bg-gradient-to-r from-white to-gray-50">
                  <div className="flex items-start space-x-6">
                    <img
                      src={(request as any).imageUrl || request.image}
                      alt="Waste"
                      className="w-24 h-24 rounded-2xl object-cover shadow-lg flex-shrink-0"
                      style={{ width: '96px', height: '96px', objectFit: 'cover', border: '2px solid #e5e7eb' }}
                      onError={(e) => {
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
                          request.status === 'In Progress' ? 'bg-gradient-to-r from-emerald-100 to-emerald-200 text-emerald-800' :
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
                          <span className="text-sm ml-2">{formatLocation(request.location)}</span>
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
                                (request as any).confirmationStatus === 'confirmed' ? 'bg-green-100 text-green-800' :
                                (request as any).confirmationStatus === 'not_available' ? 'bg-red-100 text-red-800' :
                                'bg-yellow-100 text-yellow-800'
                              }`}>
                                {(request as any).confirmationStatus === 'confirmed' ? '✓ Confirmed' :
                                 (request as any).confirmationStatus === 'not_available' ? '✗ Not Available' :
                                 (request as any).confirmationSentAt ? '⏳ Awaiting Response' : '— Not Asked Yet'}
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
                      <div className="flex flex-wrap gap-3">
                        <button onClick={() => handleViewDetails(request)} className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors">
                          View Details
                        </button>
                        <button onClick={() => handleViewPhoto(request)} className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg text-white bg-green-600 hover:bg-green-700 transition-colors">
                          View Photo
                        </button>
                        {['pending', 'assigned', 'requested'].includes((request.status || '').toLowerCase()) && (
                          <>
                            <button onClick={() => handleAction(request.id, 'accept')} className="inline-flex items-center px-6 py-3 text-sm font-bold rounded-xl text-white bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 shadow-lg transition-all">
                              Accept
                            </button>
                            <button onClick={() => handleAction(request.id, 'reject')} className="inline-flex items-center px-6 py-3 border-2 border-gray-300 text-sm font-bold rounded-xl text-gray-700 bg-white hover:border-red-500 hover:text-red-600 hover:bg-red-50 transition-all">
                              Reject
                            </button>
                          </>
                        )}
                        {request.status === 'accepted' && (
                          <button onClick={() => handleSchedulePickup(request.id)} className="inline-flex items-center px-6 py-3 text-sm font-bold rounded-xl text-white bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg transition-all">
                            Schedule Pickup
                          </button>
                        )}
                        {(request.status === 'accepted' || request.status === 'In Progress') && (
                          <button onClick={() => handleUpdateStatus(request.id)} className="inline-flex items-center px-6 py-3 text-sm font-bold rounded-xl text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg transition-all">
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

      {/* Rejected Requests */}
      {rejectedRequests.length > 0 && (
        <div className="bg-white shadow-2xl rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-red-50 to-pink-50">
            <h2 className="text-xl font-bold text-gray-900">Rejected Requests</h2>
          </div>
          <div className="p-6 space-y-4">
            {rejectedRequests.map((request) => (
              <div key={request.id} className="border border-red-200 rounded-xl p-4 bg-red-50">
                <div className="flex items-center space-x-4">
                  <img src={(request as any).imageUrl || request.image} alt="Waste" className="w-16 h-16 rounded-lg object-cover opacity-75" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-gray-900">{request.type}</h3>
                      <span className="inline-flex px-3 py-1 text-sm font-bold rounded-full bg-red-100 text-red-800">Rejected</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mt-2">
                      <div><span className="font-medium">Quantity:</span> {request.quantity}</div>
                      <div><span className="font-medium">Location:</span> {formatLocation(request.location)}</div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
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
                <button onClick={() => setShowDetailsModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-gray-50 p-4 rounded-lg"><h5 className="font-semibold text-gray-900 mb-2">Type</h5><p>{selectedRequest.type}</p></div>
                <div className="bg-gray-50 p-4 rounded-lg"><h5 className="font-semibold text-gray-900 mb-2">Quantity</h5><p>{selectedRequest.quantity}</p></div>
                <div className="bg-gray-50 p-4 rounded-lg"><h5 className="font-semibold text-gray-900 mb-2">Phone</h5><p className="text-emerald-600 font-semibold">{selectedRequest.phoneNumber || 'N/A'}</p></div>
                <div className="bg-gray-50 p-4 rounded-lg"><h5 className="font-semibold text-gray-900 mb-2">Status</h5><p>{selectedRequest.status}</p></div>
                <div className="col-span-2 bg-gray-50 p-4 rounded-lg"><h5 className="font-semibold text-gray-900 mb-2">Location</h5><p>{formatLocation(selectedRequest.location)}</p></div>
              </div>
              <div className="flex justify-end mt-6">
                <button onClick={() => setShowDetailsModal(false)} className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">Close</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Photo Modal */}
      {showPhotoModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="relative max-w-4xl w-full">
            <button onClick={() => setShowPhotoModal(false)} className="absolute top-4 right-4 text-white bg-black bg-opacity-50 rounded-full p-2 z-10">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            <img
              src={(selectedRequest as any).imageUrl || selectedRequest.image}
              alt={selectedRequest.type}
              className="w-full max-h-[80vh] object-contain rounded-lg shadow-2xl"
              onError={(e) => { e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="800" height="600"%3E%3Crect fill="%23ddd" width="800" height="600"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-size="24" fill="%23999"%3EImage Not Available%3C/text%3E%3C/svg%3E'; }}
            />
          </div>
        </div>
      )}

      {/* Status Modal */}
      {showStatusModal && requestToUpdate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-8">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-gray-900">Update Status</h3>
              <button onClick={() => { setShowStatusModal(false); setRequestToUpdate(null); }} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
            </div>
            <button
              onClick={() => handleMarkComplete(requestToUpdate)}
              className="w-full text-left px-4 py-3 border border-gray-200 rounded-lg hover:border-green-300 hover:bg-green-50 transition-all flex items-center justify-between"
            >
              <span className="font-medium text-green-900">Mark as Completed</span>
              <span className="text-sm text-green-600">Waste collection has been completed</span>
            </button>
            <div className="flex justify-end mt-6">
              <button onClick={() => { setShowStatusModal(false); setRequestToUpdate(null); }} className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Modal */}
      {showScheduleModal && requestToSchedule && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full">
            <div className="p-8">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900">Schedule Collection</h3>
                <button onClick={() => { setShowScheduleModal(false); setRequestToSchedule(null); }} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
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
    if (!date || !time) return;
    onSubmit({ method: 'pickup', date, time });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-bold text-gray-700 mb-2">Date</label>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} min={new Date().toISOString().split('T')[0]} className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500" required />
      </div>
      <div>
        <label className="block text-sm font-bold text-gray-700 mb-2">Time</label>
        <select value={time} onChange={(e) => setTime(e.target.value)} className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500" required>
          <option value="">Select Time</option>
          <option value="09:00-11:00">9:00 AM - 11:00 AM</option>
          <option value="11:00-13:00">11:00 AM - 1:00 PM</option>
          <option value="13:00-15:00">1:00 PM - 3:00 PM</option>
          <option value="15:00-17:00">3:00 PM - 5:00 PM</option>
          <option value="17:00-19:00">5:00 PM - 7:00 PM</option>
        </select>
      </div>
      <button type="submit" className="w-full py-3 px-4 bg-gradient-to-r from-emerald-600 to-green-600 text-white font-bold rounded-xl hover:from-emerald-700 hover:to-green-700 transition-all">
        Schedule Collection
      </button>
    </form>
  );
};

export default AssignedWasteRequestsPage;
