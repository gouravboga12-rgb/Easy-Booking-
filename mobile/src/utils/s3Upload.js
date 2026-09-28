import { API_BASE_URL } from '../config';

/**
 * Uploads a file (File, Blob, or base64 string) to AWS S3 via the backend upload endpoint.
 */
export async function uploadFileToS3(file, folder = 'media') {
  if (!file) return null;

  if (typeof file === 'string') {
    if (file.startsWith('http://') || file.startsWith('https://')) {
      return file;
    }
    if (file.startsWith('data:') || file.length > 200) {
      const res = await fetch(`${API_BASE_URL}/upload/base64`, {
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

  const formData = new FormData();
  formData.append('file', file);
  formData.append('folder', folder);

  const res = await fetch(`${API_BASE_URL}/upload`, {
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
