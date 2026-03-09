import { useState, useEffect, useCallback } from 'react';
import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  QueryConstraint,
  DocumentData,
  DocumentReference,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { offlineManager } from './offlineManager';

interface NetworkStatus {
  isOnline: boolean;
  isSyncing: boolean;
}

export function useNetworkStatus(): NetworkStatus {
  const [isOnline, setIsOnline] = useState<boolean>(offlineManager.getIsOnline());
  const [isSyncing, setIsSyncing] = useState<boolean>(offlineManager.getIsSyncing());

  useEffect(() => {
    const checkStatus = setInterval(() => {
      setIsOnline(offlineManager.getIsOnline());
      setIsSyncing(offlineManager.getIsSyncing());
    }, 1000);

    const unsubSyncing = offlineManager.on('syncing', () => {
      setIsSyncing(true);
    });

    const unsubSynced = offlineManager.on('synced', () => {
      setIsSyncing(false);
    });

    const unsubError = offlineManager.on('error', () => {
      setIsSyncing(false);
    });

    return () => {
      clearInterval(checkStatus);
      unsubSyncing();
      unsubSynced();
      unsubError();
    };
  }, []);

  return { isOnline, isSyncing };
}

interface OfflineDataOperations {
  createDocument: (
    collectionPath: string,
    docId: string,
    data: Record<string, unknown>,
  ) => Promise<void>;
  updateDocument: (
    collectionPath: string,
    docId: string,
    data: Record<string, unknown>,
  ) => Promise<void>;
  deleteDocument: (collectionPath: string, docId: string) => Promise<void>;
  fetchDocument: (
    collectionPath: string,
    docId: string,
  ) => Promise<Record<string, unknown> | null>;
  fetchCollection: (
    collectionPath: string,
    constraints?: QueryConstraint[],
  ) => Promise<Record<string, unknown>[]>;
  pendingCount: number;
}

export function useOfflineData(): OfflineDataOperations {
  const [pendingCount, setPendingCount] = useState<number>(0);
  const { isOnline } = useNetworkStatus();

  useEffect(() => {
    const updateCount = async () => {
      const count = await offlineManager.getQueueLength();
      setPendingCount(count);
    };

    updateCount();

    const unsubSynced = offlineManager.on('synced', () => {
      updateCount();
    });

    const unsubError = offlineManager.on('error', () => {
      updateCount();
    });

    return () => {
      unsubSynced();
      unsubError();
    };
  }, []);

  const createDocument = useCallback(
    async (
      collectionPath: string,
      docId: string,
      data: Record<string, unknown>,
    ): Promise<void> => {
      if (isOnline) {
        try {
          const docRef: DocumentReference<DocumentData> = doc(
            collection(db, collectionPath),
            docId,
          );
          await setDoc(docRef, data);
          return;
        } catch {
          // Fall through to offline queue
        }
      }

      await offlineManager.enqueue({
        type: 'create',
        collection: collectionPath,
        docId,
        data,
      });
    },
    [isOnline],
  );

  const updateDocument = useCallback(
    async (
      collectionPath: string,
      docId: string,
      data: Record<string, unknown>,
    ): Promise<void> => {
      if (isOnline) {
        try {
          const docRef: DocumentReference<DocumentData> = doc(
            collection(db, collectionPath),
            docId,
          );
          await updateDoc(docRef, data);
          return;
        } catch {
          // Fall through to offline queue
        }
      }

      await offlineManager.enqueue({
        type: 'update',
        collection: collectionPath,
        docId,
        data,
      });
    },
    [isOnline],
  );

  const deleteDocument = useCallback(
    async (collectionPath: string, docId: string): Promise<void> => {
      if (isOnline) {
        try {
          const docRef: DocumentReference<DocumentData> = doc(
            collection(db, collectionPath),
            docId,
          );
          await deleteDoc(docRef);
          return;
        } catch {
          // Fall through to offline queue
        }
      }

      await offlineManager.enqueue({
        type: 'delete',
        collection: collectionPath,
        docId,
      });
    },
    [isOnline],
  );

  const fetchDocument = useCallback(
    async (
      collectionPath: string,
      docId: string,
    ): Promise<Record<string, unknown> | null> => {
      const docRef: DocumentReference<DocumentData> = doc(
        collection(db, collectionPath),
        docId,
      );
      const snapshot = await getDoc(docRef);
      if (!snapshot.exists()) {
        return null;
      }
      return { id: snapshot.id, ...snapshot.data() } as Record<string, unknown>;
    },
    [],
  );

  const fetchCollection = useCallback(
    async (
      collectionPath: string,
      constraints: QueryConstraint[] = [],
    ): Promise<Record<string, unknown>[]> => {
      const collectionRef = collection(db, collectionPath);
      const q = query(collectionRef, ...constraints);
      const snapshot = await getDocs(q);
      return snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      })) as Record<string, unknown>[];
    },
    [],
  );

  return {
    createDocument,
    updateDocument,
    deleteDocument,
    fetchDocument,
    fetchCollection,
    pendingCount,
  };
}
