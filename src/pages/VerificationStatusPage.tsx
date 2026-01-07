import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const VerificationStatusPage: React.FC = () => {
  const [verificationStatus, setVerificationStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    checkVerificationStatus();
  }, []);

  const checkVerificationStatus = () => {
    const verification = localStorage.getItem('partnerVerification');
    if (verification) {
      setVerificationStatus(JSON.parse(verification));
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Checking verification status...</p>
        </div>
      </div>
    );
  }

  if (!verificationStatus) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center">
          <div className="bg-white/90 backdrop-blur-sm p-8 rounded-2xl shadow-2xl">
            <div className="text-6xl mb-4">⏳</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Verification Pending</h2>
            <p className="text-gray-600 mb-6">
              Your documents are under review. You'll receive an email notification once verification is complete.
            </p>
            <button
              onClick={checkVerificationStatus}
              className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600"
            >
              🔄 Check Status
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (verificationStatus.status === 'verified') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center">
          <div className="bg-white/90 backdrop-blur-sm p-8 rounded-2xl shadow-2xl">
            <div className="text-6xl mb-4">✅</div>
            <h2 className="text-2xl font-bold text-green-600 mb-4">Verification Approved!</h2>
            <p className="text-gray-600 mb-6">
              Congratulations! Your documents have been verified successfully.
            </p>
            
            <div className="bg-green-50 p-4 rounded-lg mb-6">
              <h3 className="font-semibold text-green-800 mb-2">📧 Email Notification Sent</h3>
              <p className="text-sm text-green-700">
                Check your email for verification confirmation and next steps.
              </p>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg mb-6">
              <h3 className="font-semibold text-blue-800 mb-2">Next Step: Choose Subscription Plan</h3>
              <p className="text-sm text-blue-700 mb-3">
                Select a subscription plan to access all platform features.
              </p>
              <button
                onClick={() => navigate('/subscription-plans')}
                className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 w-full"
              >
                💳 View Subscription Plans
              </button>
            </div>

            <p className="text-xs text-gray-500">
              Verified on: {new Date(verificationStatus.verifiedAt).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (verificationStatus.status === 'rejected') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-100 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center">
          <div className="bg-white/90 backdrop-blur-sm p-8 rounded-2xl shadow-2xl">
            <div className="text-6xl mb-4">❌</div>
            <h2 className="text-2xl font-bold text-red-600 mb-4">Verification Rejected</h2>
            <p className="text-gray-600 mb-6">
              Unfortunately, your documents could not be verified. Please review and re-upload.
            </p>
            
            <div className="bg-red-50 p-4 rounded-lg mb-6">
              <h3 className="font-semibold text-red-800 mb-2">📧 Email Notification Sent</h3>
              <p className="text-sm text-red-700">
                Check your email for detailed feedback and requirements.
              </p>
            </div>

            <div className="bg-orange-50 p-4 rounded-lg mb-6">
              <h3 className="font-semibold text-orange-800 mb-2">Required Actions:</h3>
              <ul className="text-sm text-orange-700 text-left space-y-1">
                <li>• Review document requirements</li>
                <li>• Ensure documents are clear and valid</li>
                <li>• Re-upload corrected documents</li>
              </ul>
            </div>

            <button
              onClick={() => navigate('/document-upload')}
              className="bg-orange-500 text-white px-6 py-2 rounded-lg hover:bg-orange-600 w-full"
            >
              📄 Re-upload Documents
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default VerificationStatusPage;