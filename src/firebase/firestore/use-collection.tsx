'use client';

import { useState, useEffect } from 'react';
import {
  Query,
  onSnapshot,
  DocumentData,
  FirestoreError,
  QuerySnapshot,
  CollectionReference,
} from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { useAuth } from '../provider';

export type WithId<T> = T & { id: string };

export interface UseCollectionResult<T> {
  data: WithId<T>[] | null;
  isLoading: boolean;
  error: FirestoreError | Error | null;
}

/**
 * Safely extracts path for error context without using private properties.
 */
function getSafePath(ref: any): string {
  if (!ref) return "unknown";
  // CollectionReference has a .path property.
  if (ref.path) return ref.path;
  // For queries, we try to indicate it's a filtered set of documents
  return "queried-collection";
}

export function useCollection<T = any>(
    memoizedTargetRefOrQuery: ((CollectionReference<DocumentData> | Query<DocumentData>) & {__memo?: boolean})  | null | undefined,
): UseCollectionResult<T> {
  const [data, setData] = useState<WithId<T>[] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<FirestoreError | Error | null>(null);
  const auth = useAuth();

  useEffect(() => {
    // CRITICAL: Prevent query firing if auth session is not confirmed.
    // This is the primary defense against 'Missing or insufficient permissions' 
    // errors during the initial hydration/auth handshake.
    if (!auth?.currentUser || !memoizedTargetRefOrQuery) {
      setData(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    const unsubscribe = onSnapshot(
      memoizedTargetRefOrQuery,
      (snapshot: QuerySnapshot<DocumentData>) => {
        const results: WithId<T>[] = snapshot.docs.map(doc => ({
          ...(doc.data() as T),
          id: doc.id
        }));
        setData(results);
        setError(null);
        setIsLoading(false);
      },
      (err: FirestoreError) => {
        // Create contextual error for the development overlay
        const contextualError = new FirestorePermissionError({
          operation: 'list',
          path: getSafePath(memoizedTargetRefOrQuery),
        })

        setError(contextualError)
        setData(null)
        setIsLoading(false)
        
        // Emit error to the global listener
        errorEmitter.emit('permission-error', contextualError);
      }
    );

    return () => unsubscribe();
  }, [memoizedTargetRefOrQuery, auth?.currentUser]);

  // Next.js 15 safety: warn if hooks are called with unmemoized volatile references
  if(memoizedTargetRefOrQuery && !memoizedTargetRefOrQuery.__memo) {
    throw new Error('Firestore query/collection was not properly memoized using useMemoFirebase');
  }

  return { data, isLoading, error };
}