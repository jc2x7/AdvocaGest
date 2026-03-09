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
import { TIME_ENTRIES } from './collections';
import { TimeEntry, TimeEntryFormData } from '../../types/timesheet';

const timeEntriesRef = collection(db, TIME_ENTRIES);

function mapDocToTimeEntry(id: string, data: DocumentData): TimeEntry {
  return {
    id,
    owner_uid: data.owner_uid as string,
    taskId: data.taskId,
    caseId: data.caseId,
    caseName: data.caseName,
    clientId: data.clientId,
    clientName: data.clientName,
    description: data.description,
    startTime: data.startTime instanceof Timestamp ? data.startTime.toDate() : new Date(data.startTime),
    endTime: data.endTime instanceof Timestamp ? data.endTime.toDate() : data.endTime ? new Date(data.endTime) : undefined,
    duration: data.duration ?? 0,
    billable: data.billable ?? false,
    hourlyRate: data.hourlyRate,
    createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(data.createdAt),
  };
}

export async function getTimeEntries(ownerUid: string): Promise<TimeEntry[]> {
  try {
    const q = query(
      timeEntriesRef,
      where('owner_uid', '==', ownerUid),
      orderBy('startTime', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => mapDocToTimeEntry(d.id, d.data()));
  } catch (error) {
    console.error('Error fetching time entries:', error);
    throw error;
  }
}

export async function getTimeEntriesByCase(
  ownerUid: string,
  caseId: string
): Promise<TimeEntry[]> {
  try {
    const q = query(
      timeEntriesRef,
      where('owner_uid', '==', ownerUid),
      where('caseId', '==', caseId),
      orderBy('startTime', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => mapDocToTimeEntry(d.id, d.data()));
  } catch (error) {
    console.error('Error fetching time entries by case:', error);
    throw error;
  }
}

export async function getTimeEntriesByClient(
  ownerUid: string,
  clientId: string
): Promise<TimeEntry[]> {
  try {
    const q = query(
      timeEntriesRef,
      where('owner_uid', '==', ownerUid),
      where('clientId', '==', clientId),
      orderBy('startTime', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => mapDocToTimeEntry(d.id, d.data()));
  } catch (error) {
    console.error('Error fetching time entries by client:', error);
    throw error;
  }
}

export async function getTimeEntriesByDateRange(
  ownerUid: string,
  startDate: Date,
  endDate: Date
): Promise<TimeEntry[]> {
  try {
    const q = query(
      timeEntriesRef,
      where('owner_uid', '==', ownerUid),
      where('startTime', '>=', Timestamp.fromDate(startDate)),
      where('startTime', '<=', Timestamp.fromDate(endDate)),
      orderBy('startTime', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => mapDocToTimeEntry(d.id, d.data()));
  } catch (error) {
    console.error('Error fetching time entries by date range:', error);
    throw error;
  }
}

export async function getRecentTimeEntries(
  ownerUid: string,
  count: number
): Promise<TimeEntry[]> {
  try {
    const q = query(
      timeEntriesRef,
      where('owner_uid', '==', ownerUid),
      orderBy('startTime', 'desc'),
      limit(count)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => mapDocToTimeEntry(d.id, d.data()));
  } catch (error) {
    console.error('Error fetching recent time entries:', error);
    throw error;
  }
}

export async function getTimeEntryById(
  ownerUid: string,
  entryId: string
): Promise<TimeEntry | null> {
  try {
    const docRef = doc(db, TIME_ENTRIES, entryId);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return null;
    const data = docSnap.data();
    if (data.owner_uid !== ownerUid) return null;
    return mapDocToTimeEntry(docSnap.id, data);
  } catch (error) {
    console.error('Error fetching time entry:', error);
    throw error;
  }
}

export async function createTimeEntry(
  ownerUid: string,
  formData: TimeEntryFormData
): Promise<string> {
  try {
    const docData = {
      ...formData,
      startTime: Timestamp.fromDate(formData.startTime),
      endTime: formData.endTime ? Timestamp.fromDate(formData.endTime) : null,
      owner_uid: ownerUid,
      createdAt: Timestamp.now(),
    };
    const docRef = await addDoc(timeEntriesRef, docData);
    return docRef.id;
  } catch (error) {
    console.error('Error creating time entry:', error);
    throw error;
  }
}

export async function updateTimeEntry(
  ownerUid: string,
  entryId: string,
  data: Partial<TimeEntryFormData>
): Promise<void> {
  try {
    const docRef = doc(db, TIME_ENTRIES, entryId);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists() || docSnap.data().owner_uid !== ownerUid) {
      throw new Error('Time entry not found or access denied');
    }
    const updateData: Record<string, unknown> = { ...data };
    if (data.startTime) {
      updateData.startTime = Timestamp.fromDate(data.startTime);
    }
    if (data.endTime) {
      updateData.endTime = Timestamp.fromDate(data.endTime);
    }
    await updateDoc(docRef, updateData);
  } catch (error) {
    console.error('Error updating time entry:', error);
    throw error;
  }
}

export async function stopTimeEntry(
  ownerUid: string,
  entryId: string,
  endTime: Date,
  duration: number
): Promise<void> {
  try {
    const docRef = doc(db, TIME_ENTRIES, entryId);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists() || docSnap.data().owner_uid !== ownerUid) {
      throw new Error('Time entry not found or access denied');
    }
    await updateDoc(docRef, {
      endTime: Timestamp.fromDate(endTime),
      duration,
    });
  } catch (error) {
    console.error('Error stopping time entry:', error);
    throw error;
  }
}

export async function deleteTimeEntry(ownerUid: string, entryId: string): Promise<void> {
  try {
    const docRef = doc(db, TIME_ENTRIES, entryId);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists() || docSnap.data().owner_uid !== ownerUid) {
      throw new Error('Time entry not found or access denied');
    }
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting time entry:', error);
    throw error;
  }
}

export function subscribeToTimeEntries(
  ownerUid: string,
  callback: (entries: TimeEntry[]) => void
): Unsubscribe {
  const q = query(
    timeEntriesRef,
    where('owner_uid', '==', ownerUid),
    orderBy('startTime', 'desc')
  );
  return onSnapshot(
    q,
    (snapshot) => {
      callback(snapshot.docs.map((d) => mapDocToTimeEntry(d.id, d.data())));
    },
    (error) => {
      console.error('Error listening to time entries:', error);
    }
  );
}

export async function getBillableHoursByCase(
  ownerUid: string,
  caseId: string
): Promise<{ totalHours: number; totalValue: number }> {
  try {
    const entries = await getTimeEntriesByCase(ownerUid, caseId);
    const billableEntries = entries.filter((entry) => entry.billable);
    const totalHours = billableEntries.reduce((sum, entry) => sum + entry.duration / 3600, 0);
    const totalValue = billableEntries.reduce((sum, entry) => {
      const hours = entry.duration / 3600;
      const rate = entry.hourlyRate ?? 0;
      return sum + hours * rate;
    }, 0);
    return { totalHours, totalValue };
  } catch (error) {
    console.error('Error calculating billable hours:', error);
    throw error;
  }
}
