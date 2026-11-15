"""
AI HEALTH GUARD — Pydantic Schemas
Strict validation for incoming biometrics, external devices, AI evaluations, and emergency dispatches.
"""

from typing import List, Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field

# --- Clinic & Tenant Schemas ---
class ClinicBase(BaseModel):
    name: str
    license_number: str
    country: str = "Uzbekistan"
    city: str = "Tashkent"
    address: Optional[str] = None
    phone: Optional[str] = None
    tier: str = "ENTERPRISE"
    hipaa_compliant: bool = True

class ClinicCreate(ClinicBase):
    id: str

class ClinicOut(ClinicBase):
    id: str
    created_at: datetime
    class Config:
        orm_mode = True

# --- Doctor Schemas ---
class DoctorBase(BaseModel):
    full_name: str
    specialty: str = "Cardiology / Pediatrics"
    license_id: str
    email: str
    phone: Optional[str] = None
    role: str = "CLINICIAN"
    is_active: bool = True

class DoctorCreate(DoctorBase):
    id: str
    clinic_id: str

class DoctorOut(DoctorBase):
    id: str
    clinic_id: str
    created_at: datetime
    class Config:
        orm_mode = True

# --- Patient Schemas ---
class PatientBase(BaseModel):
    full_name: str
    date_of_birth: Optional[str] = None
    gender: str = "MALE"
    blood_group: str = "O(I) Rh+"
    emergency_contact_phone: Optional[str] = None
    is_active: bool = True

class PatientCreate(PatientBase):
    id: str
    clinic_id: str
    doctor_id: Optional[str] = None

class PatientOut(PatientBase):
    id: str
    clinic_id: str
    doctor_id: Optional[str] = None
    created_at: datetime
    class Config:
        orm_mode = True

# --- Biometric Telemetry Ingestion ---
class BiometricTelemetryInput(BaseModel):
    patient_id: str
    device_model: str = "Samsung Galaxy Watch 5 Pro"
    source: str = "GALAXY_WATCH_5_PRO_PPG"
    is_real_measurement: bool = True
    heart_rate_bpm: Optional[float] = Field(None, ge=30, le=240)
    hrv_rmssd_ms: Optional[float] = Field(None, ge=5, le=300)
    spo2_percentage: Optional[float] = Field(None, ge=70, le=100)
    systolic_bp: Optional[float] = Field(None, ge=60, le=220)
    diastolic_bp: Optional[float] = Field(None, ge=40, le=140)
    skin_temp_celsius: Optional[float] = Field(None, ge=30.0, le=42.0)
    body_fat_percentage: Optional[float] = Field(None, ge=3.0, le=60.0)
    skeletal_muscle_kg: Optional[float] = Field(None, ge=10.0, le=90.0)
    stress_level: Optional[int] = Field(25, ge=0, le=100)
    fatigue_index: Optional[int] = Field(20, ge=0, le=100)
    sleep_score: Optional[int] = Field(85, ge=0, le=100)
    steps_count: Optional[int] = Field(5200, ge=0)

# --- External Device Schemas ---
class ExternalDeviceCreate(BaseModel):
    id: str
    patient_id: str
    device_type: str # GLUCOSE_METER, BP_CUFF, THERMOMETER, PULSE_OXIMETER, EXTERNAL_ECG
    device_name: str
    manufacturer: str
    model_number: str
    bluetooth_address: Optional[str] = None
    battery_level: int = 95

class GlucoseRecordCreate(BaseModel):
    id: str
    patient_id: str
    glucose_mmol_l: float = Field(..., ge=1.5, le=33.3)
    meal_context: str = "FASTING" # FASTING, PRE_MEAL, POST_MEAL, BEDTIME
    source_device: str = "Accu-Chek Guide Me BLE"

# --- Emergency SOS Schemas ---
class EmergencySosTrigger(BaseModel):
    patient_id: str
    trigger_type: str = "MANUAL_WATCH_HOLD"
    latitude: float = 41.5695
    longitude: float = 60.6327

class EmergencySosCancel(BaseModel):
    event_id: str
    cancellation_reason: str = "Accidental tap cancelled within 15-second safeguard window"

# --- AI Analysis Request / Response ---
class AiAnalysisResponse(BaseModel):
    patient_id: str
    timestamp: datetime
    overall_health_score: int
    cardiovascular_risk: Dict[str, Any]
    arrhythmia_analysis: Dict[str, Any]
    hypoxia_risk: Dict[str, Any]
    hypertension_risk: Dict[str, Any]
    sleep_apnea_risk: Dict[str, Any]
    autonomic_recovery: Dict[str, Any]
    digital_twin_variance: Dict[str, Any]
    critical_alerts: List[Dict[str, Any]]
    actionable_recommendations: List[str]
    clinical_disclaimer: str
