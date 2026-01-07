import React, { useState, useEffect } from 'react';
import { dbService } from '../services/dbService';
import { Partner, SubscriptionPlan, PartnerSubscription, SubscriptionStatus } from '../types';

const AdminSubscriptionsPage: React.FC = () => {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [subscriptionPlans, setSubscriptionPlans] = useState<SubscriptionPlan[]>([
    {
      id: 'basic-monthly',
      name: 'Basic Monthly',
      amount: 99,
      duration: 'monthly',
      features: ['Waste collection requests', 'Basic analytics', 'Email support'],
      isActive: true
    },
    {
      id: 'premium-monthly',
      name: 'Premium Monthly',
      amount: 199,
      duration: 'monthly',
      features: ['All Basic features', 'Advanced analytics', 'Priority support', 'Custom branding'],
      isActive: true
    },
    {
      id: 'basic-yearly',
      name: 'Basic Yearly',
      amount: 999,
      duration: 'yearly',
      features: ['Waste collection requests', 'Basic analytics', 'Email support', '2 months free'],
      isActive: true
    },
    {
      id: 'premium-yearly',
      name: 'Premium Yearly',
      amount: 1999,
      duration: 'yearly',
      features: ['All Basic features', 'Advanced analytics', 'Priority support', 'Custom branding', '2 months free'],
      isActive: true
    }
  ]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'active' | 'expired' | 'none'>('all');
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [newPlan, setNewPlan] = useState<Partial<SubscriptionPlan>>({
    name: '',
    amount: 0,
    duration: 'monthly',
    features: [],
    isActive: true
  });

  useEffect(() => {
    // Set up real-time listener for partners
    const unsubscribe = dbService.subscribeToPartners((partnersList) => {
      setPartners(partnersList);
      setLoading(false);
    });

    // Initial load
    loadPartners();

    // Cleanup listener on unmount
    return () => unsubscribe();
  }, []);

  const loadPartners = async () => {
    try {
      const allPartners = await dbService.getAllPartners();
      setPartners(allPartners);
    } catch (error) {
      console.error('Error loading partners:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSubscriptionStatusColor = (status: SubscriptionStatus) => {
    switch (status) {
      case 'none': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'active': return 'bg-green-100 text-green-800 border-green-200';
      case 'expired': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getSubscriptionStatusLabel = (status: SubscriptionStatus) => {
    switch (status) {
      case 'none': return 'No Subscription';
      case 'pending': return 'Pending Activation';
      case 'active': return 'Active';
      case 'expired': return 'Expired';
      default: return status;
    }
  };

  const calculateRevenue = () => {
    const activeSubscriptions = partners.filter(p =>
      p.subscription?.status === 'active'
    );

    const monthlyRevenue = activeSubscriptions
      .filter(p => p.subscription?.planId?.includes('monthly'))
      .reduce((sum, p) => sum + (p.subscription?.amount || 0), 0);

    const yearlyRevenue = activeSubscriptions
      .filter(p => p.subscription?.planId?.includes('yearly'))
      .reduce((sum, p) => sum + (p.subscription?.amount || 0), 0);

    return {
      monthly: monthlyRevenue,
      yearly: yearlyRevenue,
      total: monthlyRevenue + yearlyRevenue,
      activeSubscriptions: activeSubscriptions.length
    };
  };

  const handleCreatePlan = () => {
    if (!newPlan.name || !newPlan.amount) return;

    const plan: SubscriptionPlan = {
      id: `custom-${Date.now()}`,
      name: newPlan.name,
      amount: newPlan.amount,
      duration: newPlan.duration || 'monthly',
      features: newPlan.features || [],
      isActive: newPlan.isActive ?? true
    };

    setSubscriptionPlans([...subscriptionPlans, plan]);
    setNewPlan({ name: '', amount: 0, duration: 'monthly', features: [], isActive: true });
    setShowPlanModal(false);
  };

  const handleActivateSubscription = async (partner: Partner, plan: SubscriptionPlan) => {
    // Only allow activation if partner is verified
    if (partner.status !== 'verified' && partner.status !== 'active') {
      alert('Partner must be verified before subscription activation');
      return;
    }

    const startDate = new Date().toISOString();
    const expiryDate = plan.duration === 'yearly'
      ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    const subscription: PartnerSubscription = {
      planId: plan.id,
      status: 'active',
      startDate,
      expiryDate,
      amount: plan.amount
    };

    try {
      await dbService.updatePartner(partner.id, {
        subscription,
        status: 'active' // Also update partner status to active
      });

      setPartners(partners.map(p =>
        p.id === partner.id
          ? { ...p, subscription, status: 'active' }
          : p
      ));

      setShowSubscriptionModal(false);
      setSelectedPartner(null);
      setSelectedPlan(null);
    } catch (error) {
      console.error('Error activating subscription:', error);
    }
  };

  const handleDeactivateSubscription = async (partnerId: string) => {
    try {
      const partner = partners.find(p => p.id === partnerId);
      if (!partner?.subscription) return;

      const updatedSubscription = {
        ...partner.subscription,
        status: 'expired' as SubscriptionStatus
      };

      await dbService.updatePartner(partnerId, {
        subscription: updatedSubscription,
        status: 'inactive' // Also update partner status
      });

      setPartners(partners.map(p =>
        p.id === partnerId
          ? { ...p, subscription: updatedSubscription, status: 'inactive' }
          : p
      ));
    } catch (error) {
      console.error('Error deactivating subscription:', error);
    }
  };

  const filteredPartners = partners.filter(p => {
    const subStatus = p.subscription?.status || 'none';
    if (filter === 'all') return true;
    return subStatus === filter;
  });

  const revenue = calculateRevenue();

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
          <h2 className="text-2xl font-bold text-gray-900">💳 Subscription Management</h2>
          <button
            onClick={() => setShowPlanModal(true)}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            + Create Plan
          </button>
        </div>

        {/* Revenue Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Monthly Revenue</p>
                <p className="text-2xl font-bold text-green-600">₹{revenue.monthly}</p>
              </div>
              <div className="text-green-500 text-2xl">📈</div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Yearly Revenue</p>
                <p className="text-2xl font-bold text-blue-600">₹{revenue.yearly}</p>
              </div>
              <div className="text-blue-500 text-2xl">📊</div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-purple-600">₹{revenue.total}</p>
              </div>
              <div className="text-purple-500 text-2xl">💰</div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Subscriptions</p>
                <p className="text-2xl font-bold text-indigo-600">{revenue.activeSubscriptions}</p>
              </div>
              <div className="text-indigo-500 text-2xl">👥</div>
            </div>
          </div>
        </div>

        {/* Subscription Plans */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Subscription Plans</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {subscriptionPlans.filter(plan => plan.isActive).map((plan) => (
              <div key={plan.id} className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
                <div className="text-center mb-4">
                  <h4 className="text-lg font-bold text-gray-900">{plan.name}</h4>
                  <div className="text-3xl font-bold text-green-600 mt-2">
                    ₹{plan.amount}
                    <span className="text-sm text-gray-500">/{plan.duration}</span>
                  </div>
                </div>
                <ul className="text-sm text-gray-600 space-y-1 mb-4">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center">
                      <span className="text-green-500 mr-2">✓</span>
                      {feature}
                    </li>
                  ))}
                </ul>
                <div className="text-xs text-gray-500 text-center">
                  {partners.filter(p => p.subscription?.planId === plan.id && p.subscription?.status === 'active').length} active subscribers
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Partner Subscriptions */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-2 mb-4">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                filter === 'all'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All ({partners.length})
            </button>
            <button
              onClick={() => setFilter('none')}
              className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                filter === 'none'
                  ? 'bg-gray-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              No Subscription ({partners.filter(p => !p.subscription || p.subscription.status === 'none').length})
            </button>
            <button
              onClick={() => setFilter('pending')}
              className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                filter === 'pending'
                  ? 'bg-yellow-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Pending ({partners.filter(p => p.subscription?.status === 'pending').length})
            </button>
            <button
              onClick={() => setFilter('active')}
              className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                filter === 'active'
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Active ({partners.filter(p => p.subscription?.status === 'active').length})
            </button>
            <button
              onClick={() => setFilter('expired')}
              className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                filter === 'expired'
                  ? 'bg-red-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Expired ({partners.filter(p => p.subscription?.status === 'expired').length})
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredPartners.map((partner) => {
            const subscription = partner.subscription;
            const plan = subscription ? subscriptionPlans.find(p => p.id === subscription.planId) : null;
            const isVerified = partner.status === 'verified' || partner.status === 'active';

            return (
              <div key={partner.id} className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-green-500 rounded-full flex items-center justify-center">
                          <span className="text-white font-bold text-sm">
                            {partner.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-gray-900">{partner.name}</h3>
                          <p className="text-sm text-gray-600">{partner.organization}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 mb-3">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getSubscriptionStatusColor(subscription?.status || 'none')}`}>
                          {getSubscriptionStatusLabel(subscription?.status || 'none')}
                        </span>
                        {!isVerified && (
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full border bg-orange-100 text-orange-800 border-orange-200">
                            Verification Required
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {subscription && plan ? (
                    <div className="bg-gray-50 p-4 rounded-lg mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-900">{plan.name}</span>
                        <span className="text-lg font-bold text-green-600">₹{subscription.amount}</span>
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        <div>Duration: {plan.duration}</div>
                        <div>Started: {new Date(subscription.startDate).toLocaleDateString()}</div>
                        <div>Expires: {new Date(subscription.expiryDate).toLocaleDateString()}</div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-gray-50 p-4 rounded-lg mb-4 text-center">
                      <p className="text-gray-500">No active subscription</p>
                    </div>
                  )}

                  <div className="flex space-x-2">
                    {!subscription || subscription.status !== 'active' ? (
                      <button
                        onClick={() => {
                          if (!isVerified) {
                            alert('Partner must be verified before subscription activation');
                            return;
                          }
                          setSelectedPartner(partner);
                          setShowSubscriptionModal(true);
                        }}
                        className={`flex-1 px-3 py-2 text-sm rounded-lg transition-colors ${
                          isVerified
                            ? 'bg-green-500 text-white hover:bg-green-600'
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }`}
                        disabled={!isVerified}
                      >
                        {isVerified ? 'Activate Subscription' : 'Verification Required'}
                      </button>
                    ) : (
                      <button
                        onClick={() => handleDeactivateSubscription(partner.id)}
                        className="flex-1 px-3 py-2 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                      >
                        Deactivate
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filteredPartners.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-lg mb-2">💳</div>
            <p className="text-gray-500">No partners found with the selected subscription status.</p>
          </div>
        )}

        {/* Create Plan Modal */}
        {showPlanModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl max-w-md w-full mx-4">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-gray-900">Create Subscription Plan</h3>
                  <button
                    onClick={() => setShowPlanModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Plan Name</label>
                    <input
                      type="text"
                      value={newPlan.name}
                      onChange={(e) => setNewPlan({ ...newPlan, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., Premium Monthly"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₹)</label>
                    <input
                      type="number"
                      value={newPlan.amount}
                      onChange={(e) => setNewPlan({ ...newPlan, amount: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="99"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
                    <select
                      value={newPlan.duration}
                      onChange={(e) => setNewPlan({ ...newPlan, duration: e.target.value as 'monthly' | 'yearly' })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="monthly">Monthly</option>
                      <option value="yearly">Yearly</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Features (one per line)</label>
                    <textarea
                      value={newPlan.features?.join('\n')}
                      onChange={(e) => setNewPlan({ ...newPlan, features: e.target.value.split('\n').filter(f => f.trim()) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={4}
                      placeholder="Waste collection requests&#10;Basic analytics&#10;Email support"
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    onClick={() => setShowPlanModal(false)}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreatePlan}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    Create Plan
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Subscription Activation Modal */}
        {showSubscriptionModal && selectedPartner && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-gray-900">Activate Subscription</h3>
                  <button
                    onClick={() => setShowSubscriptionModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>

                <div className="mb-6">
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-green-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold">
                        {selectedPartner.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900">{selectedPartner.name}</h4>
                      <p className="text-sm text-gray-600">{selectedPartner.organization}</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {subscriptionPlans.filter(plan => plan.isActive).map((plan) => (
                    <div
                      key={plan.id}
                      className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                        selectedPlan?.id === plan.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setSelectedPlan(plan)}
                    >
                      <div className="text-center mb-3">
                        <h4 className="font-bold text-gray-900">{plan.name}</h4>
                        <div className="text-2xl font-bold text-green-600 mt-1">
                          ₹{plan.amount}
                          <span className="text-sm text-gray-500">/{plan.duration}</span>
                        </div>
                      </div>
                      <ul className="text-sm text-gray-600 space-y-1">
                        {plan.features.slice(0, 3).map((feature, index) => (
                          <li key={index} className="flex items-center">
                            <span className="text-green-500 mr-2">✓</span>
                            {feature}
                          </li>
                        ))}
                        {plan.features.length > 3 && (
                          <li className="text-gray-500">+{plan.features.length - 3} more features</li>
                        )}
                      </ul>
                    </div>
                  ))}
                </div>

                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    onClick={() => setShowSubscriptionModal(false)}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => selectedPlan && handleActivateSubscription(selectedPartner, selectedPlan)}
                    disabled={!selectedPlan}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      selectedPlan
                        ? 'bg-green-500 text-white hover:bg-green-600'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    Activate Subscription
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

export default AdminSubscriptionsPage;