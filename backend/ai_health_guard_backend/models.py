"""
AI HEALTH GUARD — Enterprise Healthcare Data Models
SQLAlchemy ORM with Multi-Tenant Clinic Isolation and Audit Logging.
"""

import datetime
from sqlalchemy import (
    Column,
    String,
    Integer,
    Float,
    Boolean,
    DateTime,
    ForeignKey,
    Text,
    Enum as SQLEnum,
    JSON
)
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()

class Clinic(Base):
    __tablename__ = "clinics"

    id = Column(String(64), primary_key=True)
    name = Column(String(255), nullable=False)
    license_number = Column(String(128), unique=True, nullable=False)
    country = Column(String(64), default="Uzbekistan")
    city = Column(String(128), default="Tashkent")
    address = Column(String(255), nullable=True)
    phone = Column(String(64), nullable=True)
    tier = Column(String(32), default="ENTERPRISE")
    hipaa_compliant = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    doctors = relationship("Doctor", back_populates="clinic", cascade="all, delete-orphan")
    patients = relationship("Patient", back_populates="clinic", cascade="all, delete-orphan")


class Doctor(Base):
    __tablename__ = "doctors"

    id = Column(String(64), primary_key=True)
    clinic_id = Column(String(64), ForeignKey("clinics.id"), nullable=False, index=True)
    full_name = Column(String(255), nullable=False)
    specialty = Column(String(128), default="Cardiology / Pediatrics")
    license_id = Column(String(128), nullable=False)
    email = Column(String(128), unique=True, nullable=False)
    phone = Column(String(64), nullable=True)
    role = Column(String(32), default="CLINICIAN")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    clinic = relationship("Clinic", back_populates="doctors")
    assigned_patients = relationship("Patient", back_populates="assigned_doctor")


class Patient(Base):
    __tablename__ = "patients"

    id = Column(String(64), primary_key=True)
    clinic_id = Column(String(64), ForeignKey("clinics.id"), nullable=False, index=True)
    doctor_id = Column(String(64), ForeignKey("doctors.id"), nullable=True)
    full_name = Column(String(255), nullable=False)
    date_of_birth = Column(String(32), nullable=True)
    gender = Column(String(16), default="MALE")
    national_id = Column(String(64), nullable=True)
    blood_group = Column(String(16), default="O(I) Rh+")
    emergency_contact_phone = Column(String(64), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    clinic = relationship("Clinic", back_populates="patients")
    assigned_doctor = relationship("Doctor", back_populates="assigned_patients")
    wearables = relationship("WearableDevice", back_populates="patient", cascade="all, delete-orphan")
    external_devices = relationship("ExternalMedicalDevice", back_populates="patient", cascade="all, delete-orphan")
    health_metrics = relationship("HealthMetric", back_populates="patient", cascade="all, delete-orphan")
    glucose_records = relationship("GlucoseRecord", back_populates="patient", cascade="all, delete-orphan")
    alerts = relationship("AlertEvent", back_populates="patient", cascade="all, delete-orphan")
    emergency_events = relationship("EmergencySosEvent", back_populates="patient", cascade="all, delete-orphan")


class FamilyGroup(Base):
    __tablename__ = "family_groups"

    id = Column(String(64), primary_key=True)
    patient_id = Column(String(64), ForeignKey("patients.id"), nullable=False, index=True)
    guardian_name = Column(String(255), nullable=False)
    relationship_to_patient = Column(String(64), default="Parent")
    phone = Column(String(64), nullable=False)
    role = Column(String(32), default="PRIMARY_GUARDIAN") # PRIMARY_GUARDIAN, VIEWER, EMERGENCY_RESPONDER
    receive_critical_alerts = Column(Boolean, default=True)
    receive_daily_digest = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


class WearableDevice(Base):
    __tablename__ = "wearable_devices"

    id = Column(String(64), primary_key=True)
    patient_id = Column(String(64), ForeignKey("patients.id"), nullable=False, index=True)
    device_model = Column(String(128), default="Samsung Galaxy Watch 5 Pro")
    serial_number = Column(String(128), unique=True, nullable=False)
    firmware_version = Column(String(64), default="R920XXU1BXB4 / Wear OS 4.0")
    battery_percentage = Column(Integer, default=88)
    is_online = Column(Boolean, default=True)
    ppg_active = Column(Boolean, default=True)
    bia_active = Column(Boolean, default=True)
    ecg_active = Column(Boolean, default=True)
    skin_temp_active = Column(Boolean, default=True)
    last_synced_at = Column(DateTime, default=datetime.datetime.utcnow)

    patient = relationship("Patient", back_populates="wearables")


class ExternalMedicalDevice(Base):
    __tablename__ = "external_medical_devices"

    id = Column(String(64), primary_key=True)
    patient_id = Column(String(64), ForeignKey("patients.id"), nullable=False, index=True)
    device_type = Column(String(64), nullable=False) # GLUCOSE_METER, BP_CUFF, THERMOMETER, PULSE_OXIMETER, EXTERNAL_ECG
    device_name = Column(String(128), nullable=False)
    manufacturer = Column(String(128), nullable=False)
    model_number = Column(String(128), nullable=False)
    bluetooth_address = Column(String(64), nullable=True)
    connection_status = Column(String(32), default="CONNECTED")
    battery_level = Column(Integer, default=95)
    last_reading_time = Column(DateTime, default=datetime.datetime.utcnow)

    patient = relationship("Patient", back_populates="external_devices")


class HealthMetric(Base):
    __tablename__ = "health_metrics"

    id = Column(String(64), primary_key=True)
    patient_id = Column(String(64), ForeignKey("patients.id"), nullable=False, index=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow, index=True)
    source = Column(String(64), default="GALAXY_WATCH_5_PRO_PPG")
    is_real_measurement = Column(Boolean, default=True)

    # Core Biometrics
    heart_rate_bpm = Column(Float, nullable=True)
    hrv_rmssd_ms = Column(Float, nullable=True)
    spo2_percentage = Column(Float, nullable=True)
    systolic_bp = Column(Float, nullable=True)
    diastolic_bp = Column(Float, nullable=True)
    skin_temp_celsius = Column(Float, nullable=True)
    body_fat_percentage = Column(Float, nullable=True)
    skeletal_muscle_kg = Column(Float, nullable=True)
    stress_level = Column(Integer, default=25)
    fatigue_index = Column(Integer, default=20)
    sleep_score = Column(Integer, default=85)
    steps_count = Column(Integer, default=5200)

    # AI Computed Risk Indices
    cardiovascular_risk_score = Column(Float, default=12.0)
    arrhythmia_flag = Column(Boolean, default=False)
    hypoxia_flag = Column(Boolean, default=False)
    hypertension_flag = Column(Boolean, default=False)
    recovery_index = Column(Float, default=88.5)

    patient = relationship("Patient", back_populates="health_metrics")


class GlucoseRecord(Base):
    __tablename__ = "glucose_records"

    id = Column(String(64), primary_key=True)
    patient_id = Column(String(64), ForeignKey("patients.id"), nullable=False, index=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow, index=True)
    glucose_mmol_l = Column(Float, nullable=False)
    meal_context = Column(String(32), default="FASTING") # FASTING, PRE_MEAL, POST_MEAL, BEDTIME
    source_device = Column(String(128), default="Accu-Chek Guide Me BLE")
    is_hypo = Column(Boolean, default=False)
    is_hyper = Column(Boolean, default=False)

    patient = relationship("Patient", back_populates="glucose_records")


class AlertEvent(Base):
    __tablename__ = "alert_events"

    id = Column(String(64), primary_key=True)
    patient_id = Column(String(64), ForeignKey("patients.id"), nullable=False, index=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow, index=True)
    severity = Column(String(32), default="INFO") # INFO, WARNING, CRITICAL
    category = Column(String(64), default="HEART_RATE")
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    ai_recommendation = Column(Text, nullable=True)
    acknowledged = Column(Boolean, default=False)
    resolved_by = Column(String(128), nullable=True)

    patient = relationship("Patient", back_populates="alerts")


class EmergencySosEvent(Base):
    __tablename__ = "emergency_sos_events"

    id = Column(String(64), primary_key=True)
    patient_id = Column(String(64), ForeignKey("patients.id"), nullable=False, index=True)
    triggered_at = Column(DateTime, default=datetime.datetime.utcnow)
    status = Column(String(32), default="COUNTDOWN") # COUNTDOWN, DISPATCHED, CANCELLED_BY_USER, RESOLVED
    trigger_type = Column(String(64), default="MANUAL_WATCH_HOLD") # MANUAL_WATCH_HOLD, TACHYCARDIA_COLLAPSE, CRITICAL_FALL
    latitude = Column(Float, default=41.5695)
    longitude = Column(Float, default=60.6327)
    cancellation_reason = Column(String(255), nullable=True)
    cancelled_at = Column(DateTime, nullable=True)
    dispatched_at = Column(DateTime, nullable=True)
    dispatched_to = Column(JSON, default=list) # List of dispatched responders (103, family, clinic)

    patient = relationship("Patient", back_populates="emergency_events")


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String(64), primary_key=True)
    clinic_id = Column(String(64), nullable=True, index=True)
    actor_id = Column(String(64), nullable=False)
    actor_role = Column(String(32), nullable=False)
    action = Column(String(128), nullable=False)
    resource_type = Column(String(64), nullable=False)
    resource_id = Column(String(64), nullable=True)
    ip_address = Column(String(64), default="127.0.0.1")
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    details = Column(JSON, nullable=True)
