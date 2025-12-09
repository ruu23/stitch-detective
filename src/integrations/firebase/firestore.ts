import { db } from './config';
import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  DocumentData,
  QueryConstraint,
  increment
} from 'firebase/firestore';

// Generic collection operations
export const addDocument = async <T extends DocumentData>(
  collectionName: string,
  data: T
) => {
  const docRef = await addDoc(collection(db, collectionName), {
    ...data,
    createdAt: serverTimestamp()
  });
  return { id: docRef.id, ...data };
};

export const setDocument = async <T extends DocumentData>(
  collectionName: string,
  docId: string,
  data: T,
  merge = true
) => {
  await setDoc(doc(db, collectionName, docId), {
    ...data,
    updatedAt: serverTimestamp()
  }, { merge });
  return { id: docId, ...data };
};

export const getDocument = async <T>(
  collectionName: string,
  docId: string
): Promise<(T & { id: string }) | null> => {
  const docSnap = await getDoc(doc(db, collectionName, docId));
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as T & { id: string };
  }
  return null;
};

export const getDocuments = async <T>(
  collectionName: string,
  ...constraints: QueryConstraint[]
): Promise<(T & { id: string })[]> => {
  const q = query(collection(db, collectionName), ...constraints);
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as (T & { id: string })[];
};

export const updateDocument = async <T extends DocumentData>(
  collectionName: string,
  docId: string,
  data: Partial<T>
) => {
  await updateDoc(doc(db, collectionName, docId), {
    ...data,
    updatedAt: serverTimestamp()
  });
  return { id: docId, ...data };
};

export const deleteDocument = async (
  collectionName: string,
  docId: string
) => {
  await deleteDoc(doc(db, collectionName, docId));
};

export const incrementField = async (
  collectionName: string,
  docId: string,
  field: string,
  value: number = 1
) => {
  await updateDoc(doc(db, collectionName, docId), {
    [field]: increment(value),
    updatedAt: serverTimestamp()
  });
};

// Re-export Firestore query helpers
export { where, orderBy, limit, serverTimestamp, collection, doc, query };
