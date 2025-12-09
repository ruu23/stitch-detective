import { storage } from './config';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

export const uploadFile = async (
  path: string,
  file: Blob | File,
  contentType?: string
): Promise<string> => {
  const storageRef = ref(storage, path);
  
  const metadata = contentType ? { contentType } : undefined;
  await uploadBytes(storageRef, file, metadata);
  
  const downloadUrl = await getDownloadURL(storageRef);
  return downloadUrl;
};

export const getFileUrl = async (path: string): Promise<string> => {
  const storageRef = ref(storage, path);
  return getDownloadURL(storageRef);
};

export const deleteFile = async (path: string): Promise<void> => {
  const storageRef = ref(storage, path);
  await deleteObject(storageRef);
};

// Helper to extract path from full URL
export const getPathFromUrl = (url: string): string => {
  try {
    const decodedUrl = decodeURIComponent(url);
    const match = decodedUrl.match(/\/o\/(.+?)\?/);
    return match ? match[1] : '';
  } catch {
    return '';
  }
};
