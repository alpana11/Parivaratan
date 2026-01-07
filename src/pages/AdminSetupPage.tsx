import React, { useState } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

const AdminSetupPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const createAdminUser = async () => {
    setLoading(true);
    setMessage('');

    try {
      // Create Firebase Auth user
      const userCredential = await createUserWithEmailAndPassword(auth, 'admin@parivartan.com', 'admin123');
      const user = userCredential.user;

      // Create admin document in Firestore
      await setDoc(doc(db, 'admins', user.uid), {
        id: user.uid,
        email: 'admin@parivartan.com',
        name: 'Admin User',
        role: 'admin',
        createdAt: new Date(),
      });

      setMessage('Admin user created successfully! Email: admin@parivartan.com, Password: admin123');

    } catch (error: any) {
      console.error('Error creating admin user:', error);
      setMessage(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Admin Setup
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Create a demo admin user for testing
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="space-y-6">
            <div>
              <p className="text-sm text-gray-700 mb-4">
                This will create an admin user with:
                <br />
                <strong>Email:</strong> admin@parivartan.com
                <br />
                <strong>Password:</strong> admin123
              </p>
            </div>

            {message && (
              <div className={`text-sm p-3 rounded ${message.includes('Error') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                {message}
              </div>
            )}

            <div>
              <button
                onClick={createAdminUser}
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create Admin User'}
              </button>
            </div>

            <div className="text-center">
              <a
                href="/admin/login"
                className="text-sm text-blue-600 hover:text-blue-500"
              >
                Go to Admin Login
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSetupPage;