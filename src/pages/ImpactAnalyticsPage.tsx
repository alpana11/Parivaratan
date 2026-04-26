import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart
} from 'recharts';
import { useWasteRequests, useImpactMetrics } from '../hooks/useData';

const ImpactAnalyticsPage: React.FC = () => {
  const { requests, streamActive: pathwayStreamActive, updateCount: pathwayUpdateCount } = useWasteRequests();
  const { metrics } = useImpactMetrics();

  const completedRequests = requests.filter(req => (req.status || '').toLowerCase() === 'completed');
  const wasteByType = completedRequests.reduce((acc, req) => {
    const wasteType = req.type || 'Unknown';
    const quantity = parseInt(req.quantity || '0');
    acc[wasteType] = (acc[wasteType] || 0) + quantity;
    return acc;
  }, {} as Record<string, number>);

  console.log('📊 WASTE DISTRIBUTION DEBUG:', {
    totalRequests: requests.length,
    completedRequests: completedRequests.length,
    wasteByType,
    sampleRequest: completedRequests[0]
  });

  // Calculate monthly data from real requests
  const monthlyData = React.useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentMonth = new Date().getMonth();
    const last3Months = [currentMonth - 2, currentMonth - 1, currentMonth].map(m => m < 0 ? m + 12 : m);
    
    return last3Months.map(monthIndex => {
      const monthRequests = completedRequests.filter(req => {
        const reqMonth = new Date(req.date).getMonth();
        return reqMonth === monthIndex;
      });
      
      const waste = monthRequests.reduce((sum, req) => sum + parseInt(req.quantity || '0'), 0);
      const co2 = Math.round(waste * 0.3); // 30% CO2 reduction ratio
      
      return {
        month: months[monthIndex],
        waste,
        co2,
        requests: monthRequests.length
      };
    });
  }, [completedRequests]);

  // Prepare data for pie chart
  const pieData = (Object.entries(wasteByType) as [string, number][]).map(([type, amount]) => ({
    name: type,
    value: amount,
    percentage: metrics.wasteProcessed > 0 ? Math.round((amount / metrics.wasteProcessed) * 100) : 0
  }));

  console.log('🥧 PIE CHART DATA:', pieData);

  const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#8B5CF6', '#EF4444', '#06B6D4'];

  // Prepare data for bar chart
  const barData = monthlyData.map(data => ({
    month: data.month,
    waste: data.waste,
    co2: data.co2,
    requests: data.requests
  }));

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Impact & Analytics</h1>
            <p className="text-gray-600">Track your environmental contribution and performance metrics</p>
          </div>
          {pathwayStreamActive && (
            <div className="flex items-center space-x-2 bg-green-50 px-3 py-1 rounded-full border border-green-200">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              <span className="text-xs text-green-700 font-medium">Pathway Live • {pathwayUpdateCount}</span>
            </div>
          )}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Waste Processed</p>
              <p className="text-2xl font-bold text-gray-900">{metrics.wasteProcessed}kg</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">CO₂ Reduced</p>
              <p className="text-2xl font-bold text-gray-900">{metrics.co2Reduction}kg</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Completion Rate</p>
              <p className="text-2xl font-bold text-gray-900">
                {requests.length > 0 ? Math.round((completedRequests.length / requests.length) * 100) : 0}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Waste Distribution Pie Chart */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Waste Distribution by Type</h2>
            <div className="flex items-center space-x-2">
              {pathwayStreamActive && (
                <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full flex items-center">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse mr-1"></span>
                  Live
                </span>
              )}
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                {pieData.length} types
              </span>
            </div>
          </div>
          <div className="h-80">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%" key={pathwayUpdateCount}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(1)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    animationDuration={800}
                  >
                    {pieData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value}kg`, 'Waste']} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">
                <div className="text-center">
                  <svg className="mx-auto h-12 w-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <p className="text-sm">No completed pickups yet</p>
                  <p className="text-xs mt-1">Complete waste requests to see distribution</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Monthly Performance Bar Chart */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Monthly Performance Trends</h2>
            {pathwayStreamActive && (
              <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full flex items-center">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse mr-1"></span>
                Live
              </span>
            )}
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="waste" fill="#10B981" name="Waste (kg)" />
                <Bar dataKey="co2" fill="#3B82F6" name="CO₂ Saved (kg)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Additional Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Requests Trend Line Chart */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Request Completion Trend</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="requests"
                  stroke="#8B5CF6"
                  strokeWidth={3}
                  name="Completed Requests"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Environmental Impact Area Chart */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Environmental Impact Growth</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="co2"
                  stackId="1"
                  stroke="#06B6D4"
                  fill="#06B6D4"
                  fillOpacity={0.6}
                  name="CO₂ Reduction (kg)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Performance Insights */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Performance Insights</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="border-l-4 border-green-500 pl-4">
            <h3 className="font-medium text-gray-900">Top Performing Category</h3>
            <p className="text-sm text-gray-600 mt-1">
              {(Object.entries(wasteByType) as [string, number][]).sort(([,a], [,b]) => b - a)[0]?.[0] || 'N/A'} with highest waste collection
            </p>
          </div>
          <div className="border-l-4 border-blue-500 pl-4">
            <h3 className="font-medium text-gray-900">Environmental Impact</h3>
            <p className="text-sm text-gray-600 mt-1">
              Your efforts have prevented {monthlyData[monthlyData.length - 1]?.co2 || 0}kg of CO₂ emissions this month
            </p>
          </div>
          <div className="border-l-4 border-yellow-500 pl-4">
            <h3 className="font-medium text-gray-900">Total Requests</h3>
            <p className="text-sm text-gray-600 mt-1">
              {completedRequests.length} completed out of {requests.length} total requests
            </p>
          </div>
          <div className="border-l-4 border-purple-500 pl-4">
            <h3 className="font-medium text-gray-900">Efficiency Score</h3>
            <p className="text-sm text-gray-600 mt-1">
              {requests.length > 0 ? Math.round((completedRequests.length / requests.length) * 100) : 0}% of assigned requests completed
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImpactAnalyticsPage;