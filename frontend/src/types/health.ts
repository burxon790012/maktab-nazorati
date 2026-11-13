// AI HEALTH GUARD - Complete Type Definitions for Samsung Galaxy Watch 5 Pro Medical Suite

export type DataSourceType =
  | 'SAMSUNG_HEALTH_SENSOR_SDK'
  | 'HEALTH_CONNECT_API'
  | 'SAMSUNG_HEALTH_DATA_SDK'
  | 'WEAR_OS_RAW_SENSOR'
  | 'DEMO_SIMULATION';

export type SensorStatusType =
  | 'ACTIVE'
  | 'NEEDS_PERMISSION'
  | 'PARTNER_APPROVAL_REQUIRED'
  | 'UNAVAILABLE'
  | 'CALIBRATING';

export interface SensorCapability {
  id: string;
  name: string;
  techName: string;
  status: SensorStatusType;
  description: string;
  requiredPermission: string;
  isMedicalGrade: boolean;
  notes?: string;
}

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
  leadI: number[]; // Voltage waveform points in mV
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
  tempCelsius: number;
  baselineDeviation: number;
  nocturnalAvgCelsius: number;
  timestamp: string;
  source: DataSourceType;
  isReal: boolean;
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
  apneaRiskIndicator: 'LOW' | 'MODERATE' | 'HIGH';
  isReal: boolean;
  source: DataSourceType;
}

export interface StressRecoveryMetric {
  stressScore: number; // 0-100
  stressCategory: 'REST' | 'LOW' | 'MEDIUM' | 'HIGH';
  recoveryScore: number; // 0-100
  autonomicBalance: 'PARASYMPATHETIC_DOMINANT' | 'BALANCED' | 'SYMPATHETIC_DOMINANT';
  recommendations: string[];
  timestamp: string;
  isReal: boolean;
  source: DataSourceType;
}

export interface ActivityMetric {
  steps: number;
  activeMinutes: number;
  caloriesBurnedKcal: number;
  distanceMeters: number;
  hourlyGoalMet: boolean;
  timestamp: string;
  isReal: boolean;
  source: DataSourceType;
}

export type HealthAlertLevel = 'GREEN' | 'YELLOW' | 'ORANGE' | 'RED';

export interface HealthRiskFinding {
  id: string;
  module: 'HEART' | 'SPO2' | 'BLOOD_PRESSURE' | 'SLEEP' | 'STRESS' | 'BODY_COMP';
  status: 'NORMAL' | 'ELEVATED' | 'WARNING' | 'CRITICAL';
  metricName: string;
  currentValue: string;
  baselineValue: string;
  explanation: string;
  clinicalNote: string;
}

export interface AiRiskAssessment {
  level: HealthAlertLevel;
  overallScore: number; // 0-100
  title: string;
  summary: string;
  findings: HealthRiskFinding[];
  recommendations: string[];
  emergencyNotice?: string;
  lastEvaluatedAt: string;
  requiresMedicalConsultation: boolean;
}

export interface AiAssistantMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  referencedMetrics?: Array<{
    label: string;
    value: string;
    date: string;
  }>;
  disclaimer?: string;
}

export interface TimeSeriesPoint {
  time: string;
  timestamp: number;
  bpm?: number;
  spo2?: number;
  systolic?: number;
  diastolic?: number;
  stress?: number;
  temp?: number;
  steps?: number;
  hrv?: number;
}

export type TimeRangeFilter = '24H' | '7D' | '30D' | '90D';

export interface MedicalReportData {
  id: string;
  studentId: string;
  studentName: string;
  period: 'DAILY' | 'WEEKLY' | 'MONTHLY';
  generatedAt: string;
  overallStatus: HealthAlertLevel;
  summaryText: string;
  heartHealthSection: {
    avgBpm: number;
    restingBpm: number;
    hrvAvg: number;
    arrhythmiaEvents: number;
  };
  oxygenSection: {
    avgSpo2: number;
    minSpo2: number;
    nocturnalEvents: number;
  };
  bloodPressureSection: {
    avgSystolic: number;
    avgDiastolic: number;
    category: string;
  };
  sleepSection: {
    avgDurationHours: number;
    avgScore: number;
    deepSleepPct: number;
  };
  stressActivitySection: {
    avgStress: number;
    avgSteps: number;
    recoveryQuality: string;
  };
  aiRecommendations: string[];
  doctorReviewNotes?: string;
}
