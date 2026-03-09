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
import { LEADS } from './collections';
import { Lead, LeadFormData, LeadStage } from '../../types/lead';

const leadsRef = collection(db, LEADS);

function mapDocToLead(id: string, data: DocumentData): Lead {
  return {
    id,
    owner_uid: data.owner_uid as string,
    name: data.name,
    email: data.email,
    phone: data.phone,
    source: data.source,
    sourceDetail: data.sourceDetail,
    area: data.area,
    description: data.description,
    stage: data.stage,
    score: data.score ?? 0,
    estimatedValue: data.estimatedValue,
    proposalSent: data.proposalSent ?? false,
    proposalDate: data.proposalDate instanceof Timestamp ? data.proposalDate.toDate() : data.proposalDate ? new Date(data.proposalDate) : undefined,
    lostReason: data.lostReason,
    convertedClientId: data.convertedClientId,
    notes: data.notes,
    lastContactDate: data.lastContactDate instanceof Timestamp ? data.lastContactDate.toDate() : data.lastContactDate ? new Date(data.lastContactDate) : undefined,
    nextFollowUpDate: data.nextFollowUpDate instanceof Timestamp ? data.nextFollowUpDate.toDate() : data.nextFollowUpDate ? new Date(data.nextFollowUpDate) : undefined,
    createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(data.createdAt),
    updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : new Date(data.updatedAt),
  };
}

export async function getLeads(ownerUid: string): Promise<Lead[]> {
  try {
    const q = query(
      leadsRef,
      where('owner_uid', '==', ownerUid),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => mapDocToLead(d.id, d.data()));
  } catch (error) {
    console.error('Error fetching leads:', error);
    throw error;
  }
}

export async function getLeadsByStage(
  ownerUid: string,
  stage: LeadStage
): Promise<Lead[]> {
  try {
    const q = query(
      leadsRef,
      where('owner_uid', '==', ownerUid),
      where('stage', '==', stage),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => mapDocToLead(d.id, d.data()));
  } catch (error) {
    console.error('Error fetching leads by stage:', error);
    throw error;
  }
}

export async function getActiveLeads(ownerUid: string): Promise<Lead[]> {
  try {
    const allLeads = await getLeads(ownerUid);
    return allLeads.filter((lead) => lead.stage !== 'won' && lead.stage !== 'lost');
  } catch (error) {
    console.error('Error fetching active leads:', error);
    throw error;
  }
}

export async function getLeadById(ownerUid: string, leadId: string): Promise<Lead | null> {
  try {
    const docRef = doc(db, LEADS, leadId);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return null;
    const data = docSnap.data();
    if (data.owner_uid !== ownerUid) return null;
    return mapDocToLead(docSnap.id, data);
  } catch (error) {
    console.error('Error fetching lead:', error);
    throw error;
  }
}

export async function createLead(ownerUid: string, formData: LeadFormData): Promise<string> {
  try {
    const now = Timestamp.now();
    const docData = {
      ...formData,
      owner_uid: ownerUid,
      stage: 'new' as LeadStage,
      score: 0,
      proposalSent: false,
      createdAt: now,
      updatedAt: now,
    };
    const docRef = await addDoc(leadsRef, docData);
    return docRef.id;
  } catch (error) {
    console.error('Error creating lead:', error);
    throw error;
  }
}

export async function updateLead(
  ownerUid: string,
  leadId: string,
  data: Partial<Lead>
): Promise<void> {
  try {
    const docRef = doc(db, LEADS, leadId);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists() || docSnap.data().owner_uid !== ownerUid) {
      throw new Error('Lead not found or access denied');
    }
    const { id, owner_uid, createdAt, ...updateData } = data;
    await updateDoc(docRef, {
      ...updateData,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('Error updating lead:', error);
    throw error;
  }
}

export async function updateLeadStage(
  ownerUid: string,
  leadId: string,
  newStage: LeadStage,
  extra?: { lostReason?: string; convertedClientId?: string }
): Promise<void> {
  try {
    const docRef = doc(db, LEADS, leadId);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists() || docSnap.data().owner_uid !== ownerUid) {
      throw new Error('Lead not found or access denied');
    }
    const updatePayload: Record<string, unknown> = {
      stage: newStage,
      updatedAt: Timestamp.now(),
    };
    if (newStage === 'lost' && extra?.lostReason) {
      updatePayload.lostReason = extra.lostReason;
    }
    if (newStage === 'won' && extra?.convertedClientId) {
      updatePayload.convertedClientId = extra.convertedClientId;
    }
    if (newStage === 'proposal') {
      updatePayload.proposalSent = true;
      updatePayload.proposalDate = Timestamp.now();
    }
    await updateDoc(docRef, updatePayload);
  } catch (error) {
    console.error('Error updating lead stage:', error);
    throw error;
  }
}

export async function updateLeadScore(
  ownerUid: string,
  leadId: string,
  score: number
): Promise<void> {
  try {
    const docRef = doc(db, LEADS, leadId);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists() || docSnap.data().owner_uid !== ownerUid) {
      throw new Error('Lead not found or access denied');
    }
    await updateDoc(docRef, {
      score,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('Error updating lead score:', error);
    throw error;
  }
}

export async function recordLeadContact(
  ownerUid: string,
  leadId: string,
  nextFollowUpDate?: Date
): Promise<void> {
  try {
    const docRef = doc(db, LEADS, leadId);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists() || docSnap.data().owner_uid !== ownerUid) {
      throw new Error('Lead not found or access denied');
    }
    const updatePayload: Record<string, unknown> = {
      lastContactDate: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };
    if (nextFollowUpDate) {
      updatePayload.nextFollowUpDate = Timestamp.fromDate(nextFollowUpDate);
    }
    await updateDoc(docRef, updatePayload);
  } catch (error) {
    console.error('Error recording lead contact:', error);
    throw error;
  }
}

export async function deleteLead(ownerUid: string, leadId: string): Promise<void> {
  try {
    const docRef = doc(db, LEADS, leadId);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists() || docSnap.data().owner_uid !== ownerUid) {
      throw new Error('Lead not found or access denied');
    }
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting lead:', error);
    throw error;
  }
}

export function subscribeToLeads(
  ownerUid: string,
  callback: (leads: Lead[]) => void
): Unsubscribe {
  const q = query(
    leadsRef,
    where('owner_uid', '==', ownerUid),
    orderBy('createdAt', 'desc')
  );
  return onSnapshot(
    q,
    (snapshot) => {
      callback(snapshot.docs.map((d) => mapDocToLead(d.id, d.data())));
    },
    (error) => {
      console.error('Error listening to leads:', error);
    }
  );
}

export function subscribeToLeadsByStage(
  ownerUid: string,
  stage: LeadStage,
  callback: (leads: Lead[]) => void
): Unsubscribe {
  const q = query(
    leadsRef,
    where('owner_uid', '==', ownerUid),
    where('stage', '==', stage),
    orderBy('createdAt', 'desc')
  );
  return onSnapshot(
    q,
    (snapshot) => {
      callback(snapshot.docs.map((d) => mapDocToLead(d.id, d.data())));
    },
    (error) => {
      console.error('Error listening to leads by stage:', error);
    }
  );
}
