import { useEffect, useState, useCallback, useRef } from 'react';
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  onSnapshot,
  getDocs,
  QueryConstraint,
  DocumentSnapshot,
  QueryDocumentSnapshot,
  DocumentData,
} from 'firebase/firestore';
import { db } from '../services/firebase/config';
import { useAuth } from '../store/AuthContext';

interface WhereFilter {
  field: string;
  operator: '<' | '<=' | '==' | '!=' | '>=' | '>' | 'array-contains' | 'in' | 'array-contains-any' | 'not-in';
  value: string | number | boolean | Date | string[] | number[];
}

interface OrderByOption {
  field: string;
  direction: 'asc' | 'desc';
}

interface UseFirestoreOptions {
  filters?: WhereFilter[];
  orderByOption?: OrderByOption;
  pageSize?: number;
  realtime?: boolean;
}

interface UseFirestoreReturn<T> {
  data: T[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
  loadMore: () => void;
  hasMore: boolean;
}

export function useFirestore<T extends { id: string }>(
  collectionName: string,
  options: UseFirestoreOptions = {},
): UseFirestoreReturn<T> {
  const { filters = [], orderByOption, pageSize = 20, realtime = false } = options;
  const { user } = useAuth();

  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);

  const lastDocRef = useRef<DocumentSnapshot | null>(null);
  const isLoadingMoreRef = useRef(false);

  const buildConstraints = useCallback(
    (isPaginating: boolean): QueryConstraint[] => {
      const constraints: QueryConstraint[] = [];

      if (user) {
        constraints.push(where('owner_uid', '==', user.uid));
      }

      for (const filter of filters) {
        constraints.push(where(filter.field, filter.operator, filter.value));
      }

      if (orderByOption) {
        constraints.push(orderBy(orderByOption.field, orderByOption.direction));
      }

      constraints.push(limit(pageSize));

      if (isPaginating && lastDocRef.current) {
        constraints.push(startAfter(lastDocRef.current));
      }

      return constraints;
    },
    [user, filters, orderByOption, pageSize],
  );

  const parseDoc = useCallback(
    (docSnap: QueryDocumentSnapshot<DocumentData>): T => {
      const rawData = docSnap.data();
      const parsed: Record<string, unknown> = { id: docSnap.id };

      for (const [key, value] of Object.entries(rawData)) {
        if (value && typeof value === 'object' && 'toDate' in value && typeof (value as { toDate: () => Date }).toDate === 'function') {
          parsed[key] = (value as { toDate: () => Date }).toDate();
        } else {
          parsed[key] = value;
        }
      }

      return parsed as T;
    },
    [],
  );

  const fetchData = useCallback(async () => {
    if (!user) {
      setData([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const constraints = buildConstraints(false);
      const q = query(collection(db, collectionName), ...constraints);
      const snapshot = await getDocs(q);

      const docs = snapshot.docs.map(parseDoc);
      setData(docs);

      lastDocRef.current =
        snapshot.docs.length > 0
          ? snapshot.docs[snapshot.docs.length - 1]
          : null;

      setHasMore(snapshot.docs.length >= pageSize);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Erro ao buscar dados.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [user, collectionName, buildConstraints, parseDoc, pageSize]);

  const loadMore = useCallback(async () => {
    if (!user || !hasMore || isLoadingMoreRef.current || !lastDocRef.current) {
      return;
    }

    isLoadingMoreRef.current = true;

    try {
      const constraints = buildConstraints(true);
      const q = query(collection(db, collectionName), ...constraints);
      const snapshot = await getDocs(q);

      const docs = snapshot.docs.map(parseDoc);
      setData((prev) => [...prev, ...docs]);

      lastDocRef.current =
        snapshot.docs.length > 0
          ? snapshot.docs[snapshot.docs.length - 1]
          : null;

      setHasMore(snapshot.docs.length >= pageSize);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Erro ao carregar mais dados.';
      setError(message);
    } finally {
      isLoadingMoreRef.current = false;
    }
  }, [user, hasMore, collectionName, buildConstraints, parseDoc, pageSize]);

  const refresh = useCallback(() => {
    lastDocRef.current = null;
    setHasMore(true);
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!user) {
      setData([]);
      setLoading(false);
      return;
    }

    if (realtime) {
      setLoading(true);
      setError(null);

      const constraints = buildConstraints(false);
      const q = query(collection(db, collectionName), ...constraints);

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const docs = snapshot.docs.map(parseDoc);
          setData(docs);

          lastDocRef.current =
            snapshot.docs.length > 0
              ? snapshot.docs[snapshot.docs.length - 1]
              : null;

          setHasMore(snapshot.docs.length >= pageSize);
          setLoading(false);
        },
        (err) => {
          setError(err.message);
          setLoading(false);
        },
      );

      return unsubscribe;
    }

    fetchData();
    return undefined;
  }, [user, realtime, collectionName, buildConstraints, parseDoc, pageSize, fetchData]);

  return { data, loading, error, refresh, loadMore, hasMore };
}
