import { collection, onSnapshot, query, orderBy, limit, doc, addDoc, updateDoc, deleteDoc, Timestamp, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";
import { formatDistanceToNow, isValid } from "date-fns";

export function subscribeToCollection(collectionName: string, callback: (data: any[]) => void, sortField: string = "createdAt", direction: "asc" | "desc" = "desc", limitCount?: number) {
  let q = query(collection(db, collectionName), orderBy(sortField, direction));
  if (limitCount) {
    q = query(q, limit(limitCount));
  }
  return onSnapshot(q, (snapshot) => {
    const items = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    callback(items);
  });
}

export async function addDocument(collectionName: string, data: any) {
  return addDoc(collection(db, collectionName), {
    ...data,
    createdAt: serverTimestamp()
  });
}

export async function updateDocument(collectionName: string, id: string, data: any) {
  const docRef = doc(db, collectionName, id);
  return updateDoc(docRef, data);
}

export async function deleteDocument(collectionName: string, id: string) {
  const docRef = doc(db, collectionName, id);
  return deleteDoc(docRef);
}

export function formatFirebaseTimestamp(timestamp: any): string {
  if (!timestamp) return "N/A";
  
  let date: Date;

  if (timestamp instanceof Timestamp) {
    date = timestamp.toDate();
  } else if (typeof timestamp === 'object' && timestamp.seconds !== undefined) {
    // Handle plain objects with seconds (common in mock data)
    date = new Date(timestamp.seconds * 1000);
  } else if (timestamp instanceof Date) {
    date = timestamp;
  } else {
    // Fallback for strings or numbers
    date = new Date(timestamp);
  }

  if (!isValid(date)) {
    return "Invalid date";
  }

  return formatDistanceToNow(date, { addSuffix: true });
}

export function resolveName(id: string, map: Record<string, string>): string {
  return map[id] || "Unknown";
}
