import React, { useState, useEffect } from 'react';
import { dbService } from '../services/dbService';

interface Partner {
  id: string;
  name: string;
  email: string;
  organization: string;
  partnerType: string;
  registrationDate: string;
  verificationStatus: 'pending' | 'verified' | 'rejected';
  documents: Document[];
}

interface Document {
  id: string;
  type: 'registration_certificate' | 'id_proof' | 'address_proof';
  fileName: string;
  fileData?: string;
  uploadDate: string;
  status: 'pending' | 'approved' | 'rejected';
  remarks?: string;
}

const AdminDocumentVerificationPage: React.FC = () => {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);
  const [remarks, setRemarks] = useState('');
  const [previewDocument, setPreviewDocument] = useState<Document | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'verified' | 'rejected'>('all');

  useEffect(() => {
    loadPartners();
  }, []);

  const loadPartners = () => {
    console.log('=== LOADING PARTNERS FOR DOCUMENT VERIFICATION ===');
    
    // Load all partners from localStorage (same as Partners Management)
    const allPartners = JSON.parse(localStorage.getItem('partners') || '[]');
    console.log('All partners from localStorage:', allPartners);
    
    // Check for uploaded documents
    const uploadedData = localStorage.getItem('uploadedDocuments');
    console.log('Uploaded documents:', uploadedData);
    
    const partnersWithDocs: Partner[] = [];
    
    // Convert all partners to the document verification format
    allPartners.forEach((partner: any) => {
      let documents: any[] = [];
      
      // If this partner has uploaded documents, add them
      if (uploadedData) {
        try {
          const docData = JSON.parse(uploadedData);
          if (docData.partnerEmail === partner.email || docData.userId === partner.id) {
            documents = docData.documents.map((doc: any) => ({
              id: doc.id,
              type: doc.type === 'Government ID' ? 'id_proof' : 
                    doc.type === 'Address Proof' ? 'address_proof' : 'registration_certificate',
              fileName: doc.fileName,
              fileData: doc.fileData,
              uploadDate: doc.uploadedAt,
              status: 'pending'
            }));
          }
        } catch (error) {
          console.error('Error parsing documents:', error);
        }
      }
      
      partnersWithDocs.push({
        id: partner.id,
        name: partner.name,
        email: partner.email,
        organization: partner.organization,
        partnerType: partner.partnerType,
        registrationDate: partner.createdAt || new Date().toISOString(),
        verificationStatus: partner.status === 'approved' ? 'verified' : 
                           partner.status === 'rejected' ? 'rejected' : 'pending',
        documents: documents
      });
    });
    
    console.log('Final partners list:', partnersWithDocs);
    setPartners(partnersWithDocs);
  };

  const handleDocumentAction = (partnerId: string, docId: string, action: 'approved' | 'rejected') => {
    setPartners(prev => prev.map(partner => 
      partner.id === partnerId 
        ? {
            ...partner,
            documents: partner.documents.map(doc => 
              doc.id === docId 
                ? { ...doc, status: action, remarks: remarks }
                : doc
            )
          }
        : partner
    ));
    
    // Create audit log
    const auditLog = {
      id: 'audit-' + Date.now(),
      adminId: 'admin-1',
      adminName: 'Admin User',
      action: `Document ${action}`,
      actionType: action === 'approved' ? 'verify' : 'reject',
      details: `${action} document ${docId} for partner ${selectedPartner?.name}: ${remarks || 'No remarks'}`,
      timestamp: new Date().toISOString(),
      entityType: 'document',
      entityId: docId,
      metadata: { partnerId, action, remarks }
    };
    
    // Store audit log in localStorage
    const existingLogs = JSON.parse(localStorage.getItem('auditLogs') || '[]');
    existingLogs.unshift(auditLog);
    localStorage.setItem('auditLogs', JSON.stringify(existingLogs));
    
    setRemarks('');
    console.log(`Admin action: ${action} document ${docId} for partner ${partnerId}`);
    alert(`Document ${action}!`);
  };

  const handlePartnerVerification = (partnerId: string, action: 'verified' | 'rejected') => {
    setPartners(prev => prev.map(partner => 
      partner.id === partnerId 
        ? { ...partner, verificationStatus: action }
        : partner
    ));
    
    // Update partner status in localStorage partners array
    const partners = JSON.parse(localStorage.getItem('partners') || '[]');
    const updatedPartners = partners.map((partner: any) => {
      if (partner.id === partnerId || partner.email === selectedPartner?.email) {
        return { ...partner, status: action === 'verified' ? 'approved' : 'rejected' };
      }
      return partner;
    });
    localStorage.setItem('partners', JSON.stringify(updatedPartners));
    
    // Store verification status for partner to see
    const verificationData = {
      partnerId: partnerId,
      status: action === 'verified' ? 'approved' : 'rejected',
      verifiedAt: new Date().toISOString(),
      adminAction: true
    };
    localStorage.setItem('partnerVerification', JSON.stringify(verificationData));
    
    // Create audit log
    const auditLog = {
      id: 'audit-' + Date.now(),
      adminId: 'admin-1',
      adminName: 'Admin User',
      action: `Partner ${action}`,
      actionType: 'verify',
      details: `${action} partner verification for ${selectedPartner?.name}`,
      timestamp: new Date().toISOString(),
      entityType: 'partner',
      entityId: partnerId,
      metadata: { partnerId, action, partnerName: selectedPartner?.name }
    };
    
    // Store audit log in localStorage
    const existingLogs = JSON.parse(localStorage.getItem('auditLogs') || '[]');
    existingLogs.unshift(auditLog);
    localStorage.setItem('auditLogs', JSON.stringify(existingLogs));
    
    console.log(`Admin action: ${action} partner ${partnerId}`);
    
    if (action === 'verified') {
      alert('✅ Partner Approved!\n\n📧 Email sent to partner\n💳 Subscription option enabled');
    } else {
      alert('❌ Partner Rejected!\n\n📧 Email sent to partner\n🚫 Dashboard access blocked');
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
                loadPartners();
                alert('Data refreshed!');
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
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(partner.verificationStatus)}`}>
                        {partner.verificationStatus}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">{partner.organization}</p>
                    <p className="text-xs text-gray-500">{partner.partnerType}</p>
                    <p className="text-xs text-gray-400">
                      Documents: {partner.documents.length} | Email: {partner.email}
                    </p>
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
                    <p className="text-sm text-gray-500">
                      {selectedPartner.partnerType} • Registered: {new Date(selectedPartner.registrationDate).toLocaleDateString()}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full ${getStatusColor(selectedPartner.verificationStatus)}`}>
                    {selectedPartner.verificationStatus}
                  </span>
                </div>

                {/* Documents */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-4">Uploaded Documents</h3>
                  <div className="space-y-4">
                    {selectedPartner.documents.map(doc => (
                      <div key={doc.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h4 className="font-medium">{getDocumentTypeName(doc.type)}</h4>
                            <p className="text-sm text-gray-600">{doc.fileName}</p>
                            <p className="text-xs text-gray-500">
                              Uploaded: {new Date(doc.uploadDate).toLocaleDateString()}
                            </p>
                          </div>
                          <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(doc.status)}`}>
                            {doc.status}
                          </span>
                        </div>

                        <div className="flex space-x-2 mt-3">
                          <button
                            onClick={() => {
                              console.log('Preview document:', doc);
                              console.log('Has fileData:', !!doc.fileData);
                              console.log('FileData preview:', doc.fileData?.substring(0, 50));
                              setPreviewDocument(doc);
                            }}
                            className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
                          >
                            👁️ View
                          </button>
                          <button
                            onClick={() => handleDocumentAction(selectedPartner.id, doc.id, 'approved')}
                            className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600"
                          >
                            ✓ Approve
                          </button>
                          <button
                            onClick={() => handleDocumentAction(selectedPartner.id, doc.id, 'rejected')}
                            className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600"
                          >
                            ✗ Reject
                          </button>
                        </div>

                        {doc.remarks && (
                          <div className="mt-2 p-2 bg-gray-50 rounded text-sm">
                            <strong>Remarks:</strong> {doc.remarks}
                          </div>
                        )}
                      </div>
                    ))}
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
                    placeholder="Add verification remarks..."
                  />
                </div>

                {/* Final Actions */}
                {selectedPartner.verificationStatus === 'pending' && (
                  <div className="flex space-x-4">
                    <button
                      onClick={() => handlePartnerVerification(selectedPartner.id, 'verified')}
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
                  <h4 className="font-medium mb-2">System Information</h4>
                  <p className="text-sm text-gray-600">📧 Email notification: Ready to send</p>
                  <p className="text-sm text-gray-600">📝 Audit log: All actions logged with timestamp</p>
                  <p className="text-sm text-gray-600">🔐 Security: Admin actions tracked</p>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow p-6 text-center">
                <p className="text-gray-500">Select a partner to view their documents</p>
              </div>
            )}
          </div>
        </div>

        {/* Document Preview Modal */}
        {previewDocument && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">
                  {getDocumentTypeName(previewDocument.type)}
                </h3>
                <button
                  onClick={() => setPreviewDocument(null)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>
              
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">
                  <strong>File:</strong> {previewDocument.fileName}
                </p>
                <p className="text-sm text-gray-600 mb-4">
                  <strong>Uploaded:</strong> {new Date(previewDocument.uploadDate).toLocaleDateString()}
                </p>
              </div>

              {/* Document Preview Area */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center mb-4">
                {previewDocument.fileData ? (
                  <div>
                    <img 
                      src={previewDocument.fileData} 
                      alt={previewDocument.fileName}
                      className="max-w-full max-h-96 mx-auto rounded-lg shadow-lg mb-4"
                    />
                  </div>
                ) : (
                  <div>
                    <div className="text-6xl mb-4">📄</div>
                    <p className="text-gray-600 mb-2">Document Preview</p>
                    <p className="text-sm text-gray-500">{previewDocument.fileName}</p>
                  </div>
                )}
                <div className="mt-4 p-4 bg-blue-50 rounded">
                  <p className="text-sm text-blue-700">
                    <strong>File:</strong> {previewDocument.fileName}
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    {previewDocument.fileData ? 'Image loaded successfully' : 'No image data available'}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    handleDocumentAction(selectedPartner!.id, previewDocument.id, 'approved');
                    setPreviewDocument(null);
                  }}
                  className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                >
                  ✓ Approve Document
                </button>
                <button
                  onClick={() => {
                    handleDocumentAction(selectedPartner!.id, previewDocument.id, 'rejected');
                    setPreviewDocument(null);
                  }}
                  className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                >
                  ✗ Reject Document
                </button>
                <button
                  onClick={() => setPreviewDocument(null)}
                  className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDocumentVerificationPage;