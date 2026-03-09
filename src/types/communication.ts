export type CommunicationType =
  | 'phone_call'
  | 'whatsapp'
  | 'email'
  | 'in_person'
  | 'video_call'
  | 'other';

export type CommunicationDirection = 'incoming' | 'outgoing';

export interface Communication {
  id: string;
  owner_uid: string;
  clientId: string;
  clientName: string;
  caseId?: string;
  type: CommunicationType;
  direction: CommunicationDirection;
  subject: string;
  notes?: string;
  duration?: number;
  date: Date;
  followUpDate?: Date;
  followUpDone: boolean;
  createdAt: Date;
}

export interface CommunicationFormData {
  clientId: string;
  clientName: string;
  caseId?: string;
  type: CommunicationType;
  direction: CommunicationDirection;
  subject: string;
  notes?: string;
  duration?: number;
  date: Date;
  followUpDate?: Date;
}

export const COMMUNICATION_TYPES: { label: string; value: CommunicationType }[] = [
  { label: 'Ligacao', value: 'phone_call' },
  { label: 'WhatsApp', value: 'whatsapp' },
  { label: 'E-mail', value: 'email' },
  { label: 'Presencial', value: 'in_person' },
  { label: 'Videochamada', value: 'video_call' },
  { label: 'Outro', value: 'other' },
];
