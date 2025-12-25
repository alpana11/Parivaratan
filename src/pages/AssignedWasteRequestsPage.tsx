import React, { useState } from 'react';
import { mockWasteRequests } from '../data/mockData';
import { WasteRequest } from '../types';

const AssignedWasteRequestsPage: React.FC = () => {
  const [requests, setRequests] = useState<WasteRequest[]>(mockWasteRequests);

  const handleAction = (id: string, action: 'accept' | 'reject' | 'reschedule' | 'update') => {
    setRequests(prev =>
      prev.map(req => {
        if (req.id === id) {
          switch (action) {
            case 'accept':
              return { ...req, status: 'Accepted' as const };
            case 'reject':
              return { ...req, status: 'Completed' as const }; // Mock rejection
            case 'reschedule':
              // In real app, would open reschedule modal
              alert('Reschedule functionality would open a modal here');
              return req;
            case 'update':
              // Cycle through statuses for demo
              const statusOrder: (typeof req.status)[] = ['Assigned', 'Accepted', 'In Progress', 'Completed'];
              const currentIndex = statusOrder.indexOf(req.status);
              const nextIndex = (currentIndex + 1) % statusOrder.length;
              return { ...req, status: statusOrder[nextIndex] };
            default:
              return req;
          }
        }
        return req;
      })
    );
  };

  const assignedRequests = requests.filter(req => req.status !== 'Completed');

  return (
    <div className="space-y-8">
      <div className="bg-gradient-to-r from-emerald-600 via-blue-600 to-indigo-600 rounded-2xl p-8 text-white shadow-2xl">
        <h1 className="text-3xl font-bold mb-2">Assigned Waste Requests</h1>
        <p className="text-emerald-100 text-lg">Manage your waste collection assignments</p>
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
              <p className="mt-1 text-gray-600">All your requests have been completed. Great job!</p>
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
                        <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors duration-200">
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          View Details
                        </button>
                        <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-green-600 hover:bg-green-700 transition-colors duration-200">
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
                            onClick={() => handleAction(request.id, 'update')}
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
    </div>
  );
};

export default AssignedWasteRequestsPage;