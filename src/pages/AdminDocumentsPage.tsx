import React, { useState, useEffect } from 'react';
import { dbService } from '../services/dbService';
import { Partner, PartnerDocument, DocumentType, VerificationStatus } from '../types';

const AdminDocumentsPage: React.FC = () => {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);
  const [selectedDocument, setSelectedDocument] = useState<PartnerDocument | null>(null);
  const [showDocumentViewer, setShowDocumentViewer] = useState(false);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [verificationRemarks, setVerificationRemarks] = useState('');
  const [documentRemarks, setDocumentRemarks] = useState<{[key: string]: string}>({});

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

  const getDocumentTypeLabel = (type: DocumentType) => {
    switch (type) {
      case 'registration_certificate': return 'Registration Certificate';
      case 'id_proof': return 'ID Proof';
      case 'address_proof': return 'Address Proof';
      default: return type;
    }
  };

  const getVerificationStatusColor = (status: VerificationStatus) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'approved': return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getOverallVerificationStatus = (documents: PartnerDocument[]) => {
    const approved = documents.filter(d => d.verified === 'approved').length;
    const rejected = documents.filter(d => d.verified === 'rejected').length;
    const pending = documents.filter(d => d.verified === 'pending').length;

    if (rejected > 0) return 'rejected';
    if (approved === documents.length) return 'approved';
    if (pending > 0) return 'pending';
    return 'pending';
  };

  const handleDocumentVerification = async (partnerId: string, documentType: DocumentType, status: VerificationStatus, remarks: string) => {
    try {
      const partner = partners.find(p => p.id === partnerId);
      if (!partner) return;

      const updatedDocuments = partner.documents.map(doc =>
        doc.type === documentType
          ? { ...doc, verified: status, remarks: remarks || undefined }
          : doc
      );

      await dbService.updatePartner(partnerId, { documents: updatedDocuments });

      // Update local state
      setPartners(partners.map(p =>
        p.id === partnerId
          ? { ...p, documents: updatedDocuments }
          : p
      ));

      setDocumentRemarks({ ...documentRemarks, [`${partnerId}-${documentType}`]: '' });
    } catch (error) {
      console.error('Error updating document verification:', error);
    }
  };

  const handleFinalVerification = async (partnerId: string, finalStatus: 'approved' | 'rejected') => {
    try {
      const partner = partners.find(p => p.id === partnerId);
      if (!partner) return;

      await dbService.updatePartner(partnerId, {
        verificationStatus: finalStatus,
        verificationRemarks: verificationRemarks
      });

      // Trigger email notification (mock - in real app, call email service)
      console.log(`Email notification sent to ${partner.email} for ${finalStatus} verification`);

      // Update local state
      setPartners(partners.map(p =>
        p.id === partnerId
          ? { ...p, verificationStatus: finalStatus, verificationRemarks: verificationRemarks }
          : p
      ));

      setShowVerificationModal(false);
      setSelectedPartner(null);
      setVerificationRemarks('');
    } catch (error) {
      console.error('Error updating final verification:', error);
    }
  };

  const filteredPartners = partners.filter(p => {
    if (filter === 'all') return true;
    if (filter === 'pending') return p.verificationStatus === 'pending' || (!p.verificationStatus && getOverallVerificationStatus(p.documents) === 'pending');
    if (filter === 'approved') return p.verificationStatus === 'approved';
    if (filter === 'rejected') return p.verificationStatus === 'rejected';
    return true;
  });

  const openDocumentViewer = (document: PartnerDocument, partner: Partner) => {
    setSelectedDocument(document);
    setSelectedPartner(partner);
    setShowDocumentViewer(true);
  };

  const openVerificationModal = (partner: Partner) => {
    setSelectedPartner(partner);
    setVerificationRemarks('');
    setShowVerificationModal(true);
  };

  const downloadDocument = (doc: PartnerDocument) => {
    if (doc.url.startsWith('data:')) {
      // Handle base64 data URL
      const link = document.createElement('a');
      link.href = doc.url;
      link.download = `${doc.type}_${new Date(doc.uploadedAt).toISOString().split('T')[0]}.png`; // Assuming PNG for base64
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      // Handle regular URL
      window.open(doc.url, '_blank');
    }
  };

  const getDocumentFilename = (doc: PartnerDocument) => {
    if (doc.url.startsWith('data:')) {
      // For base64, create a filename based on type and date
      return `${doc.type}_${new Date(doc.uploadedAt).toISOString().split('T')[0]}.png`;
    } else {
      // For regular URLs, extract filename
      return doc.url.split('/').pop() || 'document';
    }
  };

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
          <h2 className="text-2xl font-bold text-gray-900">📄 Document Verification</h2>
          <div className="flex flex-wrap gap-2">
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
              onClick={() => setFilter('pending')}
              className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                filter === 'pending'
                  ? 'bg-yellow-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Pending ({partners.filter(p => p.verificationStatus === 'pending' || (!p.verificationStatus && getOverallVerificationStatus(p.documents) === 'pending')).length})
            </button>
            <button
              onClick={() => setFilter('approved')}
              className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                filter === 'approved'
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Approved ({partners.filter(p => p.verificationStatus === 'approved').length})
            </button>
            <button
              onClick={() => setFilter('rejected')}
              className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                filter === 'rejected'
                  ? 'bg-red-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Rejected ({partners.filter(p => p.verificationStatus === 'rejected').length})
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredPartners.map((partner) => {
            const overallStatus = getOverallVerificationStatus(partner.documents);
            return (
              <div key={partner.id} className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                <div className="p-6">
                  {/* Partner Header with Request Info */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-green-500 rounded-full flex items-center justify-center">
                          <span className="text-white font-bold text-lg">
                            {partner.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-gray-900">{partner.name}</h3>
                          <p className="text-sm text-gray-600">{partner.organization || 'Individual Partner'}</p>
                          <p className="text-xs text-gray-500">Applied: {new Date().toLocaleDateString()}</p>
                        </div>
                      </div>

                      {/* Partner Request Details */}
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                        <h4 className="text-sm font-semibold text-blue-900 mb-2">📋 Partner Request Details</h4>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-blue-700 font-medium">Email:</span>
                            <p className="text-blue-900">{partner.email}</p>
                          </div>
                          <div>
                            <span className="text-blue-700 font-medium">Phone:</span>
                            <p className="text-blue-900">{partner.phone || 'Not provided'}</p>
                          </div>
                          <div>
                            <span className="text-blue-700 font-medium">Partner Type:</span>
                            <p className="text-blue-900">{partner.partnerType || 'Not specified'}</p>
                          </div>
                          <div>
                            <span className="text-blue-700 font-medium">Capacity:</span>
                            <p className="text-blue-900">{partner.capacity || 'Not specified'}</p>
                          </div>
                          <div className="col-span-2">
                            <span className="text-blue-700 font-medium">Service Areas:</span>
                            <p className="text-blue-900">
                              {partner.serviceAreas && partner.serviceAreas.length > 0
                                ? partner.serviceAreas.join(', ')
                                : 'Not specified'
                              }
                            </p>
                          </div>
                          <div className="col-span-2">
                            <span className="text-blue-700 font-medium">Waste Types:</span>
                            <p className="text-blue-900">
                              {partner.supportedWasteTypes && partner.supportedWasteTypes.length > 0
                                ? partner.supportedWasteTypes.join(', ')
                                : 'Not specified'
                              }
                            </p>
                          </div>
                          {partner.address && (
                            <div className="col-span-2">
                              <span className="text-blue-700 font-medium">Address:</span>
                              <p className="text-blue-900">{partner.address}</p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Verification Status */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full border ${getVerificationStatusColor(overallStatus)}`}>
                            {overallStatus === 'pending' ? 'Pending Review' :
                             overallStatus === 'approved' ? 'Verified' : 'Rejected'}
                          </span>
                          <span className="text-sm text-gray-600">
                            {partner.documents.filter(d => d.verified === 'approved').length}/{partner.documents.length} documents verified
                          </span>
                        </div>
                        <button
                          onClick={() => openVerificationModal(partner)}
                          className="px-4 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-colors"
                        >
                          Final Review
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Uploaded Documents Section */}
                  <div className="border-t border-gray-200 pt-4">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      📎 Uploaded Documents ({partner.documents.length})
                    </h4>

                    {partner.documents.length === 0 ? (
                      <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                        <div className="text-2xl mb-2">📄</div>
                        <p>No documents uploaded yet</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {partner.documents.map((doc, index) => (
                          <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                  <span className="text-blue-600 text-sm">📄</span>
                                </div>
                                <div>
                                  <h5 className="text-sm font-semibold text-gray-900">
                                    {getDocumentTypeLabel(doc.type)}
                                  </h5>
                                  <p className="text-xs text-gray-600">
                                    Uploaded: {new Date(doc.uploadedAt).toLocaleDateString()} at {new Date(doc.uploadedAt).toLocaleTimeString()}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getVerificationStatusColor(doc.verified)}`}>
                                  {doc.verified}
                                </span>
                              </div>
                            </div>

                            {/* Document Actions */}
                            <div className="flex items-center justify-between">
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => openDocumentViewer(doc, partner)}
                                  className="px-3 py-2 text-xs bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center space-x-1"
                                >
                                  <span>👁️</span>
                                  <span>View Document</span>
                                </button>
                                <a
                                  href={doc.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="px-3 py-2 text-xs bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors flex items-center space-x-1"
                                >
                                  <span>⬇️</span>
                                  <span>Download</span>
                                </a>
                              </div>

                              {doc.verified === 'pending' && (
                                <div className="flex items-center space-x-2">
                                  <input
                                    type="text"
                                    placeholder="Remarks (optional)"
                                    value={documentRemarks[`${partner.id}-${doc.type}`] || ''}
                                    onChange={(e) => setDocumentRemarks({
                                      ...documentRemarks,
                                      [`${partner.id}-${doc.type}`]: e.target.value
                                    })}
                                    className="text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500 flex-1"
                                  />
                                  <button
                                    onClick={() => handleDocumentVerification(partner.id, doc.type, 'approved', documentRemarks[`${partner.id}-${doc.type}`] || '')}
                                    className="px-3 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
                                    title="Approve"
                                  >
                                    ✓ Approve
                                  </button>
                                  <button
                                    onClick={() => handleDocumentVerification(partner.id, doc.type, 'rejected', documentRemarks[`${partner.id}-${doc.type}`] || '')}
                                    className="px-3 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                                    title="Reject"
                                  >
                                    ✗ Reject
                                  </button>
                                </div>
                              )}
                            </div>

                            {/* Document Remarks */}
                            {doc.remarks && (
                              <div className="mt-3 p-2 bg-white border border-gray-200 rounded text-xs">
                                <strong className="text-gray-700">Remarks:</strong>
                                <p className="text-gray-600 mt-1">{doc.remarks}</p>
                              </div>
                            )}

                            <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                              <span>File: {getDocumentFilename(doc)}</span>
                              <span>Type: {doc.type.replace('_', ' ')}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Verification Remarks */}
                  {partner.verificationRemarks && (
                    <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <h5 className="text-sm font-semibold text-yellow-900 mb-1">Final Verification Remarks</h5>
                      <p className="text-sm text-yellow-800">{partner.verificationRemarks}</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {filteredPartners.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-lg mb-2">📄</div>
            <p className="text-gray-500">No partners found with the selected verification status.</p>
          </div>
        )}

        {/* Secure Document Viewer Modal */}
        {showDocumentViewer && selectedDocument && selectedPartner && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl max-w-6xl w-full mx-4 max-h-[95vh] overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900">
                      {getDocumentTypeLabel(selectedDocument.type)}
                    </h3>
                    <div className="flex items-center space-x-4 mt-2">
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-green-500 rounded-full flex items-center justify-center">
                          <span className="text-white font-bold text-sm">
                            {selectedPartner.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{selectedPartner.name}</p>
                          <p className="text-xs text-gray-600">{selectedPartner.organization}</p>
                        </div>
                      </div>
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">Status:</span>
                        <span className={`ml-1 px-2 py-1 text-xs font-semibold rounded-full border ${getVerificationStatusColor(selectedDocument.verified)}`}>
                          {selectedDocument.verified}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">Uploaded:</span> {new Date(selectedDocument.uploadedAt).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowDocumentViewer(false)}
                    className="text-gray-400 hover:text-gray-600 text-2xl"
                  >
                    ×
                  </button>
                </div>
              </div>

              <div className="flex h-[70vh]">
                {/* Document Viewer */}
                <div className="flex-1 p-6 bg-gray-50">
                  <div className="bg-white rounded-lg shadow-lg p-4 h-full overflow-auto">
                    <img
                      src={selectedDocument.url}
                      alt={getDocumentTypeLabel(selectedDocument.type)}
                      className="w-full h-auto max-h-full object-contain"
                    />
                  </div>
                </div>

                {/* Partner & Document Info Sidebar */}
                <div className="w-80 bg-white border-l border-gray-200 p-6 overflow-y-auto">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">📋 Document & Partner Details</h4>

                  {/* Document Information */}
                  <div className="mb-6">
                    <h5 className="text-sm font-semibold text-gray-700 mb-3">Document Information</h5>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Type:</span>
                        <span className="font-medium">{getDocumentTypeLabel(selectedDocument.type)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Status:</span>
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full border ${getVerificationStatusColor(selectedDocument.verified)}`}>
                          {selectedDocument.verified}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Uploaded:</span>
                        <span className="font-medium">{new Date(selectedDocument.uploadedAt).toLocaleDateString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Time:</span>
                        <span className="font-medium">{new Date(selectedDocument.uploadedAt).toLocaleTimeString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">File:</span>
                        <span className="font-medium text-xs">{getDocumentFilename(selectedDocument)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Partner Information */}
                  <div className="mb-6">
                    <h5 className="text-sm font-semibold text-gray-700 mb-3">Partner Information</h5>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="text-gray-600">Name:</span>
                        <p className="font-medium">{selectedPartner.name}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Email:</span>
                        <p className="font-medium">{selectedPartner.email}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Phone:</span>
                        <p className="font-medium">{selectedPartner.phone || 'Not provided'}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Organization:</span>
                        <p className="font-medium">{selectedPartner.organization || 'Individual'}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Partner Type:</span>
                        <p className="font-medium">{selectedPartner.partnerType || 'Not specified'}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Capacity:</span>
                        <p className="font-medium">{selectedPartner.capacity || 'Not specified'}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Service Areas:</span>
                        <p className="font-medium">
                          {selectedPartner.serviceAreas && selectedPartner.serviceAreas.length > 0
                            ? selectedPartner.serviceAreas.join(', ')
                            : 'Not specified'
                          }
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-600">Waste Types:</span>
                        <p className="font-medium">
                          {selectedPartner.supportedWasteTypes && selectedPartner.supportedWasteTypes.length > 0
                            ? selectedPartner.supportedWasteTypes.join(', ')
                            : 'Not specified'
                          }
                        </p>
                      </div>
                      {selectedPartner.address && (
                        <div>
                          <span className="text-gray-600">Address:</span>
                          <p className="font-medium">{selectedPartner.address}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Document Remarks */}
                  {selectedDocument.remarks && (
                    <div className="mb-6">
                      <h5 className="text-sm font-semibold text-gray-700 mb-2">Document Remarks</h5>
                      <div className="bg-gray-50 p-3 rounded text-sm">
                        {selectedDocument.remarks}
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="space-y-2">
                    <a
                      href={selectedDocument.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-center block"
                    >
                      ⬇️ Download Document
                    </a>
                    <button
                      onClick={() => setShowDocumentViewer(false)}
                      className="w-full px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                    >
                      Close Viewer
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Final Verification Modal */}
        {showVerificationModal && selectedPartner && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-gray-900">🎯 Final Verification Decision</h3>
                  <button
                    onClick={() => setShowVerificationModal(false)}
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

                  <div className="bg-gray-50 p-4 rounded-lg mb-4">
                    <h5 className="font-medium text-gray-900 mb-2">Document Verification Summary</h5>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {selectedPartner.documents.filter(d => d.verified === 'approved').length}
                        </div>
                        <div className="text-gray-600">Approved</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-red-600">
                          {selectedPartner.documents.filter(d => d.verified === 'rejected').length}
                        </div>
                        <div className="text-gray-600">Rejected</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-yellow-600">
                          {selectedPartner.documents.filter(d => d.verified === 'pending').length}
                        </div>
                        <div className="text-gray-600">Pending</div>
                      </div>
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Final Remarks (will be sent via email)
                    </label>
                    <textarea
                      value={verificationRemarks}
                      onChange={(e) => setVerificationRemarks(e.target.value)}
                      placeholder="Add final verification remarks..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={4}
                    />
                  </div>

                  <div className="bg-yellow-50 p-4 rounded-lg mb-4">
                    <h6 className="font-medium text-yellow-800 mb-2">⚠️ Impact of Decision:</h6>
                    <ul className="text-sm text-yellow-700 space-y-1">
                      <li>• <strong>Approved:</strong> Partner gains dashboard access and higher AI ranking</li>
                      <li>• <strong>Rejected:</strong> Partner account becomes inactive, no dashboard access</li>
                      <li>• Email notification will be sent to partner with decision and remarks</li>
                    </ul>
                  </div>
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => handleFinalVerification(selectedPartner.id, 'rejected')}
                    className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium"
                  >
                    ❌ Reject Partner
                  </button>
                  <button
                    onClick={() => handleFinalVerification(selectedPartner.id, 'approved')}
                    className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium"
                  >
                    ✅ Approve Partner
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

export default AdminDocumentsPage;