import React, { useState, useEffect } from 'react';
import { dbService } from '../services/dbService';
import { AuditLog, Partner, WasteRequest } from '../types';
import { useAuth } from '../hooks/useAuth';

const AdminAuditPage: React.FC = () => {
  const { admin } = useAuth();
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [wasteRequests, setWasteRequests] = useState<WasteRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [filterEntityType, setFilterEntityType] = useState<string>('all');
  const [filterActionType, setFilterActionType] = useState<string>('all');
  const [filterAdmin, setFilterAdmin] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState({
    start: '',
    end: ''
  });
  const [lastRefresh, setLastRefresh] = useState(new Date());

  useEffect(() => {
    loadData();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      loadData();
      setLastRefresh(new Date());
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      // Load from localStorage for demo
      const auditLogsData = JSON.parse(localStorage.getItem('auditLogs') || '[]');
      const partnersData = JSON.parse(localStorage.getItem('partners') || '[]');
      const wasteRequestsData = []; // Mock data for now

      setAuditLogs(auditLogsData);
      setPartners(partnersData);
      setWasteRequests(wasteRequestsData);
    } catch (error) {
      console.error('Error loading audit data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDateRangeFilter = async () => {
    if (!dateRange.start || !dateRange.end) return;

    try {
      const startDate = new Date(dateRange.start);
      const endDate = new Date(dateRange.end);
      endDate.setHours(23, 59, 59, 999); // End of day

      const filteredLogs = await dbService.getAuditLogsByDateRange(startDate, endDate);
      setAuditLogs(filteredLogs);
    } catch (error) {
      console.error('Error filtering by date range:', error);
    }
  };

  const getEntityTypeColor = (entityType: AuditLog['entityType']) => {
    switch (entityType) {
      case 'partner': return 'bg-blue-100 text-blue-800';
      case 'waste_request': return 'bg-green-100 text-green-800';
      case 'subscription': return 'bg-purple-100 text-purple-800';
      case 'reward': return 'bg-yellow-100 text-yellow-800';
      case 'voucher': return 'bg-orange-100 text-orange-800';
      case 'notification': return 'bg-indigo-100 text-indigo-800';
      case 'schedule': return 'bg-pink-100 text-pink-800';
      case 'system': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getActionTypeColor = (actionType: AuditLog['actionType']) => {
    switch (actionType) {
      case 'create': return 'bg-green-100 text-green-800';
      case 'update': return 'bg-blue-100 text-blue-800';
      case 'delete': return 'bg-red-100 text-red-800';
      case 'verify': return 'bg-purple-100 text-purple-800';
      case 'assign': return 'bg-yellow-100 text-yellow-800';
      case 'override': return 'bg-orange-100 text-orange-800';
      case 'send': return 'bg-indigo-100 text-indigo-800';
      case 'login': return 'bg-teal-100 text-teal-800';
      case 'logout': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getEntityDisplayName = (log: AuditLog) => {
    switch (log.entityType) {
      case 'partner':
        const partner = partners.find(p => p.id === log.entityId);
        return partner ? partner.name : `Partner ${log.entityId.slice(-8)}`;
      case 'waste_request':
        const request = wasteRequests.find(r => r.id === log.entityId);
        return request ? `${request.type} (${request.location})` : `Request ${log.entityId.slice(-8)}`;
      default:
        return `${log.entityType} ${log.entityId.slice(-8)}`;
    }
  };

  const filteredLogs = auditLogs.filter(log => {
    const matchesEntityType = filterEntityType === 'all' || log.entityType === filterEntityType;
    const matchesActionType = filterActionType === 'all' || log.actionType === filterActionType;
    const matchesAdmin = filterAdmin === 'all' || log.adminId === filterAdmin;
    const matchesSearch = searchTerm === '' ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.adminName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      getEntityDisplayName(log).toLowerCase().includes(searchTerm.toLowerCase());

    return matchesEntityType && matchesActionType && matchesAdmin && matchesSearch;
  });

  const uniqueAdmins = [...new Set(auditLogs.map(log => log.adminId))];
  const adminOptions = uniqueAdmins.map(adminId => {
    const adminLog = auditLogs.find(log => log.adminId === adminId);
    return { id: adminId, name: adminLog?.adminName || 'Unknown Admin' };
  });

  // Mock audit logs for demonstration (in real app, these would be created by actual admin actions)
  const generateMockAuditLogs = () => {
    const mockLogs: AuditLog[] = [
      {
        id: 'audit-1',
        adminId: admin?.id || 'admin-1',
        adminName: admin?.name || 'Admin User',
        action: 'Partner Verification Approved',
        actionType: 'verify',
        details: 'Approved partner verification for Green Solutions Ltd with all required documents',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
        entityType: 'partner',
        entityId: partners[0]?.id || 'partner-1',
        metadata: {
          verificationStatus: 'verified',
          partnerId: partners[0]?.id || 'partner-1'
        }
      },
      {
        id: 'audit-2',
        adminId: admin?.id || 'admin-1',
        adminName: admin?.name || 'Admin User',
        action: 'Waste Request Assignment Override',
        actionType: 'override',
        details: 'Manually reassigned waste request from AI recommendation to different partner',
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
        entityType: 'waste_request',
        entityId: wasteRequests[0]?.id || 'request-1',
        previousValue: { assignedPartner: 'partner-ai' },
        newValue: { assignedPartner: 'partner-manual' },
        metadata: {
          assignmentOverride: true,
          wasteRequestId: wasteRequests[0]?.id || 'request-1'
        }
      },
      {
        id: 'audit-3',
        adminId: admin?.id || 'admin-1',
        adminName: admin?.name || 'Admin User',
        action: 'Subscription Plan Updated',
        actionType: 'update',
        details: 'Changed subscription plan from Monthly to Yearly for premium partner',
        timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6 hours ago
        entityType: 'subscription',
        entityId: 'sub-123',
        previousValue: { plan: 'monthly', amount: 50 },
        newValue: { plan: 'yearly', amount: 500 },
        metadata: {
          subscriptionId: 'sub-123',
          partnerId: partners[1]?.id || 'partner-2'
        }
      },
      {
        id: 'audit-4',
        adminId: admin?.id || 'admin-1',
        adminName: admin?.name || 'Admin User',
        action: 'Reward Points Awarded',
        actionType: 'create',
        details: 'Manually awarded bonus reward points for exceptional service',
        timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(), // 8 hours ago
        entityType: 'reward',
        entityId: 'reward-456',
        newValue: { points: 500, reason: 'Exceptional service bonus' },
        metadata: {
          rewardId: 'reward-456',
          partnerId: partners[2]?.id || 'partner-3'
        }
      },
      {
        id: 'audit-5',
        adminId: admin?.id || 'admin-1',
        adminName: admin?.name || 'Admin User',
        action: 'Voucher Redemption Processed',
        actionType: 'update',
        details: 'Processed voucher redemption request and updated inventory',
        timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(), // 12 hours ago
        entityType: 'voucher',
        entityId: 'voucher-789',
        previousValue: { status: 'assigned', currentRedemptions: 0 },
        newValue: { status: 'redeemed', currentRedemptions: 1 },
        metadata: {
          voucherId: 'voucher-789',
          partnerId: partners[3]?.id || 'partner-4'
        }
      }
    ];

    if (auditLogs.length === 0) {
      setAuditLogs(mockLogs);
    }
  };

  useEffect(() => {
    if (!loading && partners.length > 0 && wasteRequests.length > 0) {
      generateMockAuditLogs();
    }
  }, [loading, partners, wasteRequests]);

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
          <h2 className="text-2xl font-bold text-gray-900">📋 Audit Logs & Governance</h2>
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-600">
              Last updated: {lastRefresh.toLocaleTimeString()}
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-green-600">Live</span>
            </div>
            <button
              onClick={() => {
                loadData();
                setLastRefresh(new Date());
              }}
              className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
            >
              🔄 Refresh
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow border">
            <div className="text-2xl font-bold text-blue-600">{auditLogs.length}</div>
            <div className="text-sm text-gray-600">Total Audit Entries</div>
            <div className="text-xs text-gray-400 mt-1">
              {auditLogs.filter(log => {
                const logTime = new Date(log.timestamp);
                const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
                return logTime > oneHourAgo;
              }).length} in last hour
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border">
            <div className="text-2xl font-bold text-green-600">
              {auditLogs.filter(log => log.actionType === 'verify').length}
            </div>
            <div className="text-sm text-gray-600">Verification Actions</div>
            <div className="text-xs text-gray-400 mt-1">
              {auditLogs.filter(log => {
                const logTime = new Date(log.timestamp);
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                return logTime > today && log.actionType === 'verify';
              }).length} today
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border">
            <div className="text-2xl font-bold text-purple-600">
              {auditLogs.filter(log => log.actionType === 'update').length}
            </div>
            <div className="text-sm text-gray-600">Update Actions</div>
            <div className="text-xs text-gray-400 mt-1">
              {auditLogs.filter(log => {
                const logTime = new Date(log.timestamp);
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                return logTime > today && log.actionType === 'update';
              }).length} today
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border">
            <div className="text-2xl font-bold text-orange-600">
              {auditLogs.filter(log => log.actionType === 'override').length}
            </div>
            <div className="text-sm text-gray-600">Override Actions</div>
            <div className="text-xs text-gray-400 mt-1">
              {auditLogs.filter(log => {
                const logTime = new Date(log.timestamp);
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                return logTime > today && log.actionType === 'override';
              }).length} today
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border">
            <div className="text-2xl font-bold text-red-600">
              {auditLogs.filter(log => log.actionType === 'reject').length}
            </div>
            <div className="text-sm text-gray-600">Reject Actions</div>
            <div className="text-xs text-gray-400 mt-1">
              {auditLogs.filter(log => {
                const logTime = new Date(log.timestamp);
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                return logTime > today && log.actionType === 'reject';
              }).length} today
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
              <input
                type="text"
                placeholder="Search logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Entity Type</label>
              <select
                value={filterEntityType}
                onChange={(e) => setFilterEntityType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Entities</option>
                <option value="partner">Partner</option>
                <option value="waste_request">Waste Request</option>
                <option value="subscription">Subscription</option>
                <option value="reward">Reward</option>
                <option value="voucher">Voucher</option>
                <option value="notification">Notification</option>
                <option value="schedule">Schedule</option>
                <option value="system">System</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Action Type</label>
              <select
                value={filterActionType}
                onChange={(e) => setFilterActionType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Actions</option>
                <option value="create">Create</option>
                <option value="update">Update</option>
                <option value="delete">Delete</option>
                <option value="verify">Verify</option>
                <option value="assign">Assign</option>
                <option value="override">Override</option>
                <option value="send">Send</option>
                <option value="login">Login</option>
                <option value="logout">Logout</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Admin</label>
              <select
                value={filterAdmin}
                onChange={(e) => setFilterAdmin(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Admins</option>
                {adminOptions.map(adminOption => (
                  <option key={adminOption.id} value={adminOption.id}>
                    {adminOption.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-end space-x-2">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button
                onClick={handleDateRangeFilter}
                className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
              >
                Filter
              </button>
            </div>
          </div>
        </div>

        {/* Audit Logs Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Timestamp
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Admin
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Action
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Entity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredLogs.map(log => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {new Date(log.timestamp).toLocaleDateString()}
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </div>
                      <div className="text-xs text-gray-400">
                        {(() => {
                          const now = new Date();
                          const logTime = new Date(log.timestamp);
                          const diffMs = now.getTime() - logTime.getTime();
                          const diffMins = Math.floor(diffMs / 60000);
                          const diffHours = Math.floor(diffMs / 3600000);
                          
                          if (diffMins < 1) return 'Just now';
                          if (diffMins < 60) return `${diffMins}m ago`;
                          if (diffHours < 24) return `${diffHours}h ago`;
                          return `${Math.floor(diffHours / 24)}d ago`;
                        })()} 
                        {(() => {
                          const logTime = new Date(log.timestamp);
                          const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
                          return logTime > fiveMinutesAgo ? '🔴' : '';
                        })()} 
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{log.adminName}</div>
                      <div className="text-sm text-gray-500">{log.adminId.slice(-8)}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{log.action}</div>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full mt-1 ${getActionTypeColor(log.actionType)}`}>
                        {log.actionType}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{getEntityDisplayName(log)}</div>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full mt-1 ${getEntityTypeColor(log.entityType)}`}>
                        {log.entityType}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getActionTypeColor(log.actionType)}`}>
                        {log.actionType}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 truncate max-w-xs">{log.details}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredLogs.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No audit logs found matching your criteria.
            </div>
          )}
        </div>

        {/* Audit Log Details Modal */}
        {selectedLog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-gray-900">Audit Log Details</h3>
                  <button
                    onClick={() => setSelectedLog(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Basic Information */}
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Timestamp</label>
                      <p className="text-sm text-gray-900">
                        {new Date(selectedLog.timestamp).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Admin</label>
                      <p className="text-sm text-gray-900">{selectedLog.adminName}</p>
                      <p className="text-xs text-gray-500">ID: {selectedLog.adminId}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Action</label>
                      <p className="text-sm text-gray-900">{selectedLog.action}</p>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full mt-1 ${getActionTypeColor(selectedLog.actionType)}`}>
                        {selectedLog.actionType}
                      </span>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Entity</label>
                      <p className="text-sm text-gray-900">{getEntityDisplayName(selectedLog)}</p>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full mt-1 ${getEntityTypeColor(selectedLog.entityType)}`}>
                        {selectedLog.entityType}
                      </span>
                    </div>
                  </div>

                  {/* Details */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Details</label>
                    <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded">{selectedLog.details}</p>
                  </div>

                  {/* Previous/New Values */}
                  {(selectedLog.previousValue || selectedLog.newValue) && (
                    <div className="grid grid-cols-2 gap-6">
                      {selectedLog.previousValue && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Previous Value</label>
                          <pre className="text-xs text-gray-900 bg-red-50 p-3 rounded overflow-x-auto">
                            {JSON.stringify(selectedLog.previousValue, null, 2)}
                          </pre>
                        </div>
                      )}
                      {selectedLog.newValue && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">New Value</label>
                          <pre className="text-xs text-gray-900 bg-green-50 p-3 rounded overflow-x-auto">
                            {JSON.stringify(selectedLog.newValue, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Metadata */}
                  {selectedLog.metadata && Object.keys(selectedLog.metadata).length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Additional Metadata</label>
                      <pre className="text-xs text-gray-900 bg-blue-50 p-3 rounded overflow-x-auto">
                        {JSON.stringify(selectedLog.metadata, null, 2)}
                      </pre>
                    </div>
                  )}

                  {/* Technical Information */}
                  <div className="border-t pt-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Technical Information</h4>
                    <div className="grid grid-cols-2 gap-4 text-xs text-gray-600">
                      <div>
                        <span className="font-medium">Entity ID:</span> {selectedLog.entityId}
                      </div>
                      <div>
                        <span className="font-medium">Log ID:</span> {selectedLog.id}
                      </div>
                      {selectedLog.ipAddress && (
                        <div>
                          <span className="font-medium">IP Address:</span> {selectedLog.ipAddress}
                        </div>
                      )}
                      {selectedLog.userAgent && (
                        <div className="col-span-2">
                          <span className="font-medium">User Agent:</span> {selectedLog.userAgent}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end mt-6">
                  <button
                    onClick={() => setSelectedLog(null)}
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

export default AdminAuditPage;