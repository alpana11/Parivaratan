import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { dbService } from '../services/dbService';

const SubscriptionPlansPage: React.FC = () => {
  const { user } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<string>('');
  const [processing, setProcessing] = useState(false);
  const navigate = useNavigate();

  const plans = [
    {
      id: 'basic-monthly',
      name: 'Basic Monthly',
      price: 99,
      duration: 'month',
      features: [
        'Waste collection requests',
        'Basic analytics',
        'Email support'
      ],
      popular: false
    },
    {
      id: 'premium-monthly',
      name: 'Premium Monthly',
      price: 199,
      duration: 'month',
      features: [
        'All Basic features',
        'Advanced analytics',
        'Priority support',
        'Custom branding'
      ],
      popular: true
    },
    {
      id: 'basic-yearly',
      name: 'Basic Yearly',
      price: 999,
      duration: 'month',
      features: [
        'Waste collection requests',
        'Basic analytics',
        'Email support',
        '2 months free'
      ],
      popular: false
    },
    {
      id: 'premium-yearly',
      name: 'Premium Yearly',
      price: 1999,
      duration: 'month',
      features: [
        'All Basic features',
        'Advanced analytics',
        'Priority support',
        'Custom branding',
        '2 months free'
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Choose Your Subscription Plan</h1>
          <p className="text-xl text-gray-600">Select the perfect plan for your waste management needs</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative bg-white rounded-2xl shadow-xl p-8 ${
                plan.popular ? 'ring-4 ring-emerald-500 scale-105' : ''
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-emerald-500 text-white px-4 py-2 rounded-full text-sm font-semibold">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                <div className="text-4xl font-bold text-emerald-600 mb-2">
                  ₹{plan.price}
                  <span className="text-lg text-gray-500">/{plan.duration}</span>
                </div>
              </div>

              <ul className="space-y-4 mb-8">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <svg className="w-5 h-5 text-emerald-500 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-gray-700">{feature}</span>
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
          <p className="text-gray-600 mb-4">All plans include:</p>
          <div className="flex justify-center space-x-8 text-sm text-gray-500">
            <span>✅ 30-day money-back guarantee</span>
            <span>✅ Cancel anytime</span>
            <span>✅ 24/7 customer support</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionPlansPage;