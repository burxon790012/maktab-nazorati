export type Role = 'SUPER_ADMIN' | 'SCHOOL_ADMIN' | 'TEACHER' | 'PARENT';

export interface School {
  id: string;
  geofenceId: string;
  name: string;
  name_ru?: string;
  name_en?: string;
  code: string;
  address: string;
  lat: number;
  lng: number;
  startTime: string;
  endTime: string;
  color?: string;
  polygon: [number, number][];
  adminEmail?: string;
  totalStudents?: number;
}

export interface StudentTelemetry {
  latitude: number;
  longitude: number;
  accuracy?: number;
  speed?: number;
  heading?: number;
  altitude?: number;
  heartRate?: number;
  bodyTemperature?: number;
  stepCount?: number;
  batteryLevel?: number;
  isCharging?: boolean;
  isSos?: boolean;
  geofenceStatus?: 'INSIDE' | 'OUTSIDE' | 'VERIFYING' | 'UNKNOWN';
  statusColor?: 'GREEN' | 'RED' | 'YELLOW' | 'GRAY';
  statusDisplay?: string;
  lastSeen?: number;
}

export interface StudentAttendance {
  id?: string;
  studentId: string;
  schoolId: string;
  date: string;
  arrivalTime?: string | null;
  departureTime?: string | null;
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'LEFT';
  statusColor: 'GREEN' | 'RED' | 'YELLOW' | 'GRAY';
  statusDisplay: string;
  isManualCorrection?: boolean;
  correctedBy?: string;
  correctionReason?: string;
}

export interface Student {
  id: string;
  studentId: string;
  uniqueId: string;
  name: string;
  schoolId: string;
  schoolName: string;
  classId?: string;
  className: string;
  parentId?: string;
  parentName?: string;
  parentPhone?: string;
  deviceId: string;
  deviceModel?: string;
  photo?: string;
  status?: string;
  telemetry?: StudentTelemetry;
  todayAttendance?: StudentAttendance;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: Role;
  schoolId?: string | null;
  schoolName?: string | null;
  classId?: string | null;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  user: string;
  role: string;
  action: string;
  target: string;
  details: string;
}

export interface NotificationItem {
  id: string;
  type: 'ARRIVAL' | 'DEPARTURE' | 'SOS' | 'CUSTOM';
  title: string;
  message: string;
  time: string;
  isRead?: boolean;
}
