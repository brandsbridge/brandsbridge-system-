'use client';

import { Firestore, collection, doc, setDoc, Timestamp } from 'firebase/firestore';
import { auth } from '@/lib/firebase';

export const auditService = {
  log: async (
    db: Firestore,
    action: string,
    collectionName: string,
    documentId: string,
    description: string,
    previousValue?: any,
    newValue?: any
  ) => {
    try {
      const ref = doc(collection(db, 'auditLogs'));
      await setDoc(ref, {
        action,
        collection: collectionName,
        documentId,
        performedBy: auth.currentUser?.email || auth.currentUser?.uid || 'unknown',
        performedAt: Timestamp.now(),
        previousValue: previousValue || null,
        newValue: newValue || null,
        description,
      });
    } catch (err) {
      console.error('Audit log failed:', err);
    }
  },
};
