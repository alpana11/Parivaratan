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
  const { requests } = useWasteRequests();
  const { metrics } = useImpactMetrics();

  const completedRequests = requests.filter(req => req.status === 'Completed');
  const wasteByType = completedRequests.reduce((acc, req) => {
    acc[req.type] = (acc[req.type] || 0) + parseInt(req.quantity);
    return acc;
  }, {} as Record<string, number>);

  const monthlyData = [
    { month: 'Oct', waste: 120, co2: 36, requests: 45 },
    { month: 'Nov', waste: 180, co2: 54, requests: 67 },
    { month: 'Dec', waste: 250, co2: 75, requests: 89 },
  ];

  // Prepare data for pie chart
  const pieData = (Object.entries(wasteByType) as [string, number][]).map(([type, amount]) => ({
    name: type,
    value: amount,
    percentage: metrics.wasteProcessed > 0 ? Math.round((amount / metrics.wasteProcessed) * 100) : 0
  }));

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
        <h1 className="text-2xl font-bold text-gray-900">Impact & Analytics</h1>
        <p className="text-gray-600">Track your environmental contribution and performance metrics</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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
            <div className="p-2 bg-yellow-100 rounded-lg">
              <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Avg. Confidence</p>
              <p className="text-2xl font-bold text-gray-900">
                {Math.round(completedRequests.reduce((sum, req) => sum + req.confidence, 0) / completedRequests.length)}%
              </p>
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
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Waste Distribution by Type</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${percent}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value}kg`, 'Waste']} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Monthly Performance Bar Chart */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Monthly Performance Trends</h2>
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
              Your efforts have prevented 0kg of CO₂ emissions this month
            </p>
          </div>
          <div className="border-l-4 border-yellow-500 pl-4">
            <h3 className="font-medium text-gray-900">AI Accuracy</h3>
            <p className="text-sm text-gray-600 mt-1">
              Average AI classification confidence: {Math.round(completedRequests.reduce((sum, req) => sum + req.confidence, 0) / completedRequests.length)}%
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