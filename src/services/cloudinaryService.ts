// Cloudinary Upload Service - Free Alternative to Firebase Storage
// Sign up: https://cloudinary.com/users/register/free

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export const cloudinaryService = {
  // Get these from: https://console.cloudinary.com/
  cloudName: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'your-cloud-name',
  uploadPreset: import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'your-upload-preset',

  /**
   * Upload file to Cloudinary
   * @param file - File to upload
   * @param folder - Folder name in Cloudinary (e.g., 'partner-documents')
   * @param onProgress - Progress callback
   * @returns Promise with secure URL
   */
  async uploadFile(
    file: File,
    folder: string = 'partner-documents',
    onProgress?: (progress: UploadProgress) => void
  ): Promise<string> {
    // Validate credentials
    if (!this.cloudName || this.cloudName === 'your-cloud-name') {
      throw new Error('Cloudinary cloud name not configured. Check .env file.');
    }
    if (!this.uploadPreset || this.uploadPreset === 'your-upload-preset') {
      throw new Error('Cloudinary upload preset not configured. Check .env file.');
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', this.uploadPreset);
    formData.append('folder', folder);

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      
      // Track upload progress
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable && onProgress) {
          onProgress({
            loaded: e.loaded,
            total: e.total,
            percentage: Math.round((e.loaded / e.total) * 100)
          });
        }
      });

      xhr.addEventListener('load', () => {
        console.log('📥 Cloudinary response status:', xhr.status);
        console.log('📥 Cloudinary response text:', xhr.responseText);
        
        if (xhr.status === 200) {
          try {
            const response = JSON.parse(xhr.responseText);
            console.log('✅ Cloudinary full response:', response);
            console.log('🔗 secure_url:', response.secure_url);
            console.log('🔗 url:', response.url);
            
            const fileUrl = response.secure_url || response.url;
            
            if (!fileUrl) {
              console.error('❌ No URL in response. Full response:', JSON.stringify(response, null, 2));
              reject(new Error('Cloudinary did not return a URL. Check upload preset configuration.'));
              return;
            }
            
            console.log('✅ Cloudinary upload success:', fileUrl);
            resolve(fileUrl);
          } catch (parseError) {
            console.error('❌ Failed to parse response:', parseError);
            console.error('❌ Raw response:', xhr.responseText);
            reject(new Error('Invalid response from Cloudinary'));
          }
        } else {
          console.error('❌ Cloudinary upload failed. Status:', xhr.status);
          console.error('❌ Response:', xhr.responseText);
          reject(new Error(`Upload failed with status ${xhr.status}: ${xhr.responseText}`));
        }
      });

      xhr.addEventListener('error', () => {
        console.error('❌ Network error during upload');
        reject(new Error('Network error'));
      });

      console.log('🚀 Uploading to Cloudinary...');
      console.log('📍 Cloud name:', this.cloudName);
      console.log('📍 Upload preset:', this.uploadPreset);
      console.log('📍 Folder:', folder);
      
      xhr.open('POST', `https://api.cloudinary.com/v1_1/${this.cloudName}/upload`);
      xhr.send(formData);
    });
  },

  /**
   * Delete file from Cloudinary (requires backend for security)
   * For now, files remain in Cloudinary (free tier has 25GB)
   */
  async deleteFile(): Promise<void> {
    console.warn('Delete requires backend API with Cloudinary API secret');
    // Implement backend endpoint if needed
  }
};
