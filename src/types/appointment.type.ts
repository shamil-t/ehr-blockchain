export type AppointmentType = {
  id: string;
  patient: string;
  doctor: string;
  metadataCID: string;
  appointmentTime: number;
  status: AppointmentStatus;
  createdAt: string;
}

export enum AppointmentStatus {
  PENDING,
  APPROVED,
  REJECTED,
  COMPLETED,
  CANCELED
}

export interface AppointmentMetadataType {
  patientId: string;
  doctorId: string;
  status: AppointmentStatus;
  reason: string;
  symptoms?: string[];
  appointmentDate: Date;
  doctorName: string;
  doctorSpecialization?: string;
  patientName: string;
  notes?: string;
  createdAt: Date;
  updatedAt?: Date;
  createdBy: string;
  cancelledAt?: Date;
  cancellationReason?: string;
}
