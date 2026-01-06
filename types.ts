
export enum AttendanceStatus {
  HADIR = 'HADIR',
  IZIN = 'IZIN',
  SAKIT = 'SAKIT',
  ALPHA = 'ALPHA'
}

export interface Student {
  id: string;
  nisn: string;
  name: string;
  classId: string;
}

export interface ClassRoom {
  id: string;
  name: string;
}

export interface Subject {
  id: string;
  name: string;
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  classId: string;
  subjectId: string;
  date: string;
  status: AttendanceStatus;
}

export type ViewState = 'DASHBOARD' | 'MANAGEMENT_CLASS' | 'MANAGEMENT_SUBJECT' | 'ATTENDANCE' | 'RECAP';
