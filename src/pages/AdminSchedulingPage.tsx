import React, { useState, useEffect } from 'react';
import { dbService } from '../services/dbService';
import { Partner, WasteRequest, PickupSchedule, AreaSchedule } from '../types';

const AdminSchedulingPage: React.FC = () => {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [wasteRequests, setWasteRequests] = useState<WasteRequest[]>([]);
  const [schedules, setSchedules] = useState<PickupSchedule[]>([]);
  const [areaSchedules, setAreaSchedules] = useState<AreaSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedArea, setSelectedArea] = useState<string>('all');
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<PickupSchedule | null>(null);
  const [newSchedule, setNewSchedule] = useState<Partial<PickupSchedule>>({
    area: '',
    date: '',
    timeSlot: '',
    assignedPartnerId: '',
    wasteRequestIds: [],
    status: 'scheduled',
    notes: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [partnersData, wasteRequestsData] = await Promise.all([
        dbService.getAllPartners(),
        dbService.getAllWasteRequests()
      ]);

      setPartners(partnersData);
      setWasteRequests(wasteRequestsData);

      // Mock area schedules - in real app, this would come from database
      const mockAreaSchedules: AreaSchedule[] = [
        {
          area: 'Downtown',
          schedules: [],
          assignedPartners: partnersData.filter(p => p.serviceAreas?.includes('Downtown')).map(p => p.id),
          capacity: 20,
          priority: 'high'
        },
        {
          area: 'Residential North',
          schedules: [],
          assignedPartners: partnersData.filter(p => p.serviceAreas?.includes('Residential North')).map(p => p.id),
          capacity: 15,
          priority: 'medium'
        },
        {
          area: 'Industrial Zone',
          schedules: [],
          assignedPartners: partnersData.filter(p => p.serviceAreas?.includes('Industrial Zone')).map(p => p.id),
          capacity: 25,
          priority: 'high'
        },
        {
          area: 'Suburban South',
          schedules: [],
          assignedPartners: partnersData.filter(p => p.serviceAreas?.includes('Suburban South')).map(p => p.id),
          capacity: 12,
          priority: 'low'
        }
      ];

      setAreaSchedules(mockAreaSchedules);

      // Mock schedules - in real app, this would come from database
      const mockSchedules: PickupSchedule[] = generateMockSchedules(partnersData, wasteRequestsData, mockAreaSchedules);
      setSchedules(mockSchedules);

    } catch (error) {
      console.error('Error loading scheduling data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateMockSchedules = (partners: Partner[], requests: WasteRequest[], areas: AreaSchedule[]): PickupSchedule[] => {
    const schedules: PickupSchedule[] = [];
    const today = new Date();

    areas.forEach(area => {
      for (let i = 0; i < 7; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);

        // Create 2-3 time slots per day per area
        const timeSlots = ['09:00-11:00', '14:00-16:00', '16:00-18:00'];
        timeSlots.forEach((slot, slotIndex) => {
          if (Math.random() > 0.3) { // 70% chance of having a schedule
            const assignedPartner = area.assignedPartners[Math.floor(Math.random() * area.assignedPartners.length)];
            const areaRequests = requests.filter(r =>
              r.location.toLowerCase().includes(area.area.toLowerCase().split(' ')[0]) &&
              r.status !== 'Completed'
            ).slice(0, 3); // Max 3 requests per slot

            if (areaRequests.length > 0) {
              schedules.push({
                id: `schedule-${area.area}-${date.toISOString().split('T')[0]}-${slotIndex}`,
                area: area.area,
                date: date.toISOString().split('T')[0],
                timeSlot: slot,
                assignedPartnerId: assignedPartner,
                wasteRequestIds: areaRequests.map(r => r.id),
                status: Math.random() > 0.7 ? 'completed' : Math.random() > 0.5 ? 'in_progress' : 'scheduled',
                notes: Math.random() > 0.8 ? 'High priority pickup' : undefined,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
              });
            }
          }
        });
      }
    });

    return schedules;
  };

  const getWeekDates = (weekStart: Date) => {
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + i);
      dates.push(date);
    }
    return dates;
  };

  const getSchedulesForDate = (date: Date, area?: string) => {
    const dateStr = date.toISOString().split('T')[0];
    return schedules.filter(s =>
      s.date === dateStr &&
      (!area || area === 'all' || s.area === area)
    );
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

  const handleCreateSchedule = () => {
    if (!newSchedule.area || !newSchedule.date || !newSchedule.timeSlot || !newSchedule.assignedPartnerId) {
      alert('Please fill in all required fields');
      return;
    }

    const schedule: PickupSchedule = {
      id: `schedule-${Date.now()}`,
      area: newSchedule.area,
      date: newSchedule.date,
      timeSlot: newSchedule.timeSlot,
      assignedPartnerId: newSchedule.assignedPartnerId,
      wasteRequestIds: newSchedule.wasteRequestIds || [],
      status: newSchedule.status as PickupSchedule['status'] || 'scheduled',
      notes: newSchedule.notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setSchedules([...schedules, schedule]);
    setShowScheduleModal(false);
    setNewSchedule({
      area: '',
      date: '',
      timeSlot: '',
      assignedPartnerId: '',
      wasteRequestIds: [],
      status: 'scheduled',
      notes: ''
    });
  };

  const handleUpdateSchedule = (scheduleId: string, updates: Partial<PickupSchedule>) => {
    setSchedules(schedules.map(s =>
      s.id === scheduleId
        ? { ...s, ...updates, updatedAt: new Date().toISOString() }
        : s
    ));
  };

  const weekDates = getWeekDates(currentWeek);
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
          <h2 className="text-2xl font-bold text-gray-900">📅 Pickup Scheduling</h2>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setShowScheduleModal(true)}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              + Create Schedule
            </button>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => {
                  const newWeek = new Date(currentWeek);
                  newWeek.setDate(currentWeek.getDate() - 7);
                  setCurrentWeek(newWeek);
                }}
                className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                ← Previous Week
              </button>
              <span className="text-sm font-medium text-gray-700">
                {weekDates[0].toLocaleDateString()} - {weekDates[6].toLocaleDateString()}
              </span>
              <button
                onClick={() => {
                  const newWeek = new Date(currentWeek);
                  newWeek.setDate(currentWeek.getDate() + 7);
                  setCurrentWeek(newWeek);
                }}
                className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                Next Week →
              </button>
            </div>
          </div>
        </div>

        {/* Area Filter */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedArea('all')}
              className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                selectedArea === 'all'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All Areas ({areaSchedules.length})
            </button>
            {areaSchedules.map(area => (
              <button
                key={area.area}
                onClick={() => setSelectedArea(area.area)}
                className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                  selectedArea === area.area
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {area.area} ({area.assignedPartners.length} partners)
              </button>
            ))}
          </div>
        </div>

        {/* Weekly Calendar View */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="grid grid-cols-8 border-b border-gray-200">
            <div className="p-4 bg-gray-50 font-semibold text-gray-900">Area</div>
            {weekDates.map((date, index) => (
              <div key={index} className="p-4 bg-gray-50 text-center border-l border-gray-200">
                <div className="font-semibold text-gray-900">
                  {date.toLocaleDateString('en-US', { weekday: 'short' })}
                </div>
                <div className="text-sm text-gray-600">
                  {date.getDate()}
                </div>
              </div>
            ))}
          </div>

          {areaSchedules.map(area => {
            if (selectedArea !== 'all' && selectedArea !== area.area) return null;

            return (
              <div key={area.area} className="grid grid-cols-8 border-b border-gray-100">
                <div className="p-4 bg-white">
                  <div className="font-medium text-gray-900">{area.area}</div>
                  <div className="text-sm text-gray-600">
                    {area.assignedPartners.length} partners
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Capacity: {area.capacity}/day
                  </div>
                  <div className={`inline-flex px-2 py-1 text-xs rounded-full mt-1 ${
                    area.priority === 'high' ? 'bg-red-100 text-red-800' :
                    area.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {area.priority} priority
                  </div>
                </div>

                {weekDates.map((date, dateIndex) => {
                  const daySchedules = getSchedulesForDate(date, area.area);
                  return (
                    <div key={dateIndex} className="p-2 border-l border-gray-200 bg-gray-50 min-h-[120px]">
                      <div className="space-y-1">
                        {daySchedules.map(schedule => (
                          <div
                            key={schedule.id}
                            className={`p-2 rounded text-xs cursor-pointer border ${getStatusColor(schedule.status)}`}
                            onClick={() => setSelectedSchedule(schedule)}
                          >
                            <div className="font-medium">{schedule.timeSlot}</div>
                            <div className="truncate">{getPartnerName(schedule.assignedPartnerId)}</div>
                            <div className="text-xs opacity-75">
                              {schedule.wasteRequestIds.length} pickups
                            </div>
                          </div>
                        ))}
                        {daySchedules.length === 0 && (
                          <div className="text-xs text-gray-400 text-center py-4">
                            No schedules
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
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
                            <span className="text-xs text-gray-500">{request.location}</span>
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

                  <div className="flex justify-end space-x-3 pt-4 border-t">
                    <select
                      value={selectedSchedule.status}
                      onChange={(e) => handleUpdateSchedule(selectedSchedule.id, { status: e.target.value as PickupSchedule['status'] })}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="scheduled">Scheduled</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                    <button
                      onClick={() => setSelectedSchedule(null)}
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

        {/* Create Schedule Modal */}
        {showScheduleModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl max-w-md w-full mx-4">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-gray-900">Create New Schedule</h3>
                  <button
                    onClick={() => setShowScheduleModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Area</label>
                    <select
                      value={newSchedule.area}
                      onChange={(e) => setNewSchedule({ ...newSchedule, area: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Area</option>
                      {areaSchedules.map(area => (
                        <option key={area.area} value={area.area}>{area.area}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                    <input
                      type="date"
                      value={newSchedule.date}
                      onChange={(e) => setNewSchedule({ ...newSchedule, date: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Time Slot</label>
                    <select
                      value={newSchedule.timeSlot}
                      onChange={(e) => setNewSchedule({ ...newSchedule, timeSlot: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Time Slot</option>
                      <option value="09:00-11:00">9:00 AM - 11:00 AM</option>
                      <option value="11:00-13:00">11:00 AM - 1:00 PM</option>
                      <option value="14:00-16:00">2:00 PM - 4:00 PM</option>
                      <option value="16:00-18:00">4:00 PM - 6:00 PM</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Assigned Partner</label>
                    <select
                      value={newSchedule.assignedPartnerId}
                      onChange={(e) => setNewSchedule({ ...newSchedule, assignedPartnerId: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Partner</option>
                      {partners
                        .filter(p => p.status === 'active' && (!newSchedule.area || p.serviceAreas?.includes(newSchedule.area)))
                        .map(partner => (
                        <option key={partner.id} value={partner.id}>{partner.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Notes (Optional)</label>
                    <textarea
                      value={newSchedule.notes}
                      onChange={(e) => setNewSchedule({ ...newSchedule, notes: e.target.value })}
                      placeholder="Any special instructions..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={3}
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    onClick={() => setShowScheduleModal(false)}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateSchedule}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    Create Schedule
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