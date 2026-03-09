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
import { CASES } from './collections';
import { LegalCase, CaseFormData, CaseStatus } from '../../types/case';

const casesRef = collection(db, CASES);

function mapDocToCase(id: string, data: DocumentData): LegalCase {
  return {
    id,
    owner_uid: data.owner_uid as string,
    caseNumber: data.caseNumber,
    clientId: data.clientId,
    clientName: data.clientName,
    status: data.status,
    result: data.result,
    area: data.area,
    type: data.type,
    court: data.court,
    branch: data.branch,
    jurisdiction: data.jurisdiction,
    role: data.role,
    judge: data.judge,
    opposingParty: data.opposingParty,
    opposingLawyer: data.opposingLawyer,
    caseValue: data.caseValue,
    phase: data.phase,
    description: data.description,
    strategy: data.strategy,
    tags: data.tags,
    nextDeadline: data.nextDeadline instanceof Timestamp ? data.nextDeadline.toDate() : data.nextDeadline ? new Date(data.nextDeadline) : undefined,
    lastMovement: data.lastMovement,
    lastMovementDate: data.lastMovementDate instanceof Timestamp ? data.lastMovementDate.toDate() : data.lastMovementDate ? new Date(data.lastMovementDate) : undefined,
    expenses: data.expenses ?? 0,
    revenue: data.revenue ?? 0,
    createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(data.createdAt),
    updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : new Date(data.updatedAt),
  };
}

export async function getCases(ownerUid: string): Promise<LegalCase[]> {
  try {
    const q = query(
      casesRef,
      where('owner_uid', '==', ownerUid),
      orderBy('updatedAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((docSnap) => mapDocToCase(docSnap.id, docSnap.data()));
  } catch (error) {
    console.error('Error fetching cases:', error);
    throw error;
  }
}

export async function getCasesByStatus(
  ownerUid: string,
  status: CaseStatus
): Promise<LegalCase[]> {
  try {
    const q = query(
      casesRef,
      where('owner_uid', '==', ownerUid),
      where('status', '==', status),
      orderBy('updatedAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((docSnap) => mapDocToCase(docSnap.id, docSnap.data()));
  } catch (error) {
    console.error('Error fetching cases by status:', error);
    throw error;
  }
}

export async function getCasesByClient(
  ownerUid: string,
  clientId: string
): Promise<LegalCase[]> {
  try {
    const q = query(
      casesRef,
      where('owner_uid', '==', ownerUid),
      where('clientId', '==', clientId),
      orderBy('updatedAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((docSnap) => mapDocToCase(docSnap.id, docSnap.data()));
  } catch (error) {
    console.error('Error fetching cases by client:', error);
    throw error;
  }
}

export async function getCaseById(ownerUid: string, caseId: string): Promise<LegalCase | null> {
  try {
    const docRef = doc(db, CASES, caseId);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return null;
    const data = docSnap.data();
    if (data.owner_uid !== ownerUid) return null;
    return mapDocToCase(docSnap.id, data);
  } catch (error) {
    console.error('Error fetching case:', error);
    throw error;
  }
}

export async function createCase(ownerUid: string, formData: CaseFormData): Promise<string> {
  try {
    const now = Timestamp.now();
    const docData = {
      ...formData,
      owner_uid: ownerUid,
      status: 'active' as CaseStatus,
      expenses: 0,
      revenue: 0,
      createdAt: now,
      updatedAt: now,
    };
    const docRef = await addDoc(casesRef, docData);
    return docRef.id;
  } catch (error) {
    console.error('Error creating case:', error);
    throw error;
  }
}

export async function updateCase(
  ownerUid: string,
  caseId: string,
  data: Partial<LegalCase>
): Promise<void> {
  try {
    const docRef = doc(db, CASES, caseId);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists() || docSnap.data().owner_uid !== ownerUid) {
      throw new Error('Case not found or access denied');
    }
    const { id, owner_uid, createdAt, ...updateData } = data;
    await updateDoc(docRef, {
      ...updateData,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('Error updating case:', error);
    throw error;
  }
}

export async function deleteCase(ownerUid: string, caseId: string): Promise<void> {
  try {
    const docRef = doc(db, CASES, caseId);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists() || docSnap.data().owner_uid !== ownerUid) {
      throw new Error('Case not found or access denied');
    }
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting case:', error);
    throw error;
  }
}

export function subscribeToCases(
  ownerUid: string,
  callback: (cases: LegalCase[]) => void
): Unsubscribe {
  const q = query(
    casesRef,
    where('owner_uid', '==', ownerUid),
    orderBy('updatedAt', 'desc')
  );
  return onSnapshot(
    q,
    (snapshot) => {
      const cases = snapshot.docs.map((docSnap) => mapDocToCase(docSnap.id, docSnap.data()));
      callback(cases);
    },
    (error) => {
      console.error('Error listening to cases:', error);
    }
  );
}

export function subscribeToRecentCases(
  ownerUid: string,
  count: number,
  callback: (cases: LegalCase[]) => void
): Unsubscribe {
  const q = query(
    casesRef,
    where('owner_uid', '==', ownerUid),
    orderBy('updatedAt', 'desc'),
    limit(count)
  );
  return onSnapshot(
    q,
    (snapshot) => {
      const cases = snapshot.docs.map((docSnap) => mapDocToCase(docSnap.id, docSnap.data()));
      callback(cases);
    },
    (error) => {
      console.error('Error listening to recent cases:', error);
    }
  );
}

export async function searchCases(
  ownerUid: string,
  searchTerm: string
): Promise<LegalCase[]> {
  try {
    const allCases = await getCases(ownerUid);
    const lowerTerm = searchTerm.toLowerCase();
    return allCases.filter(
      (c) =>
        c.caseNumber.toLowerCase().includes(lowerTerm) ||
        c.clientName.toLowerCase().includes(lowerTerm) ||
        c.opposingParty.toLowerCase().includes(lowerTerm) ||
        (c.description && c.description.toLowerCase().includes(lowerTerm))
    );
  } catch (error) {
    console.error('Error searching cases:', error);
    throw error;
  }
}
