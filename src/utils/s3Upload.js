const API_BASE = '/api';

/**
 * Uploads a file (File, Blob, or base64 string) to AWS S3 via the backend upload endpoint.
 * @param {File|Blob|string} file - The file, blob, or data URI to upload.
 * @param {string} folder - Destination folder on S3 ('workers', 'kyc', 'services', 'banners', etc.)
 * @returns {Promise<string>} The public S3 URL of the uploaded file.
 */
export async function uploadFileToS3(file, folder = 'media') {
  if (!file) return null;

  // If already an HTTP/HTTPS URL, return it directly
  if (typeof file === 'string') {
    if (file.startsWith('http://') || file.startsWith('https://')) {
      return file;
    }
    // If it's a data URI or base64 string, upload via base64 endpoint
    if (file.startsWith('data:') || file.length > 200) {
      const res = await fetch(`${API_BASE}/upload/base64`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ base64: file, folder }),
      });
      const data = await res.json();
      if (data && data.url) {
        return data.url;
      }
    }
  }

  // File or Blob upload via multipart/form-data
  const formData = new FormData();
  formData.append('file', file);
  formData.append('folder', folder);

  const res = await fetch(`${API_BASE}/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    throw new Error(`Upload failed with status ${res.status}`);
  }

  const data = await res.json();
  if (data && data.url) {
    return data.url;
  }
  throw new Error('Upload failed: no URL returned');
}

export default uploadFileToS3;
