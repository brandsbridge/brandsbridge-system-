import { collection, onSnapshot, query, orderBy, limit, doc, addDoc, updateDoc, deleteDoc, Timestamp, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";
import { formatDistanceToNow } from "date-fns";

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
  const date = timestamp instanceof Timestamp ? timestamp.toDate() : new Date(timestamp);
  return formatDistanceToNow(date, { addSuffix: true });
}

export function resolveName(id: string, map: Record<string, string>): string {
  return map[id] || "Unknown";
}