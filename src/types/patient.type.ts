export type PatientType = {
  id: string;
  // Blockchain
  walletAddress: string;
  // Personal Info
  firstName: string;
  lastName: string;
  gender: 'male' | 'female' | 'other';
  dateOfBirth: Date;
  bloodGroup?: string;
  // Contact
  email: string;
  phone: string;
  address?: string;
  // Emergency
  emergencyContact?: EmergencyContact;
  // Medical
  allergies?: string[];
  chronicDiseases?: string[];
  medications?: string[];
  // Metadata
  createdAt: Date;
  updatedAt?: Date;
  isActive: boolean;
}

export interface EmergencyContact {
  name: string;
  relation: string;
  phone: string;
}
