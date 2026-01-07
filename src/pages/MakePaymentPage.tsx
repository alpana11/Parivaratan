import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { dbService } from '../services/dbService';

const MakePaymentPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, refreshPartner } = useAuth();
  const [processing, setProcessing] = useState(false);

  const selectedPlan = location.state?.selectedPlan;

  if (!selectedPlan) {
    navigate('/subscription-plans');
    return null;
  }

  const handlePayment = async () => {
    if (!user) {
      alert('Please sign in to continue');
      return;
    }

    setProcessing(true);

    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Calculate expiry date based on plan duration
      const durationInDays = selectedPlan.duration === 'month' ? 30 : 365;
      const expiryDate = new Date(Date.now() + durationInDays * 24 * 60 * 60 * 1000);

      // Store subscription data in Firebase
      const subscriptionData = {
        planId: selectedPlan.id,
        amount: selectedPlan.price,
        status: 'active' as const,
        startDate: new Date().toISOString(),
        expiryDate: expiryDate.toISOString(),
        paymentMethod: 'Demo Payment',
        transactionId: 'TXN' + Date.now()
      };

      // Update partner document with subscription and set status to approved
      await dbService.updatePartner(user.uid, {
        verificationStatus: 'approved',
        subscription: subscriptionData,
        subscriptionStatus: 'active'
      });

      // Refresh partner data to reflect the updated subscription status
      await refreshPartner();

      alert(`🎉 Payment Successful!\\n\\n💳 Plan: ${selectedPlan.name}\\n💰 Amount: ₹${selectedPlan.price}\\n🔓 Dashboard access unlocked!`);

      navigate('/dashboard');
    } catch (error) {
      console.error('Payment error:', error);
      alert('Payment failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Make Payment</h1>
            <p className="text-gray-600">Complete your subscription payment</p>
          </div>

          <div className="bg-gray-50 rounded-lg p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Selected Plan</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Plan Name:</span>
                <span className="font-medium">{selectedPlan.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Duration:</span>
                <span className="font-medium">{selectedPlan.duration}</span>
              </div>
              <div className="flex justify-between text-lg font-semibold">
                <span>Total Amount:</span>
                <span className="text-emerald-600">₹{selectedPlan.price}</span>
              </div>
            </div>
          </div>

          <div className="text-center">
            <button
              onClick={handlePayment}
              disabled={processing}
              className={`w-full py-4 px-6 rounded-xl font-semibold text-white transition-all duration-200 ${
                processing
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-emerald-600 hover:bg-emerald-700'
              }`}
            >
              {processing ? (
                <div className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing Payment...
                </div>
              ) : (
                `Pay ₹${selectedPlan.price} Now`
              )}
            </button>
          </div>

          <div className="mt-6 text-center">
            <button
              onClick={() => navigate('/subscription-plans')}
              className="text-gray-500 hover:text-gray-700 underline"
            >
              ← Back to Plan Selection
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MakePaymentPage;
