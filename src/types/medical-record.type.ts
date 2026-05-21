export type RecordStatus =
  | 'draft'
  | 'active'
  | 'completed'
  | 'archived';

export type RecordCategory =
  | 'consultation'
  | 'lab-report'
  | 'radiology'
  | 'prescription'
  | 'surgery'
  | 'vaccination'
  | 'discharge-summary'
  | 'emergency'
  | 'other';

export interface VitalSigns {
  temperature?: number; // Celsius
  bloodPressure?: string; // 120/80
  heartRate?: number; // bpm
  respiratoryRate?: number;
  oxygenSaturation?: number; // %
  height?: number; // cm
  weight?: number; // kg
}

export interface Prescription {
  medicineName: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string;
}

export interface LabResult {
  testName: string;
  result: string;
  normalRange?: string;
  unit?: string;
  remarks?: string;
}

export interface MedicalAttachment {
  id: string;
  fileName: string;
  fileType: string; // pdf, jpg, png, dicom...
  ipfsHash: string;
  uploadedAt: Date;
  uploadedBy: string;
}

export interface MedicalRecord {
  // Primary IDs
  id: string;
  patientId: string;
  // Blockchain
  transactionHash?: string;
  blockNumber?: number;
  // Record Details
  category: RecordCategory;
  status: RecordStatus;
  title: string;
  description?: string;
  // Clinical Data
  symptoms?: string[];
  diagnosis?: string[];
  treatmentPlan?: string;
  prescriptions?: Prescription[];
  labResults?: LabResult[];
  vitalSigns?: VitalSigns;
  allergies?: string[];
  notes?: string;
  // Healthcare Provider
  doctorId: string;
  doctorName: string;
  doctorWalletAddress?: string;
  // Dates
  visitDate: Date;
  followUpDate?: Date;
  // Files & Reports
  attachments?: MedicalAttachment[];
  // Audit
  createdAt: Date;
  updatedAt?: Date;
  createdBy: string;
}
