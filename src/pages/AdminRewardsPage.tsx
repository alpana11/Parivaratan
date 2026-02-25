import React, { useState, useEffect } from 'react';
import { dbService } from '../services/dbService';
import { Partner, RewardRule, RewardTransaction } from '../types';

const AdminRewardsPage: React.FC = () => {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [rewardRules, setRewardRules] = useState<RewardRule[]>([]);
  const [rewardTransactions, setRewardTransactions] = useState<RewardTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'rules' | 'summary'>('summary');
  const [showRuleModal, setShowRuleModal] = useState(false);
  const [selectedRule, setSelectedRule] = useState<RewardRule | null>(null);
  const [newRule, setNewRule] = useState<Partial<RewardRule>>({
    wasteType: '',
    pointsPerKg: 0,
    isActive: true
  });

  useEffect(() => {
    // Set up real-time listener for partners
    const unsubscribePartners = dbService.subscribeToPartners((partnersList) => {
      setPartners(partnersList);
      setLoading(false);
    });

    // Set up real-time listener for reward rules
    const unsubscribeRewardRules = dbService.listenToRewardRules((rules) => {
      setRewardRules(rules);
    });

    // Set up real-time listener for reward transactions (admin - all transactions)
    const unsubscribeRewardTransactions = dbService.subscribeToRewardTransactions((transactions) => {
      setRewardTransactions(transactions);
    });

    return () => {
      unsubscribePartners();
      unsubscribeRewardRules();
      unsubscribeRewardTransactions();
    };
  }, []);

  const calculateTotalPointsIssued = () => {
    return rewardTransactions
      .filter(t => t.type === 'earned')
      .reduce((sum, t) => sum + t.points, 0);
  };

  const calculatePartnerRewards = () => {
    return partners.map(partner => {
      const partnerTransactions = rewardTransactions.filter(t => t.partnerId === partner.id);
      const earned = partnerTransactions
        .filter(t => t.type === 'earned')
        .reduce((sum, t) => sum + t.points, 0);
      const redeemed = partnerTransactions
        .filter(t => t.type === 'redeemed')
        .reduce((sum, t) => sum + t.points, 0);

      return {
        ...partner,
        totalEarned: earned,
        totalRedeemed: redeemed,
        currentBalance: earned - redeemed,
        transactionCount: partnerTransactions.length
      };
    }).sort((a, b) => b.totalEarned - a.totalEarned);
  };

  const handleCreateRule = async () => {
    if (!newRule.wasteType || !newRule.pointsPerKg) return;

    const rule: RewardRule = {
      id: `rule-${Date.now()}`,
      wasteType: newRule.wasteType,
      pointsPerKg: newRule.pointsPerKg,
      isActive: newRule.isActive ?? true,
      createdAt: new Date().toISOString()
    };

    try {
      await dbService.storeRewardRule(rule);
      setNewRule({ wasteType: '', pointsPerKg: 0, isActive: true });
      setShowRuleModal(false);
    } catch (error) {
      console.error('Error creating reward rule:', error);
      alert('Failed to create reward rule');
    }
  };

  const handleUpdateRule = async (ruleId: string, updates: Partial<RewardRule>) => {
    try {
      await dbService.updateRewardRule(ruleId, updates);
    } catch (error) {
      console.error('Error updating reward rule:', error);
    }
  };



  const simulateRewardIssuance = (wasteType: string, quantity: number) => {
    const rule = rewardRules.find(r => r.wasteType === wasteType && r.isActive);
    if (!rule) return 0;
    return Math.round(rule.pointsPerKg * quantity);
  };

  const partnerRewards = calculatePartnerRewards();
  const totalPointsIssued = calculateTotalPointsIssued();

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
          <h2 className="text-2xl font-bold text-gray-900">🎁 Rewards Management</h2>
          <div className="flex items-center space-x-3">
            <div className="text-sm text-green-600 bg-green-50 px-3 py-1 rounded-full border border-green-200 flex items-center">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
              Real-time Updates
            </div>
            <button
              onClick={() => setShowRuleModal(true)}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              + Add Rule
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Points Issued</p>
                <p className="text-2xl font-bold text-blue-600">{totalPointsIssued.toLocaleString()}</p>
              </div>
              <div className="text-blue-500 text-2xl">⭐</div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Rules</p>
                <p className="text-2xl font-bold text-green-600">{rewardRules.filter(r => r.isActive).length}</p>
              </div>
              <div className="text-green-500 text-2xl">📋</div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {[
                { id: 'summary', label: 'Summary', icon: '📊' },
                { id: 'rules', label: 'Reward Rules', icon: '📋' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'summary' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Reward Calculator</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {rewardRules.filter(r => r.isActive).map((rule) => (
                  <div key={rule.id} className="border border-gray-200 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-2">{rule.wasteType}</h4>
                    <div className="text-sm text-gray-600 space-y-1">
                      <div>Base: {rule.pointsPerKg} points/kg</div>
                      <div>5kg sample: {simulateRewardIssuance(rule.wasteType, 5)} points</div>
                      <div>10kg sample: {simulateRewardIssuance(rule.wasteType, 10)} points</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Today's Transactions</h3>
              <div className="space-y-3">
                {(() => {
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  const todayTransactions = rewardTransactions.filter(t => {
                    const txDate = new Date(t.date);
                    txDate.setHours(0, 0, 0, 0);
                    return txDate.getTime() === today.getTime();
                  }).slice(0, 10);

                  if (todayTransactions.length === 0) {
                    return (
                      <div className="text-center py-8 text-gray-500">
                        <p className="text-lg mb-2">📝</p>
                        <p>No transactions today</p>
                      </div>
                    );
                  }

                  return todayTransactions.map((transaction) => {
                    const partner = partners.find(p => p.id === transaction.partnerId);
                    return (
                      <div key={transaction.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                            transaction.type === 'earned' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {transaction.type === 'earned' ? '+' : '-'}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {partner?.name || 'Unknown Partner'}
                            </p>
                            <p className="text-xs text-gray-600">{transaction.description}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`text-sm font-bold ${
                            transaction.type === 'earned' ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {transaction.type === 'earned' ? '+' : '-'}{transaction.points} points
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(transaction.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'rules' && (
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Reward Rules Configuration</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {rewardRules.map((rule) => (
                  <div key={rule.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-gray-900">{rule.wasteType}</h4>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={rule.isActive}
                          onChange={(e) => handleUpdateRule(rule.id, { isActive: e.target.checked })}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm text-gray-600">Active</span>
                      </label>
                    </div>
                    <div className="space-y-2">
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Points per kg</label>
                        <input
                          type="number"
                          value={rule.pointsPerKg}
                          onChange={(e) => handleUpdateRule(rule.id, { pointsPerKg: Number(e.target.value) })}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                      <div className="text-xs text-gray-500">
                        Sample: 5kg = {simulateRewardIssuance(rule.wasteType, 5)} points
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}



        {activeTab === 'partners' && (
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Partner Rewards Summary</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Partner
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total Earned
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total Redeemed
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Current Balance
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Transactions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {partnerRewards.map((partner) => (
                      <tr key={partner.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-green-500 rounded-full flex items-center justify-center">
                              <span className="text-white font-bold text-sm">
                                {partner.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{partner.name}</div>
                              <div className="text-sm text-gray-500">{partner.organization}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium">
                          +{partner.totalEarned.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-medium">
                          -{partner.totalRedeemed.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-blue-600">
                          {partner.currentBalance.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {partner.transactionCount}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Create Rule Modal */}
        {showRuleModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl max-w-md w-full mx-4">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-gray-900">Create Reward Rule</h3>
                  <button
                    onClick={() => setShowRuleModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Waste Type</label>
                    <input
                      type="text"
                      value={newRule.wasteType}
                      onChange={(e) => setNewRule({ ...newRule, wasteType: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., Plastic, Paper, Glass"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Points per kg</label>
                    <input
                      type="number"
                      value={newRule.pointsPerKg}
                      onChange={(e) => setNewRule({ ...newRule, pointsPerKg: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="10"
                    />
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={newRule.isActive}
                      onChange={(e) => setNewRule({ ...newRule, isActive: e.target.checked })}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <label className="ml-2 text-sm text-gray-700">Active</label>
                  </div>
                </div>
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    onClick={() => setShowRuleModal(false)}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateRule}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    Create Rule
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

export default AdminRewardsPage;