'use client';

import { 
  Firestore, 
  collection, 
  doc, 
  addDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors';

/**
 * Standardized base for Firestore mutations with contextual error handling.
 * All functions are non-blocking: they return immediately while the operation 
 * proceeds in the background. Errors are emitted to the global listener.
 */
export const dbService = {
  /**
   * Add a new document to a collection.
   * Injects the current user's UID as 'userId' if available to support security rules.
   */
  create(db: Firestore, colPath: string, data: any) {
    const auth = getAuth();
    const colRef = collection(db, colPath);
    const docData = { 
      ...data, 
      userId: data.userId || auth.currentUser?.uid,
      createdAt: serverTimestamp(), 
      updatedAt: serverTimestamp() 
    };
    
    addDoc(colRef, docData).catch(async (error) => {
      const permissionError = new FirestorePermissionError({
        path: colPath,
        operation: 'create',
        requestResourceData: docData,
      } satisfies SecurityRuleContext);
      errorEmitter.emit('permission-error', permissionError);
    });
  },

  /**
   * Update an existing document.
   */
  update(db: Firestore, colPath: string, docId: string, data: any) {
    const docRef = doc(db, colPath, docId);
    const updateData = { 
      ...data, 
      updatedAt: serverTimestamp() 
    };

    updateDoc(docRef, updateData).catch(async (error) => {
      const permissionError = new FirestorePermissionError({
        path: docRef.path,
        operation: 'update',
        requestResourceData: updateData,
      } satisfies SecurityRuleContext);
      errorEmitter.emit('permission-error', permissionError);
    });
  },

  /**
   * Set a document (create or replace).
   */
  set(db: Firestore, colPath: string, docId: string, data: any, merge = true) {
    const auth = getAuth();
    const docRef = doc(db, colPath, docId);
    const docData = { 
      ...data, 
      userId: data.userId || auth.currentUser?.uid,
      updatedAt: serverTimestamp() 
    };

    setDoc(docRef, docData, { merge }).catch(async (error) => {
      const permissionError = new FirestorePermissionError({
        path: docRef.path,
        operation: 'write',
        requestResourceData: docData,
      } satisfies SecurityRuleContext);
      errorEmitter.emit('permission-error', permissionError);
    });
  },

  /**
   * Delete a document.
   */
  delete(db: Firestore, colPath: string, docId: string) {
    const docRef = doc(db, colPath, docId);

    deleteDoc(docRef).catch(async (error) => {
      const permissionError = new FirestorePermissionError({
        path: docRef.path,
        operation: 'delete',
      } satisfies SecurityRuleContext);
      errorEmitter.emit('permission-error', permissionError);
    });
  }
};