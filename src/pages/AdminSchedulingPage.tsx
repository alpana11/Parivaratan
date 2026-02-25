import React, { useState, useEffect } from 'react';
import { dbService } from '../services/dbService';
import { Partner, WasteRequest, PickupSchedule, AreaSchedule } from '../types';

const AdminSchedulingPage: React.FC = () => {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [wasteRequests, setWasteRequests] = useState<WasteRequest[]>([]);
  const [schedules, setSchedules] = useState<PickupSchedule[]>([]);
  const [partnerSchedules, setPartnerSchedules] = useState<any[]>([]);
  const [areaSchedules, setAreaSchedules] = useState<AreaSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedArea, setSelectedArea] = useState<string>('all');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedSchedule, setSelectedSchedule] = useState<any | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [fromDateModal, setFromDateModal] = useState(false);

  useEffect(() => {
    loadData();
    
    // Subscribe to partner-created scheduled pickups
    const unsubscribeSchedules = dbService.subscribeToAllScheduledPickups((pickups) => {
      setPartnerSchedules(pickups);
    });

    // Set up real-time listener for waste requests
    const unsubscribe = dbService.subscribeToWasteRequests((updatedRequests) => {
      setWasteRequests(updatedRequests);
      
      // Update schedules from waste requests
      const scheduledRequests = updatedRequests
        .filter(r => r.scheduledDate && r.scheduledTime)
        .map(r => ({
          id: r.id,
          area: r.location,
          date: r.scheduledDate!,
          timeSlot: r.scheduledTime!,
          assignedPartnerId: r.partnerId,
          wasteRequestIds: [r.id],
          status: r.status === 'accepted' ? 'scheduled' as const : 'completed' as const,
          notes: `${r.scheduleMethod === 'pickup' ? 'Pickup' : 'Drop-off'} - ${r.type}`,
          createdAt: r.createdAt,
          updatedAt: r.createdAt
        }));
      
      setSchedules(scheduledRequests);
    });

    return () => {
      unsubscribe();
      unsubscribeSchedules();
    };
  }, []);

  const loadData = async () => {
    try {
      const [partnersData, wasteRequestsData] = await Promise.all([
        dbService.getAllPartners(),
        dbService.getAllWasteRequests()
      ]);

      setPartners(partnersData);
      setWasteRequests(wasteRequestsData);

      // Convert waste requests with schedules to PickupSchedule format
      const scheduledRequests = wasteRequestsData
        .filter(r => r.scheduledDate && r.scheduledTime)
        .map(r => ({
          id: r.id,
          area: typeof r.location === 'string' ? r.location : r.location?.city || 'Unknown',
          date: r.scheduledDate!,
          timeSlot: r.scheduledTime!,
          assignedPartnerId: r.partnerId,
          wasteRequestIds: [r.id],
          status: r.status === 'accepted' ? 'scheduled' as const : 'completed' as const,
          notes: `${r.scheduleMethod === 'pickup' ? 'Pickup' : 'Drop-off'} - ${r.type}`,
          createdAt: r.createdAt,
          updatedAt: r.createdAt
        }));

      setSchedules(scheduledRequests);

      // Extract unique areas from both waste requests and partner schedules
      const wasteAreas = wasteRequestsData.map(r => typeof r.location === 'string' ? r.location : r.location?.city || 'Unknown');
      const uniqueAreas = Array.from(new Set(wasteAreas));
      const mockAreaSchedules: AreaSchedule[] = uniqueAreas.map(area => ({
        area,
        schedules: [],
        assignedPartners: partnersData.filter(p => p.serviceAreas?.includes(area)).map(p => p.id),
        capacity: 20,
        priority: 'medium' as const
      }));

      setAreaSchedules(mockAreaSchedules);

    } catch (error) {
      console.error('Error loading scheduling data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMonthDates = (month: Date) => {
    const year = month.getFullYear();
    const monthIndex = month.getMonth();
    const firstDay = new Date(year, monthIndex, 1);
    const lastDay = new Date(year, monthIndex + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - startDate.getDay());
    
    const dates = [];
    const current = new Date(startDate);
    
    while (dates.length < 42) {
      dates.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    
    return dates;
  };

  const getSchedulesForDate = (date: Date, area?: string) => {
    const dateStr = date.toISOString().split('T')[0];
    
    // Combine both waste request schedules and partner-created schedules
    const wasteSchedules = schedules.filter(s =>
      s.date === dateStr &&
      (!area || area === 'all' || s.area === area)
    );
    
    const partnerPickups = partnerSchedules
      .filter(p => p.date === dateStr && (!area || area === 'all' || p.area === area))
      .map(p => ({
        id: p.id,
        area: p.area,
        date: p.date,
        timeSlot: p.time,
        assignedPartnerId: p.partnerId,
        wasteRequestIds: [],
        status: 'scheduled' as const,
        notes: p.notes || 'Partner scheduled pickup',
        createdAt: p.createdAt,
        updatedAt: p.createdAt
      }));
    
    return [...wasteSchedules, ...partnerPickups];
  };

  const getPartnerName = (partnerId: string) => {
    const partner = partners.find(p => p.id === partnerId);
    return partner ? partner.name : 'Unknown Partner';
  };

  const getStatusColor = (status: PickupSchedule['status']) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusLabel = (status: PickupSchedule['status']) => {
    switch (status) {
      case 'scheduled': return 'Scheduled';
      case 'in_progress': return 'In Progress';
      case 'completed': return 'Completed';
      case 'cancelled': return 'Cancelled';
      default: return status;
    }
  };

  const handleUpdateSchedule = async (scheduleId: string, updates: Partial<PickupSchedule>) => {
    try {
      // Update the waste request status instead
      await dbService.updateWasteRequest(scheduleId, {
        status: updates.status === 'completed' ? 'accepted' : 'accepted'
      });
      if (selectedSchedule?.id === scheduleId) {
        setSelectedSchedule({ ...selectedSchedule, ...updates });
      }
      await loadData(); // Refresh data
    } catch (error) {
      console.error('Error updating schedule:', error);
      alert('Failed to update schedule. Please try again.');
    }
  };

  const monthDates = getMonthDates(currentMonth);
  const currentMonthIndex = currentMonth.getMonth();
  const filteredSchedules = selectedArea === 'all'
    ? schedules
    : schedules.filter(s => s.area === selectedArea);

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">📅 Partner Pickup Schedules</h2>
            <div className="flex items-center space-x-2 bg-green-50 px-3 py-1 rounded-full border border-green-200">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-green-700 font-medium">Real-time Updates</span>
            </div>
            <p className="text-sm text-gray-600 mt-1">View schedules created by partners in real-time</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => {
                  const newMonth = new Date(currentMonth);
                  newMonth.setMonth(currentMonth.getMonth() - 1);
                  setCurrentMonth(newMonth);
                }}
                className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                ← Previous Month
              </button>
              <span className="text-sm font-medium text-gray-700">
                {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </span>
              <button
                onClick={() => {
                  const newMonth = new Date(currentMonth);
                  newMonth.setMonth(currentMonth.getMonth() + 1);
                  setCurrentMonth(newMonth);
                }}
                className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                Next Month →
              </button>
            </div>
          </div>
        </div>

        {/* Area Filter */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedArea('all')}
              className="px-4 py-2 text-sm rounded-lg bg-blue-500 text-white shadow-md"
            >
              All Areas ({areaSchedules.length})
            </button>
          </div>
        </div>

        {/* Monthly Calendar View */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
          {/* Day headers */}
          <div className="grid grid-cols-7 bg-gradient-to-b from-gray-50 to-white border-b border-gray-200">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div key={day} className="p-3 text-center border-r border-gray-200">
                <div className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                  {day}
                </div>
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7">
            {monthDates.map((date, index) => {
              const isToday = date.toDateString() === new Date().toDateString();
              const isCurrentMonth = date.getMonth() === currentMonthIndex;
              const daySchedules = areaSchedules.flatMap(area => 
                getSchedulesForDate(date, selectedArea === 'all' ? undefined : selectedArea)
              );
              
              return (
                <div
                  key={index}
                  className={`min-h-[120px] p-2 border-r border-b border-gray-200 ${
                    isToday ? 'bg-blue-50/30' : isCurrentMonth ? 'bg-white hover:bg-gray-50' : 'bg-gray-50/50'
                  } transition-colors`}
                >
                  <div className={`text-sm font-semibold mb-2 ${
                    isToday ? 'text-blue-600' : isCurrentMonth ? 'text-gray-900' : 'text-gray-400'
                  }`}>
                    {date.getDate()}
                  </div>
                  <div className="space-y-1">
                    {daySchedules.slice(0, 3).map(schedule => (
                      <div
                        key={schedule.id}
                        className={`p-1.5 rounded text-xs cursor-pointer border-l-2 shadow-sm hover:shadow-md transition-all ${
                          schedule.status === 'scheduled' ? 'bg-blue-50 border-blue-500 hover:bg-blue-100' :
                          schedule.status === 'in_progress' ? 'bg-yellow-50 border-yellow-500 hover:bg-yellow-100' :
                          schedule.status === 'completed' ? 'bg-green-50 border-green-500 hover:bg-green-100' :
                          'bg-red-50 border-red-500 hover:bg-red-100'
                        }`}
                        onClick={() => {
                          setFromDateModal(false);
                          setSelectedSchedule(schedule);
                        }}
                      >
                        <div className="font-semibold truncate">{schedule.timeSlot}</div>
                      </div>
                    ))}
                    {daySchedules.length > 3 && (
                      <button
                        onClick={() => setSelectedDate(date)}
                        className="w-full text-xs text-blue-600 hover:text-blue-800 font-medium py-1 hover:bg-blue-50 rounded transition-colors"
                      >
                        View all {daySchedules.length}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Schedule Details Modal */}
        {selectedSchedule && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-gray-900">Schedule Details</h3>
                  <button
                    onClick={() => setSelectedSchedule(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Area</label>
                      <p className="text-sm text-gray-900">{selectedSchedule.area}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Date & Time</label>
                      <p className="text-sm text-gray-900">
                        {new Date(selectedSchedule.date).toLocaleDateString()} {selectedSchedule.timeSlot}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Assigned Partner</label>
                      <p className="text-sm text-gray-900">{getPartnerName(selectedSchedule.assignedPartnerId)}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Status</label>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getStatusColor(selectedSchedule.status)}`}>
                        {getStatusLabel(selectedSchedule.status)}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Pickup Address</label>
                    <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded border border-gray-200">
                      {selectedSchedule.area}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Waste Requests ({selectedSchedule.wasteRequestIds.length})</label>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {selectedSchedule.wasteRequestIds.map(requestId => {
                        const request = wasteRequests.find(r => r.id === requestId);
                        return request ? (
                          <div key={requestId} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <div>
                              <span className="text-sm font-medium">{request.type}</span>
                              <span className="text-xs text-gray-600 ml-2">{request.quantity}</span>
                            </div>
                            <span className="text-xs text-gray-500">{typeof request.location === 'string' ? request.location : request.location?.city || 'Unknown'}</span>
                          </div>
                        ) : null;
                      })}
                    </div>
                  </div>

                  {selectedSchedule.notes && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                      <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">{selectedSchedule.notes}</p>
                    </div>
                  )}

                  <div className="flex justify-end pt-4 border-t">
                    <button
                      onClick={() => {
                        setSelectedSchedule(null);
                        if (fromDateModal) {
                          setFromDateModal(false);
                        }
                      }}
                      className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Day Schedules Modal */}
        {selectedDate && !selectedSchedule && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-gray-900">
                    Schedules for {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                  </h3>
                  <button
                    onClick={() => setSelectedDate(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-3">
                  {areaSchedules.flatMap(area => 
                    getSchedulesForDate(selectedDate, selectedArea === 'all' ? undefined : selectedArea)
                  ).map(schedule => (
                    <div
                      key={schedule.id}
                      className={`p-4 rounded-lg cursor-pointer border-l-4 shadow-sm hover:shadow-md transition-all ${
                        schedule.status === 'scheduled' ? 'bg-blue-50 border-blue-500 hover:bg-blue-100' :
                        schedule.status === 'in_progress' ? 'bg-yellow-50 border-yellow-500 hover:bg-yellow-100' :
                        schedule.status === 'completed' ? 'bg-green-50 border-green-500 hover:bg-green-100' :
                        'bg-red-50 border-red-500 hover:bg-red-100'
                      }`}
                      onClick={() => {
                        setFromDateModal(true);
                        setSelectedSchedule(schedule);
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-bold text-gray-900">{schedule.timeSlot}</div>
                          <div className="text-sm text-gray-600 mt-1">{getPartnerName(schedule.assignedPartnerId)}</div>
                          <div className="text-xs text-gray-500 mt-1">{schedule.area}</div>
                        </div>
                        <div className="text-right">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getStatusColor(schedule.status)}`}>
                            {getStatusLabel(schedule.status)}
                          </span>
                          <div className="text-xs text-gray-600 mt-2">
                            {schedule.wasteRequestIds.length} pickup{schedule.wasteRequestIds.length !== 1 ? 's' : ''}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-end pt-4 border-t mt-6">
                  <button
                    onClick={() => setSelectedDate(null)}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                  >
                    Close
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

export default AdminSchedulingPage;