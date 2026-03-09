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
import { CONTRACTS, INSTALLMENTS, FINANCIAL_ENTRIES } from './collections';
import {
  FeeContract,
  ContractFormData,
  ContractStatus,
  Installment,
  InstallmentStatus,
  PaymentMethod,
  FinancialEntry,
  EntryType,
} from '../../types/financial';

// ---------------------------------------------------------------------------
// Collection references
// ---------------------------------------------------------------------------
const contractsRef = collection(db, CONTRACTS);
const installmentsRef = collection(db, INSTALLMENTS);
const entriesRef = collection(db, FINANCIAL_ENTRIES);

// ---------------------------------------------------------------------------
// Mappers
// ---------------------------------------------------------------------------
function mapDocToContract(id: string, data: DocumentData): FeeContract {
  return {
    id,
    owner_uid: data.owner_uid as string,
    clientId: data.clientId,
    clientName: data.clientName,
    caseId: data.caseId,
    caseName: data.caseName,
    type: data.type,
    totalValue: data.totalValue,
    successPercentage: data.successPercentage,
    hourlyRate: data.hourlyRate,
    installmentsCount: data.installmentsCount ?? 0,
    paidCount: data.paidCount ?? 0,
    paidTotal: data.paidTotal ?? 0,
    status: data.status,
    description: data.description,
    signedDate: data.signedDate instanceof Timestamp ? data.signedDate.toDate() : data.signedDate ? new Date(data.signedDate) : undefined,
    createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(data.createdAt),
    updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : new Date(data.updatedAt),
  };
}

function mapDocToInstallment(id: string, data: DocumentData): Installment {
  return {
    id,
    contractId: data.contractId,
    owner_uid: data.owner_uid as string,
    number: data.number,
    value: data.value,
    dueDate: data.dueDate instanceof Timestamp ? data.dueDate.toDate() : new Date(data.dueDate),
    paidDate: data.paidDate instanceof Timestamp ? data.paidDate.toDate() : data.paidDate ? new Date(data.paidDate) : undefined,
    paidValue: data.paidValue,
    status: data.status,
    paymentMethod: data.paymentMethod,
    notes: data.notes,
  };
}

function mapDocToEntry(id: string, data: DocumentData): FinancialEntry {
  return {
    id,
    owner_uid: data.owner_uid as string,
    type: data.type,
    category: data.category,
    description: data.description,
    value: data.value,
    date: data.date instanceof Timestamp ? data.date.toDate() : new Date(data.date),
    clientId: data.clientId,
    clientName: data.clientName,
    caseId: data.caseId,
    caseName: data.caseName,
    paymentMethod: data.paymentMethod,
    installmentId: data.installmentId,
    contractId: data.contractId,
    isRecurring: data.isRecurring ?? false,
    recurrenceFrequency: data.recurrenceFrequency,
    createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(data.createdAt),
  };
}

// ---------------------------------------------------------------------------
// Contract CRUD
// ---------------------------------------------------------------------------
export async function getContracts(ownerUid: string): Promise<FeeContract[]> {
  try {
    const q = query(
      contractsRef,
      where('owner_uid', '==', ownerUid),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => mapDocToContract(d.id, d.data()));
  } catch (error) {
    console.error('Error fetching contracts:', error);
    throw error;
  }
}

export async function getContractsByClient(
  ownerUid: string,
  clientId: string
): Promise<FeeContract[]> {
  try {
    const q = query(
      contractsRef,
      where('owner_uid', '==', ownerUid),
      where('clientId', '==', clientId),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => mapDocToContract(d.id, d.data()));
  } catch (error) {
    console.error('Error fetching contracts by client:', error);
    throw error;
  }
}

export async function getContractById(
  ownerUid: string,
  contractId: string
): Promise<FeeContract | null> {
  try {
    const docRef = doc(db, CONTRACTS, contractId);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return null;
    const data = docSnap.data();
    if (data.owner_uid !== ownerUid) return null;
    return mapDocToContract(docSnap.id, data);
  } catch (error) {
    console.error('Error fetching contract:', error);
    throw error;
  }
}

export async function createContract(
  ownerUid: string,
  formData: ContractFormData
): Promise<string> {
  try {
    const now = Timestamp.now();
    const docData = {
      ...formData,
      signedDate: formData.signedDate ? Timestamp.fromDate(formData.signedDate) : null,
      owner_uid: ownerUid,
      paidCount: 0,
      paidTotal: 0,
      status: 'active' as ContractStatus,
      createdAt: now,
      updatedAt: now,
    };
    const docRef = await addDoc(contractsRef, docData);
    return docRef.id;
  } catch (error) {
    console.error('Error creating contract:', error);
    throw error;
  }
}

export async function updateContract(
  ownerUid: string,
  contractId: string,
  data: Partial<FeeContract>
): Promise<void> {
  try {
    const docRef = doc(db, CONTRACTS, contractId);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists() || docSnap.data().owner_uid !== ownerUid) {
      throw new Error('Contract not found or access denied');
    }
    const { id, owner_uid, createdAt, ...updateData } = data;
    await updateDoc(docRef, {
      ...updateData,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('Error updating contract:', error);
    throw error;
  }
}

export async function deleteContract(ownerUid: string, contractId: string): Promise<void> {
  try {
    const docRef = doc(db, CONTRACTS, contractId);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists() || docSnap.data().owner_uid !== ownerUid) {
      throw new Error('Contract not found or access denied');
    }
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting contract:', error);
    throw error;
  }
}

export function subscribeToContracts(
  ownerUid: string,
  callback: (contracts: FeeContract[]) => void
): Unsubscribe {
  const q = query(
    contractsRef,
    where('owner_uid', '==', ownerUid),
    orderBy('createdAt', 'desc')
  );
  return onSnapshot(
    q,
    (snapshot) => {
      callback(snapshot.docs.map((d) => mapDocToContract(d.id, d.data())));
    },
    (error) => {
      console.error('Error listening to contracts:', error);
    }
  );
}

// ---------------------------------------------------------------------------
// Installment CRUD
// ---------------------------------------------------------------------------
export async function getInstallmentsByContract(
  ownerUid: string,
  contractId: string
): Promise<Installment[]> {
  try {
    const q = query(
      installmentsRef,
      where('owner_uid', '==', ownerUid),
      where('contractId', '==', contractId),
      orderBy('number', 'asc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => mapDocToInstallment(d.id, d.data()));
  } catch (error) {
    console.error('Error fetching installments:', error);
    throw error;
  }
}

export async function getOverdueInstallments(ownerUid: string): Promise<Installment[]> {
  try {
    const q = query(
      installmentsRef,
      where('owner_uid', '==', ownerUid),
      where('status', '==', 'overdue'),
      orderBy('dueDate', 'asc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => mapDocToInstallment(d.id, d.data()));
  } catch (error) {
    console.error('Error fetching overdue installments:', error);
    throw error;
  }
}

export async function createInstallment(
  ownerUid: string,
  data: Omit<Installment, 'id'>
): Promise<string> {
  try {
    const docData = {
      ...data,
      owner_uid: ownerUid,
      dueDate: Timestamp.fromDate(data.dueDate),
      paidDate: data.paidDate ? Timestamp.fromDate(data.paidDate) : null,
    };
    const docRef = await addDoc(installmentsRef, docData);
    return docRef.id;
  } catch (error) {
    console.error('Error creating installment:', error);
    throw error;
  }
}

export async function markInstallmentPaid(
  ownerUid: string,
  installmentId: string,
  paidValue: number,
  paymentMethod: PaymentMethod
): Promise<void> {
  try {
    const docRef = doc(db, INSTALLMENTS, installmentId);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists() || docSnap.data().owner_uid !== ownerUid) {
      throw new Error('Installment not found or access denied');
    }
    const installmentData = docSnap.data();
    const status: InstallmentStatus = paidValue >= installmentData.value ? 'paid' : 'partial';
    await updateDoc(docRef, {
      paidDate: Timestamp.now(),
      paidValue,
      paymentMethod,
      status,
    });
  } catch (error) {
    console.error('Error marking installment as paid:', error);
    throw error;
  }
}

export async function updateInstallment(
  ownerUid: string,
  installmentId: string,
  data: Partial<Installment>
): Promise<void> {
  try {
    const docRef = doc(db, INSTALLMENTS, installmentId);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists() || docSnap.data().owner_uid !== ownerUid) {
      throw new Error('Installment not found or access denied');
    }
    const { id, ...updateData } = data;
    await updateDoc(docRef, updateData);
  } catch (error) {
    console.error('Error updating installment:', error);
    throw error;
  }
}

export async function deleteInstallment(
  ownerUid: string,
  installmentId: string
): Promise<void> {
  try {
    const docRef = doc(db, INSTALLMENTS, installmentId);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists() || docSnap.data().owner_uid !== ownerUid) {
      throw new Error('Installment not found or access denied');
    }
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting installment:', error);
    throw error;
  }
}

export function subscribeToInstallments(
  ownerUid: string,
  contractId: string,
  callback: (installments: Installment[]) => void
): Unsubscribe {
  const q = query(
    installmentsRef,
    where('owner_uid', '==', ownerUid),
    where('contractId', '==', contractId),
    orderBy('number', 'asc')
  );
  return onSnapshot(
    q,
    (snapshot) => {
      callback(snapshot.docs.map((d) => mapDocToInstallment(d.id, d.data())));
    },
    (error) => {
      console.error('Error listening to installments:', error);
    }
  );
}

// ---------------------------------------------------------------------------
// Financial Entry CRUD
// ---------------------------------------------------------------------------
export async function getFinancialEntries(ownerUid: string): Promise<FinancialEntry[]> {
  try {
    const q = query(
      entriesRef,
      where('owner_uid', '==', ownerUid),
      orderBy('date', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => mapDocToEntry(d.id, d.data()));
  } catch (error) {
    console.error('Error fetching financial entries:', error);
    throw error;
  }
}

export async function getFinancialEntriesByType(
  ownerUid: string,
  entryType: EntryType
): Promise<FinancialEntry[]> {
  try {
    const q = query(
      entriesRef,
      where('owner_uid', '==', ownerUid),
      where('type', '==', entryType),
      orderBy('date', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => mapDocToEntry(d.id, d.data()));
  } catch (error) {
    console.error('Error fetching financial entries by type:', error);
    throw error;
  }
}

export async function getFinancialEntriesByDateRange(
  ownerUid: string,
  startDate: Date,
  endDate: Date
): Promise<FinancialEntry[]> {
  try {
    const q = query(
      entriesRef,
      where('owner_uid', '==', ownerUid),
      where('date', '>=', Timestamp.fromDate(startDate)),
      where('date', '<=', Timestamp.fromDate(endDate)),
      orderBy('date', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => mapDocToEntry(d.id, d.data()));
  } catch (error) {
    console.error('Error fetching entries by date range:', error);
    throw error;
  }
}

export async function createFinancialEntry(
  ownerUid: string,
  data: Omit<FinancialEntry, 'id' | 'owner_uid' | 'createdAt'>
): Promise<string> {
  try {
    const docData = {
      ...data,
      date: Timestamp.fromDate(data.date),
      owner_uid: ownerUid,
      createdAt: Timestamp.now(),
    };
    const docRef = await addDoc(entriesRef, docData);
    return docRef.id;
  } catch (error) {
    console.error('Error creating financial entry:', error);
    throw error;
  }
}

export async function updateFinancialEntry(
  ownerUid: string,
  entryId: string,
  data: Partial<FinancialEntry>
): Promise<void> {
  try {
    const docRef = doc(db, FINANCIAL_ENTRIES, entryId);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists() || docSnap.data().owner_uid !== ownerUid) {
      throw new Error('Financial entry not found or access denied');
    }
    const { id, owner_uid, createdAt, ...updateData } = data;
    if (updateData.date) {
      (updateData as Record<string, unknown>).date = Timestamp.fromDate(updateData.date);
    }
    await updateDoc(docRef, updateData);
  } catch (error) {
    console.error('Error updating financial entry:', error);
    throw error;
  }
}

export async function deleteFinancialEntry(
  ownerUid: string,
  entryId: string
): Promise<void> {
  try {
    const docRef = doc(db, FINANCIAL_ENTRIES, entryId);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists() || docSnap.data().owner_uid !== ownerUid) {
      throw new Error('Financial entry not found or access denied');
    }
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting financial entry:', error);
    throw error;
  }
}

export function subscribeToFinancialEntries(
  ownerUid: string,
  callback: (entries: FinancialEntry[]) => void
): Unsubscribe {
  const q = query(
    entriesRef,
    where('owner_uid', '==', ownerUid),
    orderBy('date', 'desc')
  );
  return onSnapshot(
    q,
    (snapshot) => {
      callback(snapshot.docs.map((d) => mapDocToEntry(d.id, d.data())));
    },
    (error) => {
      console.error('Error listening to financial entries:', error);
    }
  );
}
