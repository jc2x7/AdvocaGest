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
import { DOCUMENTS, TEMPLATES, MESSAGE_TEMPLATES } from './collections';
import {
  LegalDocument,
  DocumentCategory,
  DocumentTemplate,
  MessageTemplate,
} from '../../types/document';

const documentsRef = collection(db, DOCUMENTS);
const templatesRef = collection(db, TEMPLATES);
const messageTemplatesRef = collection(db, MESSAGE_TEMPLATES);

// ---------------------------------------------------------------------------
// Mappers
// ---------------------------------------------------------------------------
function mapDocToLegalDocument(id: string, data: DocumentData): LegalDocument {
  return {
    id,
    owner_uid: data.owner_uid as string,
    name: data.name,
    description: data.description,
    category: data.category,
    type: data.type,
    fileUrl: data.fileUrl,
    storagePath: data.storagePath,
    fileSize: data.fileSize,
    mimeType: data.mimeType,
    caseId: data.caseId,
    clientId: data.clientId,
    tags: data.tags,
    version: data.version ?? 1,
    createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(data.createdAt),
    updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : new Date(data.updatedAt),
  };
}

function mapDocToTemplate(id: string, data: DocumentData): DocumentTemplate {
  return {
    id,
    owner_uid: data.owner_uid as string,
    name: data.name,
    category: data.category,
    content: data.content,
    variables: data.variables ?? [],
    isDefault: data.isDefault ?? false,
    createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(data.createdAt),
  };
}

function mapDocToMessageTemplate(id: string, data: DocumentData): MessageTemplate {
  return {
    id,
    owner_uid: data.owner_uid as string,
    name: data.name,
    category: data.category,
    content: data.content,
    channel: data.channel,
    createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(data.createdAt),
  };
}

// ---------------------------------------------------------------------------
// Document CRUD
// ---------------------------------------------------------------------------
export async function getDocuments(ownerUid: string): Promise<LegalDocument[]> {
  try {
    const q = query(
      documentsRef,
      where('owner_uid', '==', ownerUid),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => mapDocToLegalDocument(d.id, d.data()));
  } catch (error) {
    console.error('Error fetching documents:', error);
    throw error;
  }
}

export async function getDocumentsByCase(
  ownerUid: string,
  caseId: string
): Promise<LegalDocument[]> {
  try {
    const q = query(
      documentsRef,
      where('owner_uid', '==', ownerUid),
      where('caseId', '==', caseId),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => mapDocToLegalDocument(d.id, d.data()));
  } catch (error) {
    console.error('Error fetching documents by case:', error);
    throw error;
  }
}

export async function getDocumentsByCategory(
  ownerUid: string,
  category: DocumentCategory
): Promise<LegalDocument[]> {
  try {
    const q = query(
      documentsRef,
      where('owner_uid', '==', ownerUid),
      where('category', '==', category),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => mapDocToLegalDocument(d.id, d.data()));
  } catch (error) {
    console.error('Error fetching documents by category:', error);
    throw error;
  }
}

export async function getDocumentById(
  ownerUid: string,
  documentId: string
): Promise<LegalDocument | null> {
  try {
    const docRef = doc(db, DOCUMENTS, documentId);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return null;
    const data = docSnap.data();
    if (data.owner_uid !== ownerUid) return null;
    return mapDocToLegalDocument(docSnap.id, data);
  } catch (error) {
    console.error('Error fetching document:', error);
    throw error;
  }
}

export async function createDocument(
  ownerUid: string,
  data: Omit<LegalDocument, 'id' | 'owner_uid' | 'createdAt' | 'updatedAt' | 'version'>
): Promise<string> {
  try {
    const now = Timestamp.now();
    const docData = {
      ...data,
      owner_uid: ownerUid,
      version: 1,
      createdAt: now,
      updatedAt: now,
    };
    const docRef = await addDoc(documentsRef, docData);
    return docRef.id;
  } catch (error) {
    console.error('Error creating document:', error);
    throw error;
  }
}

export async function updateDocument(
  ownerUid: string,
  documentId: string,
  data: Partial<LegalDocument>
): Promise<void> {
  try {
    const docRef = doc(db, DOCUMENTS, documentId);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists() || docSnap.data().owner_uid !== ownerUid) {
      throw new Error('Document not found or access denied');
    }
    const { id, owner_uid, createdAt, ...updateData } = data;
    await updateDoc(docRef, {
      ...updateData,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('Error updating document:', error);
    throw error;
  }
}

export async function deleteDocument(ownerUid: string, documentId: string): Promise<void> {
  try {
    const docRef = doc(db, DOCUMENTS, documentId);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists() || docSnap.data().owner_uid !== ownerUid) {
      throw new Error('Document not found or access denied');
    }
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting document:', error);
    throw error;
  }
}

export function subscribeToDocuments(
  ownerUid: string,
  callback: (documents: LegalDocument[]) => void
): Unsubscribe {
  const q = query(
    documentsRef,
    where('owner_uid', '==', ownerUid),
    orderBy('createdAt', 'desc')
  );
  return onSnapshot(
    q,
    (snapshot) => {
      callback(snapshot.docs.map((d) => mapDocToLegalDocument(d.id, d.data())));
    },
    (error) => {
      console.error('Error listening to documents:', error);
    }
  );
}

// ---------------------------------------------------------------------------
// Document Template CRUD
// ---------------------------------------------------------------------------
export async function getTemplates(ownerUid: string): Promise<DocumentTemplate[]> {
  try {
    const q = query(
      templatesRef,
      where('owner_uid', '==', ownerUid),
      orderBy('name', 'asc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => mapDocToTemplate(d.id, d.data()));
  } catch (error) {
    console.error('Error fetching templates:', error);
    throw error;
  }
}

export async function getTemplateById(
  ownerUid: string,
  templateId: string
): Promise<DocumentTemplate | null> {
  try {
    const docRef = doc(db, TEMPLATES, templateId);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return null;
    const data = docSnap.data();
    if (data.owner_uid !== ownerUid) return null;
    return mapDocToTemplate(docSnap.id, data);
  } catch (error) {
    console.error('Error fetching template:', error);
    throw error;
  }
}

export async function createTemplate(
  ownerUid: string,
  data: Omit<DocumentTemplate, 'id' | 'owner_uid' | 'createdAt'>
): Promise<string> {
  try {
    const docData = {
      ...data,
      owner_uid: ownerUid,
      createdAt: Timestamp.now(),
    };
    const docRef = await addDoc(templatesRef, docData);
    return docRef.id;
  } catch (error) {
    console.error('Error creating template:', error);
    throw error;
  }
}

export async function updateTemplate(
  ownerUid: string,
  templateId: string,
  data: Partial<DocumentTemplate>
): Promise<void> {
  try {
    const docRef = doc(db, TEMPLATES, templateId);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists() || docSnap.data().owner_uid !== ownerUid) {
      throw new Error('Template not found or access denied');
    }
    const { id, owner_uid, createdAt, ...updateData } = data;
    await updateDoc(docRef, updateData);
  } catch (error) {
    console.error('Error updating template:', error);
    throw error;
  }
}

export async function deleteTemplate(ownerUid: string, templateId: string): Promise<void> {
  try {
    const docRef = doc(db, TEMPLATES, templateId);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists() || docSnap.data().owner_uid !== ownerUid) {
      throw new Error('Template not found or access denied');
    }
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting template:', error);
    throw error;
  }
}

// ---------------------------------------------------------------------------
// Message Template CRUD
// ---------------------------------------------------------------------------
export async function getMessageTemplates(ownerUid: string): Promise<MessageTemplate[]> {
  try {
    const q = query(
      messageTemplatesRef,
      where('owner_uid', '==', ownerUid),
      orderBy('name', 'asc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => mapDocToMessageTemplate(d.id, d.data()));
  } catch (error) {
    console.error('Error fetching message templates:', error);
    throw error;
  }
}

export async function getMessageTemplateById(
  ownerUid: string,
  templateId: string
): Promise<MessageTemplate | null> {
  try {
    const docRef = doc(db, MESSAGE_TEMPLATES, templateId);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return null;
    const data = docSnap.data();
    if (data.owner_uid !== ownerUid) return null;
    return mapDocToMessageTemplate(docSnap.id, data);
  } catch (error) {
    console.error('Error fetching message template:', error);
    throw error;
  }
}

export async function createMessageTemplate(
  ownerUid: string,
  data: Omit<MessageTemplate, 'id' | 'owner_uid' | 'createdAt'>
): Promise<string> {
  try {
    const docData = {
      ...data,
      owner_uid: ownerUid,
      createdAt: Timestamp.now(),
    };
    const docRef = await addDoc(messageTemplatesRef, docData);
    return docRef.id;
  } catch (error) {
    console.error('Error creating message template:', error);
    throw error;
  }
}

export async function updateMessageTemplate(
  ownerUid: string,
  templateId: string,
  data: Partial<MessageTemplate>
): Promise<void> {
  try {
    const docRef = doc(db, MESSAGE_TEMPLATES, templateId);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists() || docSnap.data().owner_uid !== ownerUid) {
      throw new Error('Message template not found or access denied');
    }
    const { id, owner_uid, createdAt, ...updateData } = data;
    await updateDoc(docRef, updateData);
  } catch (error) {
    console.error('Error updating message template:', error);
    throw error;
  }
}

export async function deleteMessageTemplate(
  ownerUid: string,
  templateId: string
): Promise<void> {
  try {
    const docRef = doc(db, MESSAGE_TEMPLATES, templateId);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists() || docSnap.data().owner_uid !== ownerUid) {
      throw new Error('Message template not found or access denied');
    }
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting message template:', error);
    throw error;
  }
}
