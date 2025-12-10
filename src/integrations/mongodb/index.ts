// MongoDB Integration - API wrapper for frontend
// These functions call your backend API endpoints that interact with MongoDB

const API_BASE = '/api';

// Generic CRUD operations through API
export async function getDocument<T>(collection: string, id: string): Promise<T | null> {
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
  const response = await fetch(`${API_BASE}/${collection}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Failed to set document');
}

export async function deleteDocument(collection: string, id: string): Promise<void> {
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
