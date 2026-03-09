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
import { COMMUNICATIONS } from './collections';
import { Communication, CommunicationFormData } from '../../types/communication';

const communicationsRef = collection(db, COMMUNICATIONS);

function mapDocToCommunication(id: string, data: DocumentData): Communication {
  return {
    id,
    owner_uid: data.owner_uid as string,
    clientId: data.clientId,
    clientName: data.clientName,
    caseId: data.caseId,
    type: data.type,
    direction: data.direction,
    subject: data.subject,
    notes: data.notes,
    duration: data.duration,
    date: data.date instanceof Timestamp ? data.date.toDate() : new Date(data.date),
    followUpDate: data.followUpDate instanceof Timestamp ? data.followUpDate.toDate() : data.followUpDate ? new Date(data.followUpDate) : undefined,
    followUpDone: data.followUpDone ?? false,
    createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(data.createdAt),
  };
}

export async function getCommunications(ownerUid: string): Promise<Communication[]> {
  try {
    const q = query(
      communicationsRef,
      where('owner_uid', '==', ownerUid),
      orderBy('date', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => mapDocToCommunication(d.id, d.data()));
  } catch (error) {
    console.error('Error fetching communications:', error);
    throw error;
  }
}

export async function getCommunicationsByClient(
  ownerUid: string,
  clientId: string
): Promise<Communication[]> {
  try {
    const q = query(
      communicationsRef,
      where('owner_uid', '==', ownerUid),
      where('clientId', '==', clientId),
      orderBy('date', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => mapDocToCommunication(d.id, d.data()));
  } catch (error) {
    console.error('Error fetching communications by client:', error);
    throw error;
  }
}

export async function getRecentCommunications(
  ownerUid: string,
  count: number
): Promise<Communication[]> {
  try {
    const q = query(
      communicationsRef,
      where('owner_uid', '==', ownerUid),
      orderBy('date', 'desc'),
      limit(count)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => mapDocToCommunication(d.id, d.data()));
  } catch (error) {
    console.error('Error fetching recent communications:', error);
    throw error;
  }
}

export async function getPendingFollowUps(ownerUid: string): Promise<Communication[]> {
  try {
    const q = query(
      communicationsRef,
      where('owner_uid', '==', ownerUid),
      where('followUpDone', '==', false),
      orderBy('followUpDate', 'asc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs
      .map((d) => mapDocToCommunication(d.id, d.data()))
      .filter((c) => c.followUpDate !== undefined);
  } catch (error) {
    console.error('Error fetching pending follow-ups:', error);
    throw error;
  }
}

export async function getCommunicationById(
  ownerUid: string,
  communicationId: string
): Promise<Communication | null> {
  try {
    const docRef = doc(db, COMMUNICATIONS, communicationId);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return null;
    const data = docSnap.data();
    if (data.owner_uid !== ownerUid) return null;
    return mapDocToCommunication(docSnap.id, data);
  } catch (error) {
    console.error('Error fetching communication:', error);
    throw error;
  }
}

export async function createCommunication(
  ownerUid: string,
  formData: CommunicationFormData
): Promise<string> {
  try {
    const docData = {
      ...formData,
      date: Timestamp.fromDate(formData.date),
      followUpDate: formData.followUpDate ? Timestamp.fromDate(formData.followUpDate) : null,
      owner_uid: ownerUid,
      followUpDone: false,
      createdAt: Timestamp.now(),
    };
    const docRef = await addDoc(communicationsRef, docData);
    return docRef.id;
  } catch (error) {
    console.error('Error creating communication:', error);
    throw error;
  }
}

export async function updateCommunication(
  ownerUid: string,
  communicationId: string,
  data: Partial<CommunicationFormData & { followUpDone: boolean }>
): Promise<void> {
  try {
    const docRef = doc(db, COMMUNICATIONS, communicationId);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists() || docSnap.data().owner_uid !== ownerUid) {
      throw new Error('Communication not found or access denied');
    }
    const updateData: Record<string, unknown> = { ...data };
    if (data.date) {
      updateData.date = Timestamp.fromDate(data.date);
    }
    if (data.followUpDate) {
      updateData.followUpDate = Timestamp.fromDate(data.followUpDate);
    }
    await updateDoc(docRef, updateData);
  } catch (error) {
    console.error('Error updating communication:', error);
    throw error;
  }
}

export async function markFollowUpDone(
  ownerUid: string,
  communicationId: string
): Promise<void> {
  try {
    const docRef = doc(db, COMMUNICATIONS, communicationId);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists() || docSnap.data().owner_uid !== ownerUid) {
      throw new Error('Communication not found or access denied');
    }
    await updateDoc(docRef, { followUpDone: true });
  } catch (error) {
    console.error('Error marking follow-up as done:', error);
    throw error;
  }
}

export async function deleteCommunication(
  ownerUid: string,
  communicationId: string
): Promise<void> {
  try {
    const docRef = doc(db, COMMUNICATIONS, communicationId);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists() || docSnap.data().owner_uid !== ownerUid) {
      throw new Error('Communication not found or access denied');
    }
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting communication:', error);
    throw error;
  }
}

export function subscribeToCommunications(
  ownerUid: string,
  callback: (communications: Communication[]) => void
): Unsubscribe {
  const q = query(
    communicationsRef,
    where('owner_uid', '==', ownerUid),
    orderBy('date', 'desc')
  );
  return onSnapshot(
    q,
    (snapshot) => {
      callback(snapshot.docs.map((d) => mapDocToCommunication(d.id, d.data())));
    },
    (error) => {
      console.error('Error listening to communications:', error);
    }
  );
}
