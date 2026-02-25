import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { dbService } from '../services/dbService';

const SubscriptionPlansPage: React.FC = () => {
  const { user } = useAuth();
  const [plans, setPlans] = useState<any[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<string>('');
  const [processing, setProcessing] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Load plans from database with real-time updates
    const unsubscribe = dbService.subscribeToSubscriptionPlans((dbPlans) => {
      if (dbPlans.length > 0) {
        setPlans(dbPlans.filter(p => p.isActive));
      } else {
        // Fallback to default plans if database is empty
        setPlans(defaultPlans);
      }
    });

    return () => unsubscribe();
  }, []);

  const defaultPlans = [
    {
      id: 'monthly',
      name: 'Monthly Plan',
      price: 279,
      duration: 'month',
      features: [
        'Unlimited waste requests',
        'Advanced AI insights',
        'Priority 24/7 support'
      ],
      popular: false
    },
    {
      id: 'quarterly',
      name: '3 Months Plan',
      price: 799,
      duration: '3 months',
      features: [
        'Unlimited waste requests',
        'Advanced AI insights',
        'Priority 24/7 support',
        '₹38 savings (5% off)'
      ],
      popular: true
    },
    {
      id: 'half-yearly',
      name: '6 Months Plan',
      price: 1599,
      duration: '6 months',
      features: [
        'Unlimited waste requests',
        'Advanced AI insights',
        'Priority 24/7 support',
        '₹75 savings (4% off)'
      ],
      popular: false
    },
    {
      id: 'yearly',
      name: 'Yearly Plan',
      price: 3200,
      duration: 'year',
      features: [
        'Unlimited waste requests',
        'Advanced AI insights',
        'Priority 24/7 support',
        '₹148 savings (4% off)'
      ],
      popular: false
    }
  ];

  const handlePlanSelection = (planId: string) => {
    const selectedPlanData = plans.find(p => p.id === planId);
    if (!selectedPlanData) {
      alert('Plan not found');
      return;
    }

    navigate('/make-payment', { state: { selectedPlan: selectedPlanData } });
  };

  if (plans.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-blue-50 to-indigo-100 py-12 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mx-auto mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Choose Your Subscription Plan</h1>
          <p className="text-xl text-gray-600">Select the perfect plan for your waste management needs</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative bg-white rounded-2xl shadow-xl p-6 flex flex-col ${
                plan.popular ? 'ring-4 ring-emerald-500 scale-105' : ''
              }`}
              style={{ aspectRatio: '1/1' }}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-emerald-500 text-white px-4 py-2 rounded-full text-sm font-semibold">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="text-center mb-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                <div className="text-3xl font-bold text-emerald-600 mb-2">
                  ₹{plan.price}
                  <span className="text-sm text-gray-500">/{plan.duration}</span>
                </div>
              </div>

              <ul className="space-y-3 mb-6 flex-1">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <svg className="w-5 h-5 text-emerald-500 mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handlePlanSelection(plan.id)}
                disabled={processing && selectedPlan === plan.id}
                className={`w-full py-3 px-6 rounded-xl font-semibold transition-all duration-200 ${
                  plan.popular
                    ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                    : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                } ${processing && selectedPlan === plan.id ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {processing && selectedPlan === plan.id ? (
                  <div className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing Payment...
                  </div>
                ) : (
                  `Select ${plan.name}`
                )}
              </button>
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <p className="text-gray-600 mb-4">All plans include the same features - choose your billing cycle:</p>
          <div className="flex justify-center space-x-8 text-sm text-gray-500">
            <span>✅ 7-day free trial</span>
            <span>✅ Cancel anytime</span>
            <span>✅ Secure payments</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionPlansPage;