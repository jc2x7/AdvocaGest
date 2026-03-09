import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { OfflineOperation } from '../../types/common';

const QUEUE_KEY = '@advocagest_offline_queue';
const MAX_BACKOFF_MS = 30000;
const BASE_BACKOFF_MS = 1000;

type SyncEvent = 'syncing' | 'synced' | 'error';
type SyncEventListener = (payload?: { error?: Error; operation?: OfflineOperation }) => void;

class OfflineManager {
  private isOnline: boolean = true;
  private isSyncing: boolean = false;
  private unsubscribeNetInfo: (() => void) | null = null;
  private listeners: Map<SyncEvent, Set<SyncEventListener>> = new Map();

  constructor() {
    this.listeners.set('syncing', new Set());
    this.listeners.set('synced', new Set());
    this.listeners.set('error', new Set());
  }

  start(): void {
    this.unsubscribeNetInfo = NetInfo.addEventListener((state: NetInfoState) => {
      const wasOffline = !this.isOnline;
      this.isOnline = state.isConnected ?? false;

      if (wasOffline && this.isOnline) {
        this.processQueue();
      }
    });
  }

  stop(): void {
    if (this.unsubscribeNetInfo) {
      this.unsubscribeNetInfo();
      this.unsubscribeNetInfo = null;
    }
  }

  on(event: SyncEvent, listener: SyncEventListener): () => void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.add(listener);
    }
    return () => {
      eventListeners?.delete(listener);
    };
  }

  private emit(event: SyncEvent, payload?: { error?: Error; operation?: OfflineOperation }): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach((listener) => listener(payload));
    }
  }

  getIsOnline(): boolean {
    return this.isOnline;
  }

  getIsSyncing(): boolean {
    return this.isSyncing;
  }

  async enqueue(operation: Omit<OfflineOperation, 'id' | 'timestamp' | 'retries'>): Promise<void> {
    const queue = await this.getQueue();
    const newOperation: OfflineOperation = {
      ...operation,
      id: `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      timestamp: Date.now(),
      retries: 0,
    };
    queue.push(newOperation);
    await this.saveQueue(queue);

    if (this.isOnline && !this.isSyncing) {
      this.processQueue();
    }
  }

  async getQueue(): Promise<OfflineOperation[]> {
    const raw = await AsyncStorage.getItem(QUEUE_KEY);
    if (!raw) {
      return [];
    }
    return JSON.parse(raw) as OfflineOperation[];
  }

  private async saveQueue(queue: OfflineOperation[]): Promise<void> {
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  }

  async getQueueLength(): Promise<number> {
    const queue = await this.getQueue();
    return queue.length;
  }

  async clearQueue(): Promise<void> {
    await AsyncStorage.removeItem(QUEUE_KEY);
  }

  async processQueue(): Promise<void> {
    if (this.isSyncing || !this.isOnline) {
      return;
    }

    const queue = await this.getQueue();
    if (queue.length === 0) {
      return;
    }

    this.isSyncing = true;
    this.emit('syncing');

    const remaining: OfflineOperation[] = [];

    for (const operation of queue) {
      try {
        await this.executeOperation(operation);
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        const updatedOperation: OfflineOperation = {
          ...operation,
          retries: operation.retries + 1,
        };

        this.emit('error', { error, operation: updatedOperation });

        const backoffMs = Math.min(
          BASE_BACKOFF_MS * Math.pow(2, updatedOperation.retries),
          MAX_BACKOFF_MS,
        );

        await this.delay(backoffMs);

        remaining.push(updatedOperation);
      }
    }

    await this.saveQueue(remaining);
    this.isSyncing = false;

    if (remaining.length === 0) {
      this.emit('synced');
    } else if (this.isOnline) {
      this.processQueue();
    }
  }

  private async executeOperation(operation: OfflineOperation): Promise<void> {
    const collectionRef = collection(db, operation.collection);
    const docRef = doc(collectionRef, operation.docId);

    switch (operation.type) {
      case 'create':
        if (operation.data) {
          await setDoc(docRef, operation.data);
        }
        break;
      case 'update':
        if (operation.data) {
          await updateDoc(docRef, operation.data);
        }
        break;
      case 'delete':
        await deleteDoc(docRef);
        break;
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export const offlineManager = new OfflineManager();
