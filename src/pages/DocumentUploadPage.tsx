import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const DocumentUploadPage: React.FC = () => {
  const [uploadedFiles, setUploadedFiles] = useState<{
    governmentId: File | null;
    addressProof: File | null;
    businessRegistration: File | null;
    bankAccount: File | null;
  }>({
    governmentId: null,
    addressProof: null,
    businessRegistration: null,
    bankAccount: null,
  });
  const navigate = useNavigate();

  const handleFileChange = (documentType: keyof typeof uploadedFiles) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setUploadedFiles(prev => ({
      ...prev,
      [documentType]: file,
    }));
  };

  const removeFile = (documentType: keyof typeof uploadedFiles) => {
    setUploadedFiles(prev => ({
      ...prev,
      [documentType]: null,
    }));
  };

  const handleSubmit = () => {
    // Mock submission
    console.log('Documents uploaded:', uploadedFiles);
    navigate('/verification-pending');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-blue-50 to-indigo-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h1 className="text-4xl font-bold text-center bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent mb-2">Parivartan</h1>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Document Upload
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Please upload the required documents for verification
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white/90 backdrop-blur-sm py-8 px-4 shadow-2xl sm:rounded-2xl sm:px-10 border border-gray-100">
          <div className="space-y-6">
            {/* Government ID Upload */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Government ID (Aadhar/PAN/Driving License)
              </label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-xl hover:border-emerald-400 transition-colors duration-200 bg-gray-50 hover:bg-emerald-50/50">
                <div className="space-y-1 text-center">
                  <svg
                    className="mx-auto h-8 w-8 text-gray-400 hover:text-emerald-500 transition-colors duration-200"
                    stroke="currentColor"
                    fill="none"
                    viewBox="0 0 48 48"
                    aria-hidden="true"
                  >
                    <path
                      d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <div className="flex text-sm text-gray-600">
                    <label
                      htmlFor="government-id-upload"
                      className="relative cursor-pointer bg-white rounded-lg font-semibold text-emerald-600 hover:text-emerald-700 px-3 py-1 border border-emerald-300 hover:border-emerald-400 transition-all duration-200"
                    >
                      <span>Upload file</span>
                      <input
                        id="government-id-upload"
                        name="government-id-upload"
                        type="file"
                        className="sr-only"
                        onChange={handleFileChange('governmentId')}
                        accept=".pdf,.jpg,.jpeg,.png"
                      />
                    </label>
                    <p className="pl-1 self-center">or drag and drop</p>
                  </div>
                  <p className="text-xs text-gray-500">PDF, JPG, PNG up to 10MB</p>
                </div>
              </div>
              {uploadedFiles.governmentId && (
                <div className="mt-3 flex items-center justify-between bg-gradient-to-r from-gray-50 to-gray-100 p-3 rounded-lg border border-gray-200">
                  <span className="text-sm text-gray-700 font-medium">{uploadedFiles.governmentId.name}</span>
                  <button
                    onClick={() => removeFile('governmentId')}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1 rounded-full transition-all duration-200"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              )}
            </div>

            {/* Address Proof Upload */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Address Proof
              </label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-xl hover:border-blue-400 transition-colors duration-200 bg-gray-50 hover:bg-blue-50/50">
                <div className="space-y-1 text-center">
                  <svg
                    className="mx-auto h-8 w-8 text-gray-400 hover:text-blue-500 transition-colors duration-200"
                    stroke="currentColor"
                    fill="none"
                    viewBox="0 0 48 48"
                    aria-hidden="true"
                  >
                    <path
                      d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <div className="flex text-sm text-gray-600">
                    <label
                      htmlFor="address-proof-upload"
                      className="relative cursor-pointer bg-white rounded-lg font-semibold text-blue-600 hover:text-blue-700 px-3 py-1 border border-blue-300 hover:border-blue-400 transition-all duration-200"
                    >
                      <span>Upload file</span>
                      <input
                        id="address-proof-upload"
                        name="address-proof-upload"
                        type="file"
                        className="sr-only"
                        onChange={handleFileChange('addressProof')}
                        accept=".pdf,.jpg,.jpeg,.png"
                      />
                    </label>
                    <p className="pl-1 self-center">or drag and drop</p>
                  </div>
                  <p className="text-xs text-gray-500">PDF, JPG, PNG up to 10MB</p>
                </div>
              </div>
              {uploadedFiles.addressProof && (
                <div className="mt-3 flex items-center justify-between bg-gradient-to-r from-gray-50 to-gray-100 p-3 rounded-lg border border-gray-200">
                  <span className="text-sm text-gray-700 font-medium">{uploadedFiles.addressProof.name}</span>
                  <button
                    onClick={() => removeFile('addressProof')}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1 rounded-full transition-all duration-200"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              )}
            </div>

            {/* Business Registration Upload */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Business Registration (if applicable)
              </label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-xl hover:border-indigo-400 transition-colors duration-200 bg-gray-50 hover:bg-indigo-50/50">
                <div className="space-y-1 text-center">
                  <svg
                    className="mx-auto h-8 w-8 text-gray-400 hover:text-indigo-500 transition-colors duration-200"
                    stroke="currentColor"
                    fill="none"
                    viewBox="0 0 48 48"
                    aria-hidden="true"
                  >
                    <path
                      d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <div className="flex text-sm text-gray-600">
                    <label
                      htmlFor="business-registration-upload"
                      className="relative cursor-pointer bg-white rounded-lg font-semibold text-indigo-600 hover:text-indigo-700 px-3 py-1 border border-indigo-300 hover:border-indigo-400 transition-all duration-200"
                    >
                      <span>Upload file</span>
                      <input
                        id="business-registration-upload"
                        name="business-registration-upload"
                        type="file"
                        className="sr-only"
                        onChange={handleFileChange('businessRegistration')}
                        accept=".pdf,.jpg,.jpeg,.png"
                      />
                    </label>
                    <p className="pl-1 self-center">or drag and drop</p>
                  </div>
                  <p className="text-xs text-gray-500">PDF, JPG, PNG up to 10MB</p>
                </div>
              </div>
              {uploadedFiles.businessRegistration && (
                <div className="mt-3 flex items-center justify-between bg-gradient-to-r from-gray-50 to-gray-100 p-3 rounded-lg border border-gray-200">
                  <span className="text-sm text-gray-700 font-medium">{uploadedFiles.businessRegistration.name}</span>
                  <button
                    onClick={() => removeFile('businessRegistration')}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1 rounded-full transition-all duration-200"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              )}
            </div>

            {/* Bank Account Details Upload */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Bank Account Details
              </label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-xl hover:border-purple-400 transition-colors duration-200 bg-gray-50 hover:bg-purple-50/50">
                <div className="space-y-1 text-center">
                  <svg
                    className="mx-auto h-8 w-8 text-gray-400 hover:text-purple-500 transition-colors duration-200"
                    stroke="currentColor"
                    fill="none"
                    viewBox="0 0 48 48"
                    aria-hidden="true"
                  >
                    <path
                      d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <div className="flex text-sm text-gray-600">
                    <label
                      htmlFor="bank-account-upload"
                      className="relative cursor-pointer bg-white rounded-lg font-semibold text-purple-600 hover:text-purple-700 px-3 py-1 border border-purple-300 hover:border-purple-400 transition-all duration-200"
                    >
                      <span>Upload file</span>
                      <input
                        id="bank-account-upload"
                        name="bank-account-upload"
                        type="file"
                        className="sr-only"
                        onChange={handleFileChange('bankAccount')}
                        accept=".pdf,.jpg,.jpeg,.png"
                      />
                    </label>
                    <p className="pl-1 self-center">or drag and drop</p>
                  </div>
                  <p className="text-xs text-gray-500">PDF, JPG, PNG up to 10MB</p>
                </div>
              </div>
              {uploadedFiles.bankAccount && (
                <div className="mt-3 flex items-center justify-between bg-gradient-to-r from-gray-50 to-gray-100 p-3 rounded-lg border border-gray-200">
                  <span className="text-sm text-gray-700 font-medium">{uploadedFiles.bankAccount.name}</span>
                  <button
                    onClick={() => removeFile('bankAccount')}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1 rounded-full transition-all duration-200"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              )}
            </div>

            <div>
              <button
                onClick={handleSubmit}
                disabled={!uploadedFiles.governmentId || !uploadedFiles.addressProof}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-lg text-sm font-semibold text-white bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700 transform hover:scale-105 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                Submit for Verification
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentUploadPage;