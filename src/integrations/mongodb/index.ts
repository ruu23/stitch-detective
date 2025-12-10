// MongoDB Integration - API wrapper for frontend
// Uses localStorage fallback for Lovable preview, real API when deployed to Vercel

const API_BASE = '/api';
const USE_LOCAL_STORAGE = !import.meta.env.PROD || window.location.hostname.includes('lovable');

// Local storage helpers for development/preview
const getLocalData = (collection: string): Record<string, any> => {
  try {
    const data = localStorage.getItem(`mongodb_${collection}`);
    return data ? JSON.parse(data) : {};
  } catch {
    return {};
  }
};

const setLocalData = (collection: string, data: Record<string, any>) => {
  localStorage.setItem(`mongodb_${collection}`, JSON.stringify(data));
};

// Generic CRUD operations through API (with localStorage fallback)
export async function getDocument<T>(collection: string, id: string): Promise<T | null> {
  if (USE_LOCAL_STORAGE) {
    const data = getLocalData(collection);
    return data[id] || null;
  }
  
  try {
    const response = await fetch(`${API_BASE}/${collection}/${id}`);
    if (!response.ok) return null;
    return response.json();
  } catch (error) {
    console.error(`Error fetching ${collection}/${id}:`, error);
    return null;
  }
}

export async function getDocuments<T>(
  collection: string,
  filters?: Record<string, any>
): Promise<T[]> {
  if (USE_LOCAL_STORAGE) {
    const data = getLocalData(collection);
    let items = Object.values(data) as T[];
    
    // Basic filtering
    if (filters?.userId) {
      items = items.filter((item: any) => item.userId === filters.userId);
    }
    
    return items;
  }
  
  try {
    const params = filters ? new URLSearchParams(filters).toString() : '';
    const response = await fetch(`${API_BASE}/${collection}${params ? `?${params}` : ''}`);
    if (!response.ok) return [];
    return response.json();
  } catch (error) {
    console.error(`Error fetching ${collection}:`, error);
    return [];
  }
}

export async function addDocument<T>(
  collection: string,
  data: Partial<T>
): Promise<{ id: string } & T> {
  if (USE_LOCAL_STORAGE) {
    const id = crypto.randomUUID();
    const localData = getLocalData(collection);
    const newDoc = { ...data, id, createdAt: new Date().toISOString() };
    localData[id] = newDoc;
    setLocalData(collection, localData);
    return newDoc as unknown as { id: string } & T;
  }
  
  const response = await fetch(`${API_BASE}/${collection}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Failed to add document');
  return response.json();
}

export async function updateDocument(
  collection: string,
  id: string,
  data: Record<string, any>
): Promise<void> {
  if (USE_LOCAL_STORAGE) {
    const localData = getLocalData(collection);
    if (localData[id]) {
      localData[id] = { ...localData[id], ...data, updatedAt: new Date().toISOString() };
      setLocalData(collection, localData);
    }
    return;
  }
  
  const response = await fetch(`${API_BASE}/${collection}/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Failed to update document');
}

export async function setDocument(
  collection: string,
  id: string,
  data: Record<string, any>
): Promise<void> {
  if (USE_LOCAL_STORAGE) {
    const localData = getLocalData(collection);
    localData[id] = { ...data, id, updatedAt: new Date().toISOString() };
    setLocalData(collection, localData);
    return;
  }
  
  const response = await fetch(`${API_BASE}/${collection}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Failed to set document');
}

export async function deleteDocument(collection: string, id: string): Promise<void> {
  if (USE_LOCAL_STORAGE) {
    const localData = getLocalData(collection);
    delete localData[id];
    setLocalData(collection, localData);
    return;
  }
  
  const response = await fetch(`${API_BASE}/${collection}/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) throw new Error('Failed to delete document');
}

// Query helpers for filtering
export function where(field: string, op: string, value: any) {
  return { field, op, value };
}

export function orderBy(field: string, direction: 'asc' | 'desc' = 'asc') {
  return { orderByField: field, orderByDirection: direction };
}

// Cloud function invocation
export async function invokeFunction<TInput, TOutput>(
  functionName: string,
  data: TInput
): Promise<TOutput> {
  if (USE_LOCAL_STORAGE) {
    // Mock response for development
    console.log(`[Dev] Function ${functionName} called with:`, data);
    return { success: true, message: 'Development mode - function not executed' } as TOutput;
  }
  
  const response = await fetch(`${API_BASE}/functions/${functionName}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Function call failed' }));
    throw new Error(error.message || 'Function call failed');
  }
  return response.json();
}
