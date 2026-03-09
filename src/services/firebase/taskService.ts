import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  Timestamp,
  Unsubscribe,
  DocumentData,
} from 'firebase/firestore';
import { db } from './config';
import { TASKS } from './collections';
import { Task, TaskFormData, TaskStatus, TaskPriority, ChecklistItem } from '../../types/task';

const tasksRef = collection(db, TASKS);

function mapDocToTask(id: string, data: DocumentData): Task {
  return {
    id,
    owner_uid: data.owner_uid as string,
    title: data.title,
    description: data.description,
    status: data.status,
    priority: data.priority,
    caseId: data.caseId,
    caseName: data.caseName,
    clientId: data.clientId,
    clientName: data.clientName,
    dueDate: data.dueDate instanceof Timestamp ? data.dueDate.toDate() : data.dueDate ? new Date(data.dueDate) : undefined,
    completedAt: data.completedAt instanceof Timestamp ? data.completedAt.toDate() : data.completedAt ? new Date(data.completedAt) : undefined,
    checklist: data.checklist as ChecklistItem[] | undefined,
    estimatedHours: data.estimatedHours,
    tags: data.tags,
    createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(data.createdAt),
    updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : new Date(data.updatedAt),
  };
}

export async function getTasks(ownerUid: string): Promise<Task[]> {
  try {
    const q = query(
      tasksRef,
      where('owner_uid', '==', ownerUid),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => mapDocToTask(d.id, d.data()));
  } catch (error) {
    console.error('Error fetching tasks:', error);
    throw error;
  }
}

export async function getTasksByStatus(
  ownerUid: string,
  status: TaskStatus
): Promise<Task[]> {
  try {
    const q = query(
      tasksRef,
      where('owner_uid', '==', ownerUid),
      where('status', '==', status),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => mapDocToTask(d.id, d.data()));
  } catch (error) {
    console.error('Error fetching tasks by status:', error);
    throw error;
  }
}

export async function getTasksByPriority(
  ownerUid: string,
  priority: TaskPriority
): Promise<Task[]> {
  try {
    const q = query(
      tasksRef,
      where('owner_uid', '==', ownerUid),
      where('priority', '==', priority),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => mapDocToTask(d.id, d.data()));
  } catch (error) {
    console.error('Error fetching tasks by priority:', error);
    throw error;
  }
}

export async function getTasksByCase(
  ownerUid: string,
  caseId: string
): Promise<Task[]> {
  try {
    const q = query(
      tasksRef,
      where('owner_uid', '==', ownerUid),
      where('caseId', '==', caseId),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => mapDocToTask(d.id, d.data()));
  } catch (error) {
    console.error('Error fetching tasks by case:', error);
    throw error;
  }
}

export async function getTaskById(ownerUid: string, taskId: string): Promise<Task | null> {
  try {
    const docRef = doc(db, TASKS, taskId);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return null;
    const data = docSnap.data();
    if (data.owner_uid !== ownerUid) return null;
    return mapDocToTask(docSnap.id, data);
  } catch (error) {
    console.error('Error fetching task:', error);
    throw error;
  }
}

export async function createTask(ownerUid: string, formData: TaskFormData): Promise<string> {
  try {
    const now = Timestamp.now();
    const docData: Record<string, unknown> = {
      ...formData,
      owner_uid: ownerUid,
      status: 'todo' as TaskStatus,
      createdAt: now,
      updatedAt: now,
    };
    if (formData.dueDate) {
      docData.dueDate = Timestamp.fromDate(formData.dueDate);
    }
    const docRef = await addDoc(tasksRef, docData);
    return docRef.id;
  } catch (error) {
    console.error('Error creating task:', error);
    throw error;
  }
}

export async function updateTask(
  ownerUid: string,
  taskId: string,
  data: Partial<TaskFormData & { status: TaskStatus }>
): Promise<void> {
  try {
    const docRef = doc(db, TASKS, taskId);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists() || docSnap.data().owner_uid !== ownerUid) {
      throw new Error('Task not found or access denied');
    }
    const updateData: Record<string, unknown> = { ...data, updatedAt: Timestamp.now() };
    if (data.dueDate) {
      updateData.dueDate = Timestamp.fromDate(data.dueDate);
    }
    await updateDoc(docRef, updateData);
  } catch (error) {
    console.error('Error updating task:', error);
    throw error;
  }
}

export async function updateTaskStatus(
  ownerUid: string,
  taskId: string,
  status: TaskStatus
): Promise<void> {
  try {
    const docRef = doc(db, TASKS, taskId);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists() || docSnap.data().owner_uid !== ownerUid) {
      throw new Error('Task not found or access denied');
    }
    const updatePayload: Record<string, unknown> = {
      status,
      updatedAt: Timestamp.now(),
    };
    if (status === 'done') {
      updatePayload.completedAt = Timestamp.now();
    }
    await updateDoc(docRef, updatePayload);
  } catch (error) {
    console.error('Error updating task status:', error);
    throw error;
  }
}

export async function updateTaskChecklist(
  ownerUid: string,
  taskId: string,
  checklist: ChecklistItem[]
): Promise<void> {
  try {
    const docRef = doc(db, TASKS, taskId);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists() || docSnap.data().owner_uid !== ownerUid) {
      throw new Error('Task not found or access denied');
    }
    await updateDoc(docRef, {
      checklist,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('Error updating task checklist:', error);
    throw error;
  }
}

export async function deleteTask(ownerUid: string, taskId: string): Promise<void> {
  try {
    const docRef = doc(db, TASKS, taskId);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists() || docSnap.data().owner_uid !== ownerUid) {
      throw new Error('Task not found or access denied');
    }
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting task:', error);
    throw error;
  }
}

export function subscribeToTasks(
  ownerUid: string,
  callback: (tasks: Task[]) => void
): Unsubscribe {
  const q = query(
    tasksRef,
    where('owner_uid', '==', ownerUid),
    orderBy('createdAt', 'desc')
  );
  return onSnapshot(
    q,
    (snapshot) => {
      callback(snapshot.docs.map((d) => mapDocToTask(d.id, d.data())));
    },
    (error) => {
      console.error('Error listening to tasks:', error);
    }
  );
}

export function subscribeToPendingTasks(
  ownerUid: string,
  count: number,
  callback: (tasks: Task[]) => void
): Unsubscribe {
  const q = query(
    tasksRef,
    where('owner_uid', '==', ownerUid),
    where('status', '!=', 'done'),
    orderBy('status'),
    orderBy('createdAt', 'desc'),
    limit(count)
  );
  return onSnapshot(
    q,
    (snapshot) => {
      callback(snapshot.docs.map((d) => mapDocToTask(d.id, d.data())));
    },
    (error) => {
      console.error('Error listening to pending tasks:', error);
    }
  );
}
