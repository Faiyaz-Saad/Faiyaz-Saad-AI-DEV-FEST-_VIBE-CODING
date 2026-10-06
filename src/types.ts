export type Language = 'en' | 'bn';

export interface RequiredDocument {
  id: string;
  order: number;
  title_en: string;
  title_bn: string;
  mandatory: boolean;
  has_expiry: boolean;
}

export interface TenderRequirements {
  tender_id: string;
  title: string;
  title_en?: string;
  title_bn?: string;
  procuring_entity: string;
  bidder: string;
  submission_deadline: string; // YYYY-MM-DD
  documents: RequiredDocument[];
}

export interface UploadedPdfFile {
  id: string;
  name: string;
  sizeBytes: number;
  pageCount: number;
  sha256: string;
  arrayBuffer: ArrayBuffer;
  uploadedAt: string;
}

export interface DocumentMatchState {
  docId: string;
  fileId: string | null;
  expiryDate: string; // YYYY-MM-DD or ''
}

export enum DocumentStatusType {
  Missing = 'Missing',
  ExpiryDateNeeded = 'Expiry date needed',
  Expired = 'Expired',
  NotProvided = 'Not provided',
  OK = 'OK',
}

export interface ComputedDocumentStatus {
  status: DocumentStatusType;
  isBlocking: boolean;
  reasonEn?: string;
  reasonBn?: string;
}
