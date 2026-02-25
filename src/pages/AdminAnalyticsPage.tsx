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
    // Calculate total waste processed and CO2 reduction from ACTUAL completed requests
    const completedRequests = wasteRequests.filter(r => r.status === 'Completed');
    const totalWasteProcessed = completedRequests.reduce((sum, r) => {
      const qty = r.quantity?.toString() || '0';
      const quantity = parseFloat(qty.replace(/[^0-9.]/g, '')) || 0;
      return sum + quantity;
    }, 0);

    const totalCO2Reduction = totalWasteProcessed * 2.5; // Demo calculation: 2.5kg CO2 per kg waste

    // Waste by type from actual data
    const wasteByType: Record<string, number> = {};
    completedRequests.forEach(request => {
      const qty = request.quantity?.toString() || '0';
      const quantity = parseFloat(qty.replace(/[^0-9.]/g, '')) || 0;
      const type = request.type || request.wasteType || 'Unknown';
      wasteByType[type] = (wasteByType[type] || 0) + quantity;
    });

    // Monthly trends - generate based on actual data up to current month
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth(); // 0-11 (0=Jan, 1=Feb, etc.)
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    const monthlyTrends = [];
    for (let i = 0; i <= currentMonth; i++) {
      const monthRequests = completedRequests.filter(r => {
        const requestDate = new Date(r.createdAt);
        return requestDate.getMonth() === i && requestDate.getFullYear() === currentDate.getFullYear();
      });
      
      const monthWaste = monthRequests.reduce((sum, r) => {
        const qty = r.quantity?.toString() || '0';
        const quantity = parseFloat(qty.replace(/[^0-9.]/g, '')) || 0;
        return sum + quantity;
      }, 0);
      
      monthlyTrends.push({
        month: monthNames[i],
        waste: monthWaste,
        co2: monthWaste * 2.5
      });
    }

    // Partner performance from actual data
    const partnerPerformance = partners
      .filter(p => p.verificationStatus === 'approved')
      .map(partner => {
        const partnerRequests = completedRequests.filter(r => r.partnerId === partner.id);
        const wasteProcessed = partnerRequests.reduce((sum, r) => {
          const qty = r.quantity?.toString() || '0';
          const quantity = parseFloat(qty.replace(/[^0-9.]/g, '')) || 0;
          return sum + quantity;
        }, 0);
        return {
          name: partner.name,
          wasteProcessed,
          rating: 5 // Default rating
        };
      })
      .sort((a, b) => b.wasteProcessed - a.wasteProcessed);

    console.log('📊 Analytics Debug:', {
      totalPartners: partners.length,
      approvedPartners: partners.filter(p => p.verificationStatus === 'approved').length,
      completedRequests: completedRequests.length,
      partnerPerformance: partnerPerformance.length,
      sampleRequest: completedRequests[0]
    });

    const analyticsData = {
      totalWasteProcessed,
      totalCO2Reduction,
      wasteByType,
      monthlyTrends,
      partnerPerformance,
    };

    setAnalytics(analyticsData);
  };

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Impact Analytics & Insights</h2>
          <div className="flex items-center space-x-2 bg-green-50 px-3 py-1 rounded-full border border-green-200">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-green-700 font-medium">Real-time Updates</span>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Total Waste Processed</h3>
            <p className="text-3xl font-bold text-green-600">{analytics.totalWasteProcessed.toFixed(1)} kg</p>
            <p className="text-sm text-gray-500">Equivalent to {Math.floor(analytics.totalWasteProcessed / 50)} large trash bags</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900 mb-2">CO₂ Reduction</h3>
            <p className="text-3xl font-bold text-blue-600">{analytics.totalCO2Reduction.toFixed(2)} kg</p>
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
          <h3 className="text-lg font-medium text-gray-900 mb-4">Monthly Trends (Year to Date)</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {analytics.monthlyTrends.map((month) => (
              <div key={month.month} className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-sm font-medium text-gray-700 mb-2">{month.month}</div>
                <div className="space-y-1">
                  <div className="text-xs text-green-600 font-semibold">Waste: {month.waste.toFixed(1)}kg</div>
                  <div className="text-xs text-blue-600 font-semibold">CO₂: {month.co2.toFixed(2)}kg</div>
                </div>
              </div>
            ))}
          </div>
          {analytics.monthlyTrends.length === 0 && (
            <p className="text-center text-gray-500 py-4">No data available yet</p>
          )}
        </div>

        {/* Partner Performance */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Partner Performance</h3>
          {analytics.partnerPerformance.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No partner performance data available yet.</p>
              <p className="text-sm mt-2">Partners will appear here once they complete waste collections.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rank
                    </th>
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
                    <tr key={index} className={index < 3 ? 'bg-yellow-50' : ''}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                        {index === 0 && '🥇'}
                        {index === 1 && '🥈'}
                        {index === 2 && '🥉'}
                        {index > 2 && `#${index + 1}`}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {partner.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span className="font-semibold text-green-600">{partner.wasteProcessed.toFixed(1)} kg</span>
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
          )}
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
                Current operations prevent approximately {analytics.totalCO2Reduction.toFixed(2)}kg of CO₂ emissions monthly.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminAnalyticsPage;

