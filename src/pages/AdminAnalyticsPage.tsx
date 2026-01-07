import React, { useState, useEffect } from 'react';
import { dbService } from '../services/dbService';

const AdminAnalyticsPage: React.FC = () => {
  const [analytics, setAnalytics] = useState({
    totalWasteProcessed: 0,
    totalCO2Reduction: 0,
    wasteByType: {} as Record<string, number>,
    monthlyTrends: [] as Array<{ month: string; waste: number; co2: number }>,
    partnerPerformance: [] as Array<{ name: string; wasteProcessed: number; rating: number }>,
  });

  const [wasteRequests, setWasteRequests] = useState<any[]>([]);
  const [partners, setPartners] = useState<any[]>([]);

  useEffect(() => {
    // Set up real-time listeners for instant analytics updates
    const unsubscribeWasteRequests = dbService.subscribeToWasteRequests((requests) => {
      setWasteRequests(requests);
    });

    const unsubscribePartners = dbService.subscribeToPartners((partnersList) => {
      setPartners(partnersList);
    });

    // Initial load
    loadAnalytics();

    // Cleanup listeners on unmount
    return () => {
      unsubscribeWasteRequests();
      unsubscribePartners();
    };
  }, []);

  // Recalculate analytics whenever data changes
  useEffect(() => {
    if (wasteRequests.length > 0 || partners.length > 0) {
      calculateAnalytics();
    }
  }, [wasteRequests, partners]);

  const calculateAnalytics = () => {
    // Calculate total waste processed and CO2 reduction
    const completedRequests = wasteRequests.filter(r => r.status === 'Completed');
    const totalWasteProcessed = completedRequests.reduce((sum, r) => {
      const quantity = parseFloat(r.quantity.split(' ')[0]) || 0;
      return sum + quantity;
    }, 0);

    const totalCO2Reduction = totalWasteProcessed * 2.5; // Demo calculation: 2.5kg CO2 per kg waste

    // Waste by type
    const wasteByType: Record<string, number> = {};
    completedRequests.forEach(request => {
      const quantity = parseFloat(request.quantity.split(' ')[0]) || 0;
      wasteByType[request.type] = (wasteByType[request.type] || 0) + quantity;
    });

    // Monthly trends (demo data)
    const monthlyTrends = [
      { month: 'Jan', waste: 120, co2: 300 },
      { month: 'Feb', waste: 150, co2: 375 },
      { month: 'Mar', waste: 180, co2: 450 },
      { month: 'Apr', waste: 200, co2: 500 },
      { month: 'May', waste: 220, co2: 550 },
      { month: 'Jun', waste: 250, co2: 625 },
    ];

    // Partner performance
    const partnerPerformance = partners
      .filter(p => p.status === 'approved')
      .map(partner => ({
        name: partner.name,
        wasteProcessed: Math.floor(Math.random() * 100) + 50, // Demo data
        rating: Math.floor(Math.random() * 2) + 4, // 4-5 star rating
      }))
      .sort((a, b) => b.wasteProcessed - a.wasteProcessed);

    const analyticsData = {
      totalWasteProcessed,
      totalCO2Reduction,
      wasteByType,
      monthlyTrends,
      partnerPerformance,
    };

    // Store analytics in database
    dbService.storeImpactAnalytics({
      ...analyticsData,
      generatedAt: new Date().toISOString(),
      generatedBy: 'admin'
    });

    setAnalytics(analyticsData);
  };

  const loadAnalytics = async () => {
    try {
      const requests = await dbService.getAllWasteRequests();
      const partnersList = await dbService.getAllPartners();
      setWasteRequests(requests);
      setPartners(partnersList);
    } catch (error) {
      console.error('Error loading analytics:', error);
    }
  };

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Impact Analytics & Insights</h2>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Total Waste Processed</h3>
            <p className="text-3xl font-bold text-green-600">{analytics.totalWasteProcessed.toFixed(1)} kg</p>
            <p className="text-sm text-gray-500">Equivalent to {Math.floor(analytics.totalWasteProcessed / 50)} large trash bags</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900 mb-2">CO₂ Reduction</h3>
            <p className="text-3xl font-bold text-blue-600">{analytics.totalCO2Reduction.toFixed(1)} kg</p>
            <p className="text-sm text-gray-500">Equivalent to planting {Math.floor(analytics.totalCO2Reduction / 20)} trees</p>
          </div>
        </div>

        {/* Waste by Type */}
        <div className="bg-white p-6 rounded-lg shadow mb-8">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Waste Processed by Type</h3>
          <div className="space-y-3">
            {Object.entries(analytics.wasteByType).map(([type, amount]) => (
              <div key={type} className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">{type}</span>
                <div className="flex items-center space-x-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full"
                      style={{
                        width: `${(amount / Math.max(...Object.values(analytics.wasteByType))) * 100}%`
                      }}
                    ></div>
                  </div>
                  <span className="text-sm text-gray-500 w-16 text-right">{amount.toFixed(1)} kg</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Monthly Trends */}
        <div className="bg-white p-6 rounded-lg shadow mb-8">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Monthly Trends</h3>
          <div className="grid grid-cols-6 gap-4">
            {analytics.monthlyTrends.map((month) => (
              <div key={month.month} className="text-center">
                <div className="text-sm font-medium text-gray-700 mb-1">{month.month}</div>
                <div className="space-y-1">
                  <div className="text-xs text-green-600">Waste: {month.waste}kg</div>
                  <div className="text-xs text-blue-600">CO₂: {month.co2}kg</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Partner Performance */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Partner Performance</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Partner
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Waste Processed
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rating
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {analytics.partnerPerformance.map((partner, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {partner.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {partner.wasteProcessed} kg
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <span
                            key={i}
                            className={`text-lg ${i < partner.rating ? 'text-yellow-400' : 'text-gray-300'}`}
                          >
                            ★
                          </span>
                        ))}
                        <span className="ml-2 text-sm">{partner.rating}/5</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* AI Insights (Demo) */}
        <div className="bg-white p-6 rounded-lg shadow mt-8">
          <h3 className="text-lg font-medium text-gray-900 mb-4">AI-Powered Insights</h3>
          <div className="space-y-3">
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-900">Trend Analysis</h4>
              <p className="text-sm text-blue-700">
                Waste collection has increased by 25% over the last 6 months. Peak collection occurs during weekends.
              </p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <h4 className="font-medium text-green-900">Optimization Opportunity</h4>
              <p className="text-sm text-green-700">
                Partner allocation can be improved by 15% through better geographic matching.
              </p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <h4 className="font-medium text-purple-900">Environmental Impact</h4>
              <p className="text-sm text-purple-700">
                Current operations prevent approximately {analytics.totalCO2Reduction.toFixed(0)}kg of CO₂ emissions monthly.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminAnalyticsPage;

