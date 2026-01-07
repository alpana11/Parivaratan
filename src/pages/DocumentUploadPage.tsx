import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { DocumentType, PartnerDocument } from '../types';

const DocumentUploadPage: React.FC = () => {
  const { user, partner, refreshPartner } = useAuth();
  const navigate = useNavigate();
  const [documents, setDocuments] = useState<PartnerDocument[]>([]);
  const [uploading, setUploading] = useState<{[key: string]: boolean}>({});
  const [uploadProgress, setUploadProgress] = useState<{[key: string]: number}>({});
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  useEffect(() => {
    if (partner?.documents) {
      setDocuments(partner.documents);
    }
  }, [partner]);

  const requiredDocuments: {type: DocumentType, label: string, description: string}[] = [
    {
      type: 'registration_certificate',
      label: 'Registration Certificate',
      description: 'Business registration or NGO registration certificate'
    },
    {
      type: 'id_proof',
      label: 'ID Proof',
      description: 'Government issued ID (Aadhaar, PAN, Passport, etc.)'
    },
    {
      type: 'address_proof',
      label: 'Address Proof',
      description: 'Utility bill, bank statement, or rental agreement'
    }
  ];

  const handleFileUpload = async (documentType: DocumentType, file: File) => {
    console.log('Starting demo upload for:', documentType, 'User:', user?.uid);
    if (!user) {
      console.error('No user found for upload');
      setErrors(prev => ({ ...prev, [documentType]: 'User not authenticated. Please sign in again.' }));
      return;
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      setErrors(prev => ({ ...prev, [documentType]: 'Please upload a valid image (JPG, PNG) or PDF file' }));
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setErrors(prev => ({ ...prev, [documentType]: 'File size must be less than 5MB' }));
      return;
    }

    setUploading(prev => ({ ...prev, [documentType]: true }));
    setUploadProgress(prev => ({ ...prev, [documentType]: 0 }));
    setErrors(prev => ({ ...prev, [documentType]: '' }));

    try {
      // Simulate upload progress for demo
      const simulateUpload = () => {
        let progress = 0;
        const interval = setInterval(() => {
          progress += Math.random() * 15 + 5; // Random progress between 5-20%
          if (progress >= 100) {
            progress = 100;
            clearInterval(interval);

            // Create document object with blob URL for demo
            const blobUrl = URL.createObjectURL(file);
            const newDocument: PartnerDocument = {
              type: documentType,
              url: blobUrl,
              uploadedAt: new Date().toISOString(),
              verified: 'pending',
              remarks: undefined
            };

            // Update documents array
            const updatedDocuments = documents.filter(doc => doc.type !== documentType);
            updatedDocuments.push(newDocument);

            setDocuments(updatedDocuments);
            setUploadProgress(prev => ({ ...prev, [documentType]: 100 }));

            // Clear progress after a moment
            setTimeout(() => {
              setUploadProgress(prev => ({ ...prev, [documentType]: 0 }));
              setUploading(prev => ({ ...prev, [documentType]: false }));
            }, 1000);

          } else {
            setUploadProgress(prev => ({ ...prev, [documentType]: Math.round(progress) }));
          }
        }, 200); // Update every 200ms
      };

      simulateUpload();

    } catch (error) {
      console.error('Error in demo upload:', error);
      setErrors(prev => ({ ...prev, [documentType]: 'Failed to upload document. Please try again.' }));
      setUploading(prev => ({ ...prev, [documentType]: false }));
    }
  };

  const getDocumentStatus = (type: DocumentType) => {
    const doc = documents.find(d => d.type === type);
    return doc ? doc.verified : 'not_uploaded';
  };

  const getDocumentUrl = (type: DocumentType) => {
    const doc = documents.find(d => d.type === type);
    return doc?.url;
  };

  const isAllDocumentsUploaded = () => {
    return requiredDocuments.every(doc => getDocumentStatus(doc.type) !== 'not_uploaded');
  };

  const handleSubmitForVerification = () => {
    if (!user || !isAllDocumentsUploaded()) return;

    // For demo purposes, just navigate to verification pending page
    navigate('/verification-pending');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'text-green-600 bg-green-100';
      case 'rejected': return 'text-red-600 bg-red-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'approved': return 'Approved';
      case 'rejected': return 'Rejected';
      case 'pending': return 'Pending Review';
      default: return 'Not Uploaded';
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent mb-2">Parivartan</h1>
          <h2 className="text-3xl font-extrabold text-gray-900">Document Upload</h2>
          <p className="mt-2 text-sm text-gray-600">
            Please upload the required documents for verification
          </p>
        </div>

        <div className="bg-white/90 backdrop-blur-sm py-8 px-6 shadow-2xl rounded-2xl border border-gray-100">
          <div className="space-y-6">
            {requiredDocuments.map((doc) => {
              const status = getDocumentStatus(doc.type);
              const isUploading = uploading[doc.type];
              const progress = uploadProgress[doc.type];
              const error = errors[doc.type];

              return (
                <div key={doc.type}>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {doc.label} {doc.type !== 'registration_certificate' ? '(Required)' : '(Optional)'}
                  </label>
                  <p className="text-xs text-gray-500 mb-3">{doc.description}</p>

                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                    <input
                      type="file"
                      id={doc.type}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          handleFileUpload(doc.type, file);
                        }
                      }}
                      accept=".pdf,.jpg,.jpeg,.png"
                      className="hidden"
                      disabled={isUploading}
                    />
                    <label
                      htmlFor={doc.type}
                      className={`cursor-pointer inline-block px-6 py-3 rounded-lg transition-colors ${
                        isUploading
                          ? 'bg-gray-400 cursor-not-allowed'
                          : status === 'not_uploaded'
                          ? 'bg-blue-500 hover:bg-blue-600 text-white'
                          : 'bg-green-500 hover:bg-green-600 text-white'
                      }`}
                    >
                      {isUploading ? 'Uploading...' : status === 'not_uploaded' ? `📄 Upload ${doc.label}` : '📄 Re-upload'}
                    </label>
                    <p className="text-xs text-gray-500 mt-2">PDF, JPG, PNG files only (max 5MB)</p>
                  </div>

                  {isUploading && progress > 0 && (
                    <div className="mt-3">
                      <div className="bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${progress}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-gray-600 mt-1">{progress}% uploaded</p>
                    </div>
                  )}

                  {status !== 'not_uploaded' && !isUploading && (
                    <div className="mt-3 p-3 bg-green-50 rounded-lg flex justify-between items-center">
                      <div className="flex items-center space-x-2">
                        <span className="text-green-600">✅</span>
                        <span className="text-green-800 text-sm">Uploaded successfully</span>
                      </div>
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(status)}`}>
                        {getStatusText(status)}
                      </span>
                    </div>
                  )}

                  {error && (
                    <div className="mt-3 p-3 bg-red-50 rounded-lg">
                      <p className="text-red-800 text-sm">❌ {error}</p>
                    </div>
                  )}
                </div>
              );
            })}

            <div className="pt-4">
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-4">
                  {isAllDocumentsUploaded() ? 'All documents uploaded successfully!' : 'Please upload all required documents'}
                </p>

                {isAllDocumentsUploaded() && (
                  <button
                    onClick={handleSubmitForVerification}
                    className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-lg text-sm font-semibold text-white bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700 transform hover:scale-105 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
                  >
                    Submit for Verification
                  </button>
                )}

                <p className="text-xs text-gray-500 mt-2">
                  Demo Mode: Documents are stored locally in your browser
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentUploadPage;
