// Cloudinary Integration for file uploads

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'demo';
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'ml_default';

export async function uploadFile(
  file: Blob | File,
  folder: string = 'uploads'
): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', UPLOAD_PRESET);
  formData.append('folder', folder);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`,
    {
      method: 'POST',
      body: formData,
    }
  );

  if (!response.ok) {
    throw new Error('Failed to upload file to Cloudinary');
  }

  const data = await response.json();
  return data.secure_url;
}

export async function deleteFile(publicId: string): Promise<void> {
  // Note: Deletion requires server-side implementation with API secret
  // This is a placeholder - implement via your backend API
  const response = await fetch(`/api/cloudinary/delete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ publicId }),
  });
  
  if (!response.ok) {
    console.error('Failed to delete file from Cloudinary');
  }
}

export function getPathFromUrl(url: string): string | null {
  try {
    const matches = url.match(/\/v\d+\/(.+)\.\w+$/);
    return matches ? matches[1] : null;
  } catch {
    return null;
  }
}
