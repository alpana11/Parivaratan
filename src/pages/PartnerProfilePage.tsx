import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { dbService } from '../services/dbService';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

const PartnerProfilePage: React.FC = () => {
  const { partner, user, loading, signOut } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState({
    id: '',
    name: '',
    email: '',
    phone: '',
    organization: '',
    partnerType: '',
    address: '',
    supportedWasteTypes: [] as string[],
    verificationStatus: 'pending' as 'pending' | 'approved' | 'rejected',
    documents: [] as any[],
    rewardPoints: 0,
  });
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);

  // Auto-load partner data from Firestore when user is authenticated
  useEffect(() => {
    const loadPartnerData = async () => {
      if (user && !loading) {
        setProfileLoading(true);
        try {
          console.log('Auto-loading partner data from Firestore for user:', user.uid);
          const partnerDoc = await getDoc(doc(db, 'partners', user.uid));

          if (partnerDoc.exists()) {
            const partnerData = partnerDoc.data();
            console.log('Partner data loaded from Firestore:', partnerData);
            setProfile({
              id: partnerData.id || user.uid,
              name: partnerData.name || '',
              email: partnerData.email || user.email || '',
              phone: partnerData.phone || '',
              organization: partnerData.organization || '',
              partnerType: partnerData.partnerType || '',
              address: partnerData.address || '',
              supportedWasteTypes: partnerData.supportedWasteTypes || [],
              verificationStatus: partnerData.verificationStatus || 'pending',
              documents: partnerData.documents || [],
              rewardPoints: partnerData.rewardPoints || 0,
            });
          } else {
            console.log('No partner document found in Firestore');
            setProfile({
              id: user.uid,
              name: '',
              email: user.email || '',
              phone: '',
              organization: '',
              partnerType: '',
              address: '',
              supportedWasteTypes: [],
              verificationStatus: 'pending',
              documents: [],
              rewardPoints: 0,
            });
          }
        } catch (error) {
          console.error('Error loading partner data from Firestore:', error);
        } finally {
          setProfileLoading(false);
        }
      }
    };

    loadPartnerData();
  }, [user, loading]);

  // Also update profile when auth context partner data changes (for consistency)
  useEffect(() => {
    if (partner && !profileLoading) {
      console.log('Updating profile from auth context:', partner);
      setProfile({
        id: partner.id || '',
        name: partner.name || '',
        email: partner.email || '',
        phone: partner.phone || '',
        organization: partner.organization || '',
        partnerType: partner.partnerType || '',
        address: partner.address || '',
        supportedWasteTypes: partner.supportedWasteTypes || [],
        verificationStatus: partner.verificationStatus || 'pending',
        documents: partner.documents || [],
        rewardPoints: partner.rewardPoints || 0,
      });
    }
  }, [partner, profileLoading]);

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);
    try {
      await dbService.updatePartner(user.uid, {
        name: profile.name,
        email: profile.email,
        phone: profile.phone,
        organization: profile.organization,
        partnerType: profile.partnerType,
        address: profile.address,
        supportedWasteTypes: profile.supportedWasteTypes,
      });
      setIsEditing(false);
      alert('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setProfile({
      ...profile,
      [e.target.name]: e.target.value,
    });
  };

  const handleLogout = async () => {
    try {
      await signOut();
      // Redirect to home page
      window.location.href = '/';
    } catch (error) {
      console.error('Error logging out:', error);
      alert('Failed to logout');
    }
  };

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
    // In a real app, this would apply dark mode classes to the document
    document.documentElement.classList.toggle('dark', !isDarkMode);
  };

  const toggleNotifications = () => {
    setNotificationsEnabled(!notificationsEnabled);
    // Mock notification toggle
    console.log('Notifications:', !notificationsEnabled ? 'enabled' : 'disabled');
  };

  // Show loading state while fetching partner data
  if (loading) {
    return (
      <div className="space-y-8">
        <div className="bg-gradient-to-r from-emerald-600 via-blue-600 to-indigo-600 rounded-2xl p-8 text-white shadow-2xl">
          <h1 className="text-3xl font-bold mb-2">Partner Profile</h1>
          <p className="text-emerald-100 text-lg">Manage your account information and preferences</p>
        </div>
        <div className="bg-white shadow-2xl rounded-2xl border border-gray-100 p-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
            <span className="ml-3 text-gray-600">Loading profile...</span>
          </div>
        </div>
      </div>
    );
  }

  // Show error state if no partner data
  if (!partner) {
    return (
      <div className="space-y-8">
        <div className="bg-gradient-to-r from-emerald-600 via-blue-600 to-indigo-600 rounded-2xl p-8 text-white shadow-2xl">
          <h1 className="text-3xl font-bold mb-2">Partner Profile</h1>
          <p className="text-emerald-100 text-lg">Manage your account information and preferences</p>
        </div>
        <div className="bg-white shadow-2xl rounded-2xl border border-gray-100 p-8">
          <div className="text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">Partner Profile Not Found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {user ? 'Your account exists but partner data was not found. Please complete your partner registration.' : 'Please log in to view your profile.'}
            </p>
            {user && (
              <div className="mt-4">
                <button
                  onClick={() => window.location.href = '/partner-signup'}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-emerald-600 hover:bg-emerald-700"
                >
                  Complete Registration
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="bg-gradient-to-r from-emerald-600 via-blue-600 to-indigo-600 rounded-2xl p-8 text-white shadow-2xl">
        <h1 className="text-3xl font-bold mb-2">Partner Profile</h1>
        <p className="text-emerald-100 text-lg">Manage your account information and preferences</p>
      </div>

      <div className="bg-white shadow-2xl rounded-2xl border border-gray-100">
        <div className="px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-blue-50">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">Personal Information</h2>
            <button
              onClick={() => isEditing ? handleSave() : setIsEditing(true)}
              className="inline-flex items-center px-6 py-3 border border-transparent text-sm font-bold rounded-xl text-white bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700 transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              {isEditing ? 'Save Changes' : 'Edit Profile'}
            </button>
          </div>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gradient-to-r from-gray-50 to-blue-50 p-6 rounded-2xl border border-gray-100">
              <label className="block text-sm font-bold text-gray-700 mb-2">Full Name</label>
              <input
                type="text"
                name="name"
                value={profile.name}
                onChange={handleChange}
                disabled={!isEditing}
                className="block w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200 bg-white disabled:bg-gray-100 disabled:text-gray-500 shadow-sm"
              />
            </div>

            <div className="bg-gradient-to-r from-gray-50 to-blue-50 p-6 rounded-2xl border border-gray-100">
              <label className="block text-sm font-bold text-gray-700 mb-2">Email Address</label>
              <input
                type="email"
                name="email"
                value={profile.email}
                onChange={handleChange}
                disabled={!isEditing}
                className="block w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200 bg-white disabled:bg-gray-100 disabled:text-gray-500 shadow-sm"
              />
            </div>

            <div className="bg-gradient-to-r from-gray-50 to-blue-50 p-6 rounded-2xl border border-gray-100">
              <label className="block text-sm font-bold text-gray-700 mb-2">Phone Number</label>
              <input
                type="tel"
                name="phone"
                value={profile.phone}
                onChange={handleChange}
                disabled={!isEditing}
                className="block w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200 bg-white disabled:bg-gray-100 disabled:text-gray-500 shadow-sm"
              />
            </div>

            <div className="bg-gradient-to-r from-gray-50 to-blue-50 p-6 rounded-2xl border border-gray-100">
              <label className="block text-sm font-bold text-gray-700 mb-2">Organization</label>
              <input
                type="text"
                name="organization"
                value={profile.organization}
                onChange={handleChange}
                disabled={!isEditing}
                className="block w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200 bg-white disabled:bg-gray-100 disabled:text-gray-500 shadow-sm"
              />
            </div>
          </div>

          <div className="mt-6 bg-gradient-to-r from-gray-50 to-blue-50 p-6 rounded-2xl border border-gray-100">
            <label className="block text-sm font-bold text-gray-700 mb-2">Address</label>
            <textarea
              name="address"
              rows={3}
              value={profile.address}
              onChange={handleChange}
              disabled={!isEditing}
              className="block w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200 bg-white disabled:bg-gray-100 disabled:text-gray-500 shadow-sm resize-none"
            />
          </div>

          {/* Supported Waste Types */}
          <div className="mt-6 bg-gradient-to-r from-gray-50 to-blue-50 p-6 rounded-2xl border border-gray-100">
            <label className="block text-sm font-bold text-gray-700 mb-4">Supported Waste Types</label>
            {profile.supportedWasteTypes && profile.supportedWasteTypes.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {profile.supportedWasteTypes.map((wasteType, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-emerald-100 text-emerald-800 border border-emerald-200"
                  >
                    {wasteType.charAt(0).toUpperCase() + wasteType.slice(1)}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No waste types specified</p>
            )}
          </div>

          <div className="mt-8">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Verification Status</h3>
            <div className="bg-gradient-to-r from-emerald-50 to-green-50 p-6 rounded-2xl border border-emerald-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-emerald-800">Account Status</p>
                  <p className="text-emerald-900 font-bold">
                    {profile.verificationStatus === 'approved' ? 'Verified Partner' : 'Pending Verification'}
                  </p>
                </div>
                <div className={`w-4 h-4 rounded-full ${
                  profile.verificationStatus === 'approved' ? 'bg-emerald-500' : 'bg-yellow-500'
                }`}></div>
              </div>
            </div>
          </div>

          <div className="mt-8">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Uploaded Documents</h3>
            <div className="space-y-4">
              {profile.documents && profile.documents.length > 0 ? (
                profile.documents.map((doc, index) => (
                  <div key={index} className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-200 flex items-center justify-between">
                    <div className="flex items-center">
                      <svg className="w-6 h-6 text-blue-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span className="text-gray-900 font-medium">
                        {typeof doc === 'string' ? doc : doc.name || doc.type || 'Document'}
                      </span>
                    </div>
                    <span className={`inline-flex px-3 py-1 text-xs font-bold rounded-full ${
                      profile.verificationStatus === 'approved' ? 'bg-emerald-100 text-emerald-800' :
                      profile.verificationStatus === 'rejected' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {profile.verificationStatus === 'approved' ? 'Verified' :
                       profile.verificationStatus === 'rejected' ? 'Rejected' : 'Pending'}
                    </span>
                  </div>
                ))
              ) : (
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-4 rounded-xl border border-gray-200 text-center">
                  <p className="text-gray-500">No documents uploaded yet</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Settings Section */}
      <div className="bg-white shadow-2xl rounded-2xl border border-gray-100">
        <div className="px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-blue-50">
          <h2 className="text-xl font-bold text-gray-900">Account Settings</h2>
        </div>
        <div className="p-6 space-y-6">
          {/* Theme Toggle */}
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl border border-gray-100">
            <div className="flex items-center">
              <div className="p-2 bg-indigo-100 rounded-lg mr-4">
                {isDarkMode ? (
                  <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                )}
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">Theme</p>
                <p className="text-sm text-gray-600">{isDarkMode ? 'Dark mode enabled' : 'Light mode enabled'}</p>
              </div>
            </div>
            <button
              onClick={toggleTheme}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                isDarkMode ? 'bg-indigo-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  isDarkMode ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Notification Toggle */}
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl border border-gray-100">
            <div className="flex items-center">
              <div className="p-2 bg-emerald-100 rounded-lg mr-4">
                <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM4.868 12.683A17.925 17.925 0 0112 21c7.962 0 12-1.21 12-2.683m-12 2.683a17.925 17.925 0 01-7.132-8.317M12 21c4.411 0 8-4.03 8-9s-3.589-9-8-9-8 4.03-8 9a9.23 9.23 0 001.868 5.683z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">Notifications</p>
                <p className="text-sm text-gray-600">{notificationsEnabled ? 'Notifications enabled' : 'Notifications disabled'}</p>
              </div>
            </div>
            <button
              onClick={toggleNotifications}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 ${
                notificationsEnabled ? 'bg-emerald-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  notificationsEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Logout Button */}
          <div className="pt-4 border-t border-gray-200">
            <button
              onClick={handleLogout}
              className="w-full flex justify-center items-center px-6 py-3 border border-transparent text-sm font-bold rounded-xl text-white bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PartnerProfilePage;