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
import { APPOINTMENTS } from './collections';
import { Appointment, AppointmentFormData, AppointmentStatus } from '../../types/appointment';

const appointmentsRef = collection(db, APPOINTMENTS);

function mapDocToAppointment(id: string, data: DocumentData): Appointment {
  return {
    id,
    owner_uid: data.owner_uid as string,
    title: data.title,
    description: data.description,
    type: data.type,
    date: data.date instanceof Timestamp ? data.date.toDate() : new Date(data.date),
    endDate: data.endDate instanceof Timestamp ? data.endDate.toDate() : data.endDate ? new Date(data.endDate) : undefined,
    allDay: data.allDay ?? false,
    location: data.location,
    caseId: data.caseId,
    caseName: data.caseName,
    clientId: data.clientId,
    clientName: data.clientName,
    reminderMinutes: data.reminderMinutes ?? [],
    recurrence: data.recurrence ?? 'none',
    status: data.status,
    color: data.color,
    createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(data.createdAt),
    updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : new Date(data.updatedAt),
  };
}

export async function getAppointments(ownerUid: string): Promise<Appointment[]> {
  try {
    const q = query(
      appointmentsRef,
      where('owner_uid', '==', ownerUid),
      orderBy('date', 'asc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((docSnap) => mapDocToAppointment(docSnap.id, docSnap.data()));
  } catch (error) {
    console.error('Error fetching appointments:', error);
    throw error;
  }
}

export async function getAppointmentsByDateRange(
  ownerUid: string,
  startDate: Date,
  endDate: Date
): Promise<Appointment[]> {
  try {
    const q = query(
      appointmentsRef,
      where('owner_uid', '==', ownerUid),
      where('date', '>=', Timestamp.fromDate(startDate)),
      where('date', '<=', Timestamp.fromDate(endDate)),
      orderBy('date', 'asc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((docSnap) => mapDocToAppointment(docSnap.id, docSnap.data()));
  } catch (error) {
    console.error('Error fetching appointments by date range:', error);
    throw error;
  }
}

export async function getUpcomingAppointments(
  ownerUid: string,
  count: number
): Promise<Appointment[]> {
  try {
    const now = Timestamp.now();
    const q = query(
      appointmentsRef,
      where('owner_uid', '==', ownerUid),
      where('date', '>=', now),
      where('status', '==', 'scheduled'),
      orderBy('date', 'asc'),
      limit(count)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((docSnap) => mapDocToAppointment(docSnap.id, docSnap.data()));
  } catch (error) {
    console.error('Error fetching upcoming appointments:', error);
    throw error;
  }
}

export async function getAppointmentById(
  ownerUid: string,
  appointmentId: string
): Promise<Appointment | null> {
  try {
    const docRef = doc(db, APPOINTMENTS, appointmentId);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return null;
    const data = docSnap.data();
    if (data.owner_uid !== ownerUid) return null;
    return mapDocToAppointment(docSnap.id, data);
  } catch (error) {
    console.error('Error fetching appointment:', error);
    throw error;
  }
}

export async function createAppointment(
  ownerUid: string,
  formData: AppointmentFormData
): Promise<string> {
  try {
    const now = Timestamp.now();
    const docData = {
      ...formData,
      date: Timestamp.fromDate(formData.date),
      endDate: formData.endDate ? Timestamp.fromDate(formData.endDate) : null,
      owner_uid: ownerUid,
      status: 'scheduled' as AppointmentStatus,
      createdAt: now,
      updatedAt: now,
    };
    const docRef = await addDoc(appointmentsRef, docData);
    return docRef.id;
  } catch (error) {
    console.error('Error creating appointment:', error);
    throw error;
  }
}

export async function updateAppointment(
  ownerUid: string,
  appointmentId: string,
  data: Partial<AppointmentFormData & { status: AppointmentStatus }>
): Promise<void> {
  try {
    const docRef = doc(db, APPOINTMENTS, appointmentId);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists() || docSnap.data().owner_uid !== ownerUid) {
      throw new Error('Appointment not found or access denied');
    }
    const updateData: Record<string, unknown> = { ...data, updatedAt: Timestamp.now() };
    if (data.date) {
      updateData.date = Timestamp.fromDate(data.date);
    }
    if (data.endDate) {
      updateData.endDate = Timestamp.fromDate(data.endDate);
    }
    await updateDoc(docRef, updateData);
  } catch (error) {
    console.error('Error updating appointment:', error);
    throw error;
  }
}

export async function deleteAppointment(
  ownerUid: string,
  appointmentId: string
): Promise<void> {
  try {
    const docRef = doc(db, APPOINTMENTS, appointmentId);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists() || docSnap.data().owner_uid !== ownerUid) {
      throw new Error('Appointment not found or access denied');
    }
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting appointment:', error);
    throw error;
  }
}

export function subscribeToAppointments(
  ownerUid: string,
  callback: (appointments: Appointment[]) => void
): Unsubscribe {
  const q = query(
    appointmentsRef,
    where('owner_uid', '==', ownerUid),
    orderBy('date', 'asc')
  );
  return onSnapshot(
    q,
    (snapshot) => {
      const appointments = snapshot.docs.map((docSnap) =>
        mapDocToAppointment(docSnap.id, docSnap.data())
      );
      callback(appointments);
    },
    (error) => {
      console.error('Error listening to appointments:', error);
    }
  );
}

export function subscribeToUpcomingAppointments(
  ownerUid: string,
  count: number,
  callback: (appointments: Appointment[]) => void
): Unsubscribe {
  const now = Timestamp.now();
  const q = query(
    appointmentsRef,
    where('owner_uid', '==', ownerUid),
    where('date', '>=', now),
    where('status', '==', 'scheduled'),
    orderBy('date', 'asc'),
    limit(count)
  );
  return onSnapshot(
    q,
    (snapshot) => {
      const appointments = snapshot.docs.map((docSnap) =>
        mapDocToAppointment(docSnap.id, docSnap.data())
      );
      callback(appointments);
    },
    (error) => {
      console.error('Error listening to upcoming appointments:', error);
    }
  );
}
