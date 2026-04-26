import React, { useState } from 'react';

const SECRET_KEY = import.meta.env.VITE_ADMIN_SETUP_KEY;

const AdminSetupPage: React.FC = () => {
  const [secretInput, setSecretInput] = useState('');
  const [unlocked, setUnlocked] = useState(false);
  const [keyError, setKeyError] = useState('');

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (secretInput === SECRET_KEY) {
      setUnlocked(true);
      setKeyError('');
    } else {
      setKeyError('Invalid secret key. Access denied.');
    }
  };

  if (!unlocked) {
    return (
      <div className="min-h-screen bg-gray-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="text-center mb-8">
            <span className="text-5xl">🔒</span>
            <h2 className="mt-4 text-3xl font-extrabold text-white">Restricted Access</h2>
            <p className="mt-2 text-sm text-gray-400">Enter the secret key to continue</p>
          </div>
          <div className="bg-gray-800 py-8 px-6 shadow rounded-xl">
            <form onSubmit={handleUnlock} className="space-y-4">
              <input
                type="password"
                placeholder="Enter secret key"
                value={secretInput}
                onChange={(e) => setSecretInput(e.target.value)}
                className="w-full px-4 py-3 bg-gray-700 text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400"
              />
              {keyError && <p className="text-red-400 text-sm">{keyError}</p>}
              <button
                type="submit"
                className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
              >
                Unlock
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center mb-8">
          <span className="text-5xl">🔓</span>
          <h2 className="mt-4 text-3xl font-extrabold text-white">Admin Access</h2>
          <p className="mt-2 text-sm text-gray-400">You are verified. Proceed to login.</p>
        </div>
        <div className="bg-gray-800 py-8 px-6 shadow rounded-xl text-center">
          <a
            href="/admin/login"
            className="w-full inline-block py-3 px-6 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to Admin Login
          </a>
        </div>
      </div>
    </div>
  );
};

export default AdminSetupPage;
