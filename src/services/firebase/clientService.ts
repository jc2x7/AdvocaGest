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
  QueryConstraint,
  Unsubscribe,
  DocumentData,
} from 'firebase/firestore';
import { db } from './config';
import { CLIENTS } from './collections';
import { Client, ClientFormData, ClientStatus } from '../../types/client';

const clientsRef = collection(db, CLIENTS);

function mapDocToClient(id: string, data: DocumentData): Client {
  return {
    id,
    owner_uid: data.owner_uid as string,
    type: data.type,
    status: data.status,
    fullName: data.fullName,
    cpf: data.cpf,
    rg: data.rg,
    birthDate: data.birthDate,
    gender: data.gender,
    maritalStatus: data.maritalStatus,
    profession: data.profession,
    companyName: data.companyName,
    cnpj: data.cnpj,
    tradeName: data.tradeName,
    contactPerson: data.contactPerson,
    email: data.email,
    phone: data.phone,
    phone2: data.phone2,
    address: data.address,
    notes: data.notes,
    tags: data.tags,
    areasOfInterest: data.areasOfInterest,
    activeCasesCount: data.activeCasesCount ?? 0,
    totalRevenue: data.totalRevenue ?? 0,
    createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(data.createdAt),
    updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : new Date(data.updatedAt),
  };
}

export async function getClients(ownerUid: string): Promise<Client[]> {
  try {
    const q = query(
      clientsRef,
      where('owner_uid', '==', ownerUid),
      orderBy('fullName', 'asc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((docSnap) => mapDocToClient(docSnap.id, docSnap.data()));
  } catch (error) {
    console.error('Error fetching clients:', error);
    throw error;
  }
}

export async function getClientsByStatus(
  ownerUid: string,
  status: ClientStatus
): Promise<Client[]> {
  try {
    const q = query(
      clientsRef,
      where('owner_uid', '==', ownerUid),
      where('status', '==', status),
      orderBy('fullName', 'asc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((docSnap) => mapDocToClient(docSnap.id, docSnap.data()));
  } catch (error) {
    console.error('Error fetching clients by status:', error);
    throw error;
  }
}

export async function getClientById(ownerUid: string, clientId: string): Promise<Client | null> {
  try {
    const docRef = doc(db, CLIENTS, clientId);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return null;
    const data = docSnap.data();
    if (data.owner_uid !== ownerUid) return null;
    return mapDocToClient(docSnap.id, data);
  } catch (error) {
    console.error('Error fetching client:', error);
    throw error;
  }
}

export async function createClient(ownerUid: string, formData: ClientFormData): Promise<string> {
  try {
    const now = Timestamp.now();
    const docData = {
      ...formData,
      owner_uid: ownerUid,
      activeCasesCount: 0,
      totalRevenue: 0,
      createdAt: now,
      updatedAt: now,
    };
    const docRef = await addDoc(clientsRef, docData);
    return docRef.id;
  } catch (error) {
    console.error('Error creating client:', error);
    throw error;
  }
}

export async function updateClient(
  ownerUid: string,
  clientId: string,
  data: Partial<ClientFormData>
): Promise<void> {
  try {
    const docRef = doc(db, CLIENTS, clientId);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists() || docSnap.data().owner_uid !== ownerUid) {
      throw new Error('Client not found or access denied');
    }
    await updateDoc(docRef, {
      ...data,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('Error updating client:', error);
    throw error;
  }
}

export async function deleteClient(ownerUid: string, clientId: string): Promise<void> {
  try {
    const docRef = doc(db, CLIENTS, clientId);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists() || docSnap.data().owner_uid !== ownerUid) {
      throw new Error('Client not found or access denied');
    }
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting client:', error);
    throw error;
  }
}

export function getRecentClients(
  ownerUid: string,
  count: number,
  callback: (clients: Client[]) => void
): Unsubscribe {
  const q = query(
    clientsRef,
    where('owner_uid', '==', ownerUid),
    orderBy('createdAt', 'desc'),
    limit(count)
  );
  return onSnapshot(
    q,
    (snapshot) => {
      const clients = snapshot.docs.map((docSnap) => mapDocToClient(docSnap.id, docSnap.data()));
      callback(clients);
    },
    (error) => {
      console.error('Error listening to recent clients:', error);
    }
  );
}

export function subscribeToClients(
  ownerUid: string,
  callback: (clients: Client[]) => void
): Unsubscribe {
  const q = query(
    clientsRef,
    where('owner_uid', '==', ownerUid),
    orderBy('fullName', 'asc')
  );
  return onSnapshot(
    q,
    (snapshot) => {
      const clients = snapshot.docs.map((docSnap) => mapDocToClient(docSnap.id, docSnap.data()));
      callback(clients);
    },
    (error) => {
      console.error('Error listening to clients:', error);
    }
  );
}

export async function searchClients(
  ownerUid: string,
  searchTerm: string
): Promise<Client[]> {
  try {
    const allClients = await getClients(ownerUid);
    const lowerTerm = searchTerm.toLowerCase();
    return allClients.filter(
      (client) =>
        client.fullName.toLowerCase().includes(lowerTerm) ||
        (client.email && client.email.toLowerCase().includes(lowerTerm)) ||
        client.phone.includes(searchTerm) ||
        (client.cpf && client.cpf.includes(searchTerm)) ||
        (client.cnpj && client.cnpj.includes(searchTerm))
    );
  } catch (error) {
    console.error('Error searching clients:', error);
    throw error;
  }
}
