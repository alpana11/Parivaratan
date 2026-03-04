import React, { useState, useEffect } from 'react';
import { dbService } from '../services/dbService';
import { Partner, PartnerDocument } from '../types';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

const AdminDocumentVerificationPage: React.FC = () => {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);
  const [remarks, setRemarks] = useState('');
  const [previewDocument, setPreviewDocument] = useState<Document | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'verified' | 'rejected'>('all');

  useEffect(() => {
    const unsubscribe = dbService.subscribeToPartners((allPartners) => {
      // Only show partners with documents
      const partnersWithDocs = allPartners.filter(p => p.documents && p.documents.length > 0);
      setPartners(partnersWithDocs);
    });
    return unsubscribe;
  }, []);

  const handleApproveAllDocuments = async (partnerId: string) => {
    try {
      const partner = partners.find(p => p.id === partnerId);
      if (!partner || !partner.documents || !Array.isArray(partner.documents) || partner.documents.length === 0) {
        alert('No documents found to approve');
        return;
      }

      const updatedDocs = partner.documents.map(doc => {
        const newDoc: any = {
          ...doc,
          verified: 'approved' as const
        };
        if (remarks) {
          newDoc.remarks = remarks;
        }
        return newDoc;
      });

      // Update local state immediately
      setPartners(prev => prev.map(p =>
        p.id === partnerId ? { ...p, documents: updatedDocs } : p
      ));
      if (selectedPartner?.id === partnerId) {
        setSelectedPartner({ ...selectedPartner, documents: updatedDocs });
      }

      await updateDoc(doc(db, 'partners', partnerId), {
        documents: updatedDocs
      });

      setRemarks('');
      alert('All documents approved!');
    } catch (error) {
      console.error('Error approving documents:', error);
      alert('Failed to approve documents: ' + (error as Error).message);
    }
  };

  const handleRejectAllDocuments = async (partnerId: string) => {
    try {
      const partner = partners.find(p => p.id === partnerId);
      if (!partner || !partner.documents || !Array.isArray(partner.documents) || partner.documents.length === 0) {
        alert('No documents found to reject');
        return;
      }

      const updatedDocs = partner.documents.map(doc => {
        const newDoc: any = {
          ...doc,
          verified: 'rejected' as const
        };
        if (remarks) {
          newDoc.remarks = remarks;
        }
        return newDoc;
      });

      // Update local state immediately
      setPartners(prev => prev.map(p =>
        p.id === partnerId ? { ...p, documents: updatedDocs } : p
      ));
      if (selectedPartner?.id === partnerId) {
        setSelectedPartner({ ...selectedPartner, documents: updatedDocs });
      }

      await updateDoc(doc(db, 'partners', partnerId), {
        documents: updatedDocs
      });

      setRemarks('');
      alert('All documents rejected!');
    } catch (error) {
      console.error('Error rejecting documents:', error);
      alert('Failed to reject documents: ' + (error as Error).message);
    }
  };

  const handlePartnerVerification = async (partnerId: string, action: 'approved' | 'rejected') => {
    try {
      // Update local state immediately
      setPartners(prev => prev.map(p =>
        p.id === partnerId ? { ...p, verificationStatus: action, status: action === 'approved' ? 'verified' : 'rejected' } : p
      ));
      if (selectedPartner?.id === partnerId) {
        setSelectedPartner({ ...selectedPartner, verificationStatus: action, status: action === 'approved' ? 'verified' : 'rejected' });
      }

      await updateDoc(doc(db, 'partners', partnerId), {
        verificationStatus: action,
        status: action === 'approved' ? 'verified' : 'rejected'
      });
      alert(`Partner ${action}!`);
    } catch (error) {
      console.error('Error updating partner:', error);
      alert('Failed to update partner');
    }
  };

  const getDocumentTypeName = (type: string) => {
    switch (type) {
      case 'registration_certificate': return 'Registration Certificate';
      case 'id_proof': return 'ID Proof';
      case 'address_proof': return 'Address/Operation Proof';
      default: return type;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': case 'verified': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Document Verification</h1>
          <div className="flex items-center space-x-4">
            <div className="flex space-x-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-3 py-2 text-sm rounded-lg ${
                  filter === 'all' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All ({partners.length})
              </button>
              <button
                onClick={() => setFilter('pending')}
                className={`px-3 py-2 text-sm rounded-lg ${
                  filter === 'pending' ? 'bg-yellow-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Pending ({partners.filter(p => p.verificationStatus === 'pending').length})
              </button>
              <button
                onClick={() => setFilter('verified')}
                className={`px-3 py-2 text-sm rounded-lg ${
                  filter === 'verified' ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Verified ({partners.filter(p => p.verificationStatus === 'verified').length})
              </button>
              <button
                onClick={() => setFilter('rejected')}
                className={`px-3 py-2 text-sm rounded-lg ${
                  filter === 'rejected' ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Rejected ({partners.filter(p => p.verificationStatus === 'rejected').length})
              </button>
            </div>
              <button
                onClick={() => {
                  window.location.reload();
                }}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              >
                🔄 Refresh
              </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Partners List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Partners Pending Verification</h2>
              <div className="space-y-4">
                {partners
                  .filter(partner => filter === 'all' || partner.verificationStatus === filter)
                  .map(partner => (
                  <div 
                    key={partner.id}
                    onClick={() => setSelectedPartner(partner)}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedPartner?.id === partner.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium">{partner.name}</h3>
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(partner.verificationStatus || 'pending')}`}>
                        {partner.verificationStatus || 'pending'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">{partner.organization}</p>
                    <p className="text-xs text-gray-500">{partner.partnerType}</p>
                    <p className="text-xs text-gray-400">
                      Documents: {partner.documents?.length || 0} | Email: {partner.email}
                    </p>
                    {partner.registrationDate && (
                      <p className="text-xs text-gray-400">
                        Registered: {new Date(partner.registrationDate).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Partner Details */}
          <div className="lg:col-span-2">
            {selectedPartner ? (
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text-2xl font-bold">{selectedPartner.name}</h2>
                    <p className="text-gray-600">{selectedPartner.organization}</p>
                    {selectedPartner.registrationDate && (
                      <p className="text-sm text-gray-500">
                        {selectedPartner.partnerType} • Registered: {new Date(selectedPartner.registrationDate).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className={`px-3 py-1 rounded-full ${getStatusColor(selectedPartner.verificationStatus || 'pending')}`}>
                      {selectedPartner.verificationStatus || 'pending'}
                    </span>
                    <button
                      onClick={() => setSelectedPartner(null)}
                      className="text-gray-400 hover:text-gray-600 text-2xl"
                    >
                      ×
                    </button>
                  </div>
                </div>

                {/* Documents */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-4">Uploaded Documents ({selectedPartner.documents?.length || 0})</h3>
                  <div className="space-y-4">
                    {selectedPartner.documents && selectedPartner.documents.length > 0 ? (
                      selectedPartner.documents.map((doc, index) => (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h4 className="font-medium">{getDocumentTypeName(doc.type)}</h4>
                            <p className="text-sm text-gray-600 break-all">{doc.url}</p>
                            <p className="text-xs text-gray-500">
                              Uploaded: {new Date(doc.uploadedAt).toLocaleDateString()}
                            </p>
                          </div>
                          <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(doc.verified || 'pending')}`}>
                            {doc.verified || 'pending'}
                          </span>
                        </div>

                        <div className="flex space-x-2 mt-3">
                          <a
                            href={doc.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
                          >
                            👁️ View Document
                          </a>
                        </div>

                        {doc.remarks && (
                          <div className="mt-2 p-2 bg-gray-50 rounded text-sm">
                            <strong>Remarks:</strong> {doc.remarks}
                          </div>
                        )}
                      </div>
                    ))
                    ) : (
                      <p className="text-gray-500 text-center py-4">No documents uploaded yet</p>
                    )}
                  </div>
                </div>

                {/* Remarks Input */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Add Remarks (Optional)
                  </label>
                  <textarea
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg"
                    rows={3}
                    placeholder="Add verification remarks for all documents..."
                  />
                </div>

                {/* Document Actions - Single Approve/Reject for All */}
                <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="font-medium mb-3 text-blue-900">Document Verification Actions</h4>
                  <div className="flex space-x-4">
                    <button
                      onClick={() => handleApproveAllDocuments(selectedPartner.id)}
                      disabled={selectedPartner.documents?.every(d => d.verified === 'approved')}
                      className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 font-semibold disabled:bg-gray-300 disabled:cursor-not-allowed"
                    >
                      ✓ Approve All Documents ({selectedPartner.documents?.length || 0})
                    </button>
                    <button
                      onClick={() => handleRejectAllDocuments(selectedPartner.id)}
                      disabled={selectedPartner.documents?.every(d => d.verified === 'rejected')}
                      className="flex-1 bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 font-semibold disabled:bg-gray-300 disabled:cursor-not-allowed"
                    >
                      ✗ Reject All Documents
                    </button>
                  </div>
                  <p className="text-xs text-gray-600 mt-2">This will apply the same status to all uploaded documents</p>
                </div>

                {/* Final Actions */}
                {selectedPartner.verificationStatus === 'pending' && (
                  <div className="flex space-x-4">
                    <button
                      onClick={() => handlePartnerVerification(selectedPartner.id, 'approved')}
                      className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
                    >
                      ✓ Approve Partner
                    </button>
                    <button
                      onClick={() => handlePartnerVerification(selectedPartner.id, 'rejected')}
                      className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700"
                    >
                      ✗ Reject Partner
                    </button>
                  </div>
                )}

                {/* System Info */}
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium mb-2">Document URLs</h4>
                  <p className="text-sm text-gray-600">📁 Files stored in Cloudinary CDN</p>
                  <p className="text-sm text-gray-600">🔐 Secure HTTPS URLs</p>
                  <p className="text-sm text-gray-600">👁️ Click "View" to open in new tab</p>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow p-6 text-center">
                <p className="text-gray-500">Select a partner to view their documents</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDocumentVerificationPage;