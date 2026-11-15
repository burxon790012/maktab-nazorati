// ============================================================================
// AI HEALTH GUARD (PROFESSIONAL EDITION) - ENTERPRISE TYPE SYSTEM
// Supporting Samsung Galaxy Watch 5 Pro, External Medical Devices, Multi-Clinic,
// Family Remote Monitoring, 12 AI Medical Modules & Trilingual Localization (UZ/RU/EN)
// ============================================================================

export type SupportedLanguage = 'uz' | 'ru' | 'en';

export type UserRole =
  | 'SUPER_ADMIN'
  | 'CLINIC_ADMIN'
  | 'DOCTOR'
  | 'NURSE'
  | 'RECEPTIONIST'
  | 'PATIENT'
  | 'FAMILY_CAREGIVER'
  | 'AUTHORIZED_VIEWER';

export type HealthAlertLevel = 'GREEN' | 'YELLOW' | 'ORANGE' | 'RED';

export type DataSourceType =
  | 'SAMSUNG_HEALTH_SENSOR_SDK'
  | 'HEALTH_CONNECT_API'
  | 'SAMSUNG_HEALTH_DATA_SDK'
  | 'WEAR_OS_RAW_SENSOR'
  | 'BLE_GLUCOMETER'
  | 'BLE_BP_MONITOR'
  | 'BLE_THERMOMETER'
  | 'BLE_PULSE_OXIMETER'
  | 'MANUAL_CLINICAL_ENTRY'
  | 'DEMO_SIMULATION';

// ----------------------------------------------------------------------------
// Multi-Tenant Clinic Management Entities
// ----------------------------------------------------------------------------
export interface Clinic {
  id: string;
  name: string;
  code: string;
  address: string;
  phone: string;
  email: string;
  licenseNumber: string;
  departments: string[];
  activePatientsCount: number;
  activeDoctorsCount: number;
  createdAt: string;
}

export interface Doctor {
  id: string;
  clinicId: string;
  name: string;
  specialty: string;
  licenseNumber: string;
  phone: string;
  email: string;
  assignedPatients: string[]; // Patient IDs
  status: 'ACTIVE' | 'ON_CALL' | 'OFF_DUTY';
}

export interface Patient {
  id: string;
  clinicId: string;
  name: string;
  age: number;
  gender: 'MALE' | 'FEMALE';
  bloodType: string;
  primaryDoctorId: string;
  primaryDoctorName?: string;
  deviceId: string;
  deviceModel: string;
  isRealWatchConnected: boolean;
  medicalConditions: string[];
  allergies: string[];
  emergencyContacts: EmergencyContact[];
  familyGroupId?: string;
}

// ----------------------------------------------------------------------------
// Family Remote Monitoring Entities
// ----------------------------------------------------------------------------
export interface FamilyGroup {
  id: string;
  name: string;
  ownerPatientId: string;
  members: FamilyMember[];
  emergencyProtocol: string;
  createdAt: string;
}

export interface FamilyMember {
  id: string;
  name: string;
  relation: 'PARENT' | 'CHILD' | 'SPOUSE' | 'CAREGIVER' | 'GUARDIAN';
  phone: string;
  email: string;
  role: 'FAMILY_CAREGIVER' | 'AUTHORIZED_VIEWER';
  permissions: {
    viewVitals: boolean;
    viewEcg: boolean;
    viewLocation: boolean;
    receiveEmergencySos: boolean;
    viewMedicalReports: boolean;
  };
  hasConsent: boolean;
}

export interface EmergencyContact {
  id: string;
  name: string;
  relation: string;
  phone: string;
  isPrimary: boolean;
  notifyOnSos: boolean;
}

// ----------------------------------------------------------------------------
// External Medical Devices (Glucose, BP, Thermometers)
// ----------------------------------------------------------------------------
export type ExternalDeviceCategory =
  | 'GLUCOSE_METER'
  | 'BLOOD_PRESSURE_MONITOR'
  | 'DIGITAL_THERMOMETER'
  | 'EXTERNAL_ECG'
  | 'PULSE_OXIMETER';

export interface ExternalMedicalDevice {
  id: string;
  category: ExternalDeviceCategory;
  name: string;
  manufacturer: string;
  model: string;
  connectionMethod: 'BLE' | 'HEALTH_CONNECT' | 'MANUAL';
  connectionStatus: 'CONNECTED' | 'DISCONNECTED' | 'PAIRING';
  batteryPct: number;
  lastMeasurementAt: string;
  lastValue: string;
  reliability: 'CLINICAL_GRADE' | 'CONSUMER_GRADE' | 'MANUAL_VERIFIED';
}

export interface GlucoseRecord {
  id: string;
  patientId: string;
  glucoseMgDl: number; // e.g. 95 mg/dL
  glucoseMmolL: number; // e.g. 5.3 mmol/L
  mealContext: 'FASTING' | 'BEFORE_MEAL' | 'AFTER_MEAL' | 'BEDTIME';
  timestamp: string;
  source: DataSourceType;
  isReal: boolean;
  notes?: string;
}

// ----------------------------------------------------------------------------
// 12 AI Medical Modules & Measurements
// ----------------------------------------------------------------------------
export interface HeartRateMetric {
  currentBpm: number;
  restingBpm: number;
  minBpm: number;
  maxBpm: number;
  hrvRmssdMs: number;
  hrvSdnnMs: number;
  timestamp: string;
  source: DataSourceType;
  isReal: boolean;
}

export interface EcgMetric {
  leadI: number[]; // Voltage waveform in mV
  sampleRateHz: number;
  durationSec: number;
  rhythmType: 'SINUS_RHYTHM' | 'SINUS_BRADYCARDIA' | 'SINUS_TACHYCARDIA' | 'ATRIAL_FIBRILLATION_SUSPECTED' | 'INCONCLUSIVE';
  classificationConfidence: number;
  qtcIntervalMs: number;
  prIntervalMs: number;
  averageBpm: number;
  recordedAt: string;
  source: DataSourceType;
  isReal: boolean;
}

export interface BloodOxygenMetric {
  spo2Percentage: number;
  minSpo2: number;
  maxSpo2: number;
  nocturnalDipsCount: number;
  lowestNightSpo2: number;
  timestamp: string;
  source: DataSourceType;
  isReal: boolean;
}

export interface BloodPressureMetric {
  systolic: number;
  diastolic: number;
  meanArterialPressure: number;
  pulseRate: number;
  category: 'NORMAL' | 'ELEVATED' | 'STAGE_1_HT' | 'STAGE_2_HT' | 'HYPERTENSIVE_CRISIS';
  timestamp: string;
  source: DataSourceType;
  isReal: boolean;
  calibrationDate?: string;
  isCalibrated: boolean;
}

export interface SkinTemperatureMetric {
  skinTempCelsius: number;
  coreTempEstimateCelsius: number;
  baselineDeviation: number;
  timestamp: string;
  source: DataSourceType;
  isReal: boolean;
  isClinicalFever: boolean; // Flagged with medical limitations
}

export interface SleepMetric {
  totalMinutes: number;
  deepMinutes: number;
  lightMinutes: number;
  remMinutes: number;
  awakeMinutes: number;
  sleepScore: number;
  efficiencyPercentage: number;
  startTime: string;
  endTime: string;
  snoringMinutes: number;
  apneaRiskIndicator: 'LOW' | 'MODERATE' | 'HIGH';
  isReal: boolean;
  source: DataSourceType;
}

export interface StressRecoveryMetric {
  stressScore: number; // 0-100
  stressCategory: 'REST' | 'LOW' | 'MEDIUM' | 'HIGH';
  recoveryScore: number; // 0-100
  fatigueIndex: number; // 0-100
  autonomicBalance: 'PARASYMPATHETIC_DOMINANT' | 'BALANCED' | 'SYMPATHETIC_DOMINANT';
  recommendations: string[];
  timestamp: string;
  isReal: boolean;
  source: DataSourceType;
}

export interface BodyCompositionMetric {
  weightKg: number;
  bodyFatPercentage: number;
  skeletalMuscleKg: number;
  bodyWaterPercentage: number;
  bmi: number;
  bmrKcal: number;
  visceralFatLevel: number;
  timestamp: string;
  source: DataSourceType;
  isReal: boolean;
}

export interface DigitalHealthTwin {
  patientId: string;
  personalBaseline: {
    restingBpm: number;
    normalSpo2: number;
    normalSystolic: number;
    normalDiastolic: number;
    avgSleepHours: number;
    normalHrv: number;
    typicalDailySteps: number;
  };
  deviations: Array<{
    parameter: string;
    deviationPct: number;
    trend: 'INCREASING' | 'DECREASING' | 'STABLE';
    significance: 'LOW' | 'MODERATE' | 'HIGH';
  }>;
  riskPredictiveHorizonDays: number;
  predictedTrendSummary: string;
  lastUpdated: string;
}

// ----------------------------------------------------------------------------
// Emergency SOS System
// ----------------------------------------------------------------------------
export interface EmergencySosEvent {
  id: string;
  patientId: string;
  patientName: string;
  triggerType: 'MANUAL_SOS' | 'FALL_DETECTION_CONFIRMED' | 'CRITICAL_VITALS_TRIGGER';
  latitude: number;
  longitude: number;
  accuracyMeters: number;
  timestamp: string;
  status: 'ACTIVE_COUNTDOWN' | 'BROADCASTED' | 'CANCELLED_BY_USER' | 'RESOLVED_BY_DISPATCH';
  countdownSecondsRemaining: number;
  cancellationSafeguardReason?: string;
  notifiedContacts: string[];
}

// ----------------------------------------------------------------------------
// Navigation & Views (21 Pages)
// ----------------------------------------------------------------------------
export type ProViewId =
  | 'dashboard'
  | 'heart'
  | 'ecg'
  | 'spo2'
  | 'bp'
  | 'sleep'
  | 'stress'
  | 'recovery'
  | 'body_comp'
  | 'temp'
  | 'digital_twin'
  | 'ai_assistant'
  | 'family'
  | 'doctor_portal'
  | 'clinic_admin'
  | 'external_devices'
  | 'emergency_sos'
  | 'medical_reports'
  | 'notifications'
  | 'device_connection'
  | 'privacy_settings';

export interface TimeSeriesPoint {
  time: string;
  timestamp: number;
  bpm?: number;
  spo2?: number;
  systolic?: number;
  diastolic?: number;
  glucose?: number;
  stress?: number;
  temp?: number;
  steps?: number;
  hrv?: number;
}
