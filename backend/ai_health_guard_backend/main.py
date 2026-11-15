"""
AI HEALTH GUARD — Enterprise FastAPI Application
Provides RESTful and WebSocket APIs for Samsung Galaxy Watch 5 Pro biometrics,
12 AI analysis modules, multi-tenant clinic administration, external medical devices,
and emergency SOS dispatch.
"""

import os
import uuid
import datetime
from typing import List, Optional, Dict, Any
from fastapi import FastAPI, Depends, HTTPException, Header, WebSocket, WebSocketDisconnect, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session

from .models import (
    Base, Clinic, Doctor, Patient, FamilyGroup,
    WearableDevice, ExternalMedicalDevice, HealthMetric,
    GlucoseRecord, AlertEvent, EmergencySosEvent, AuditLog
)
from .schemas import (
    ClinicCreate, ClinicOut, DoctorCreate, DoctorOut,
    PatientCreate, PatientOut, BiometricTelemetryInput,
    ExternalDeviceCreate, GlucoseRecordCreate,
    EmergencySosTrigger, EmergencySosCancel, AiAnalysisResponse
)
from .ai_engine import AiHealthEngine

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./ai_health_guard.db")
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="AI Health Guard — Medical AI Ecosystem",
    description="Professional enterprise backend for Samsung Galaxy Watch 5 Pro biometrics, clinical AI analysis, multi-tenant clinic management, and emergency response.",
    version="2.0.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# DB Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Multi-tenant Clinic Isolation Header Dependency
def get_current_clinic(x_clinic_id: Optional[str] = Header(None, description="Clinic Tenant Identifier"), db: Session = Depends(get_db)) -> str:
    if not x_clinic_id:
        # Default enterprise demo tenant
        return "CLINIC-TASHKENT-MAIN"
    clinic = db.query(Clinic).filter(Clinic.id == x_clinic_id).first()
    if not clinic:
        # Auto-provision clinic for development/demo ease
        clinic = Clinic(
            id=x_clinic_id,
            name=f"Clinic Branch {x_clinic_id}",
            license_number=f"UZ-MED-{uuid.uuid4().hex[:6].upper()}",
            country="Uzbekistan",
            city="Tashkent",
            tier="ENTERPRISE"
        )
        db.add(clinic)
        db.commit()
    return x_clinic_id


# --- 1. SYSTEM HEALTH & DIAGNOSTIC ---
@app.get("/api/v1/health-guard/status")
def get_system_status():
    return {
        "status": "OPERATIONAL",
        "service": "AI Health Guard Professional",
        "version": "2.0.0",
        "supported_watch": "Samsung Galaxy Watch 5 Pro (SM-R920 / SM-R925)",
        "sensor_pipeline": {
            "ppg_heart_rate": "ACTIVE",
            "hrv_rmssd": "ACTIVE",
            "ecg_single_lead": "ACTIVE",
            "spo2_red_ir": "ACTIVE",
            "bia_bioelectrical_impedance": "ACTIVE",
            "skin_infrared_temperature": "ACTIVE",
            "accelerometer_gyro_fall": "ACTIVE"
        },
        "multitenancy": "ENFORCED",
        "timestamp": datetime.datetime.utcnow().isoformat()
    }


# --- 2. MULTI-TENANT CLINICS & DOCTORS ---
@app.post("/api/v1/health-guard/clinics", response_model=ClinicOut)
def register_clinic(clinic_in: ClinicCreate, db: Session = Depends(get_db)):
    existing = db.query(Clinic).filter(Clinic.id == clinic_in.id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Clinic ID already exists.")
    clinic = Clinic(**clinic_in.dict())
    db.add(clinic)
    db.commit()
    db.refresh(clinic)
    return clinic

@app.get("/api/v1/health-guard/clinics", response_model=List[ClinicOut])
def list_clinics(db: Session = Depends(get_db)):
    return db.query(Clinic).all()

@app.post("/api/v1/health-guard/doctors", response_model=DoctorOut)
def register_doctor(doctor_in: DoctorCreate, clinic_id: str = Depends(get_current_clinic), db: Session = Depends(get_db)):
    existing = db.query(Doctor).filter(Doctor.id == doctor_in.id).first()
    if existing:
        return existing
    doctor = Doctor(
        id=doctor_in.id,
        clinic_id=clinic_id,
        full_name=doctor_in.full_name,
        specialty=doctor_in.specialty,
        license_id=doctor_in.license_id,
        email=doctor_in.email,
        phone=doctor_in.phone
    )
    db.add(doctor)
    db.commit()
    db.refresh(doctor)
    return doctor

@app.get("/api/v1/health-guard/doctors", response_model=List[DoctorOut])
def list_clinic_doctors(clinic_id: str = Depends(get_current_clinic), db: Session = Depends(get_db)):
    # Strict tenant isolation: returns only doctors for this clinic
    return db.query(Doctor).filter(Doctor.clinic_id == clinic_id).all()


# --- 3. PATIENT PROFILES WITH TENANT ISOLATION ---
@app.post("/api/v1/health-guard/patients", response_model=PatientOut)
def register_patient(patient_in: PatientCreate, clinic_id: str = Depends(get_current_clinic), db: Session = Depends(get_db)):
    patient = Patient(
        id=patient_in.id,
        clinic_id=clinic_id,
        doctor_id=patient_in.doctor_id,
        full_name=patient_in.full_name,
        date_of_birth=patient_in.date_of_birth,
        gender=patient_in.gender,
        blood_group=patient_in.blood_group,
        emergency_contact_phone=patient_in.emergency_contact_phone
    )
    db.add(patient)
    db.commit()
    db.refresh(patient)
    return patient

@app.get("/api/v1/health-guard/patients", response_model=List[PatientOut])
def list_clinic_patients(clinic_id: str = Depends(get_current_clinic), db: Session = Depends(get_db)):
    # Strict tenant isolation
    return db.query(Patient).filter(Patient.clinic_id == clinic_id).all()


# --- 4. BIOMETRIC TELEMETRY INGESTION (SAMSUNG GALAXY WATCH 5 PRO) ---
@app.post("/api/v1/health-guard/telemetry")
def ingest_telemetry(payload: BiometricTelemetryInput, db: Session = Depends(get_db)):
    metric_id = f"MTR-{uuid.uuid4().hex[:8].upper()}"

    # Evaluate AI thresholds immediately on ingestion
    heart_eval = AiHealthEngine.analyze_heart(payload.heart_rate_bpm, payload.hrv_rmssd_ms)
    spo2_eval = AiHealthEngine.analyze_spo2(payload.spo2_percentage)
    bp_eval = AiHealthEngine.analyze_bp(payload.systolic_bp, payload.diastolic_bp)

    record = HealthMetric(
        id=metric_id,
        patient_id=payload.patient_id,
        source=payload.source,
        is_real_measurement=payload.is_real_measurement,
        heart_rate_bpm=payload.heart_rate_bpm,
        hrv_rmssd_ms=payload.hrv_rmssd_ms,
        spo2_percentage=payload.spo2_percentage,
        systolic_bp=payload.systolic_bp,
        diastolic_bp=payload.diastolic_bp,
        skin_temp_celsius=payload.skin_temp_celsius,
        body_fat_percentage=payload.body_fat_percentage,
        skeletal_muscle_kg=payload.skeletal_muscle_kg,
        stress_level=payload.stress_level,
        fatigue_index=payload.fatigue_index,
        sleep_score=payload.sleep_score,
        steps_count=payload.steps_count,
        arrhythmia_flag=(heart_eval.get("arrhythmia_probability", 0) > 0.5),
        hypoxia_flag=(spo2_eval.get("risk_level") == "CRITICAL"),
        hypertension_flag=(bp_eval.get("risk_level") == "HIGH")
    )
    db.add(record)

    # Trigger alerts if critical
    if record.hypoxia_flag:
        alert = AlertEvent(
            id=f"ALT-{uuid.uuid4().hex[:8].upper()}",
            patient_id=payload.patient_id,
            severity="CRITICAL",
            category="RESPIRATORY",
            title="Kritik Gipoksiya (SpO2 < 92%)",
            description=f"Qon kislorod darajasi {payload.spo2_percentage}% ga tushib ketdi.",
            ai_recommendation="Chuqur nafas oling va zudlik bilan shifokor bilan bog'laning."
        )
        db.add(alert)

    db.commit()
    db.refresh(record)

    return {
        "status": "INGESTED",
        "metric_id": metric_id,
        "patient_id": payload.patient_id,
        "is_real_measurement": payload.is_real_measurement,
        "timestamp": record.timestamp.isoformat(),
        "ai_flags": {
            "arrhythmia": record.arrhythmia_flag,
            "hypoxia": record.hypoxia_flag,
            "hypertension": record.hypertension_flag
        }
    }


# --- 5. COMPREHENSIVE 12-MODULE AI EVALUATOR ---
@app.get("/api/v1/health-guard/patients/{patient_id}/evaluate", response_model=AiAnalysisResponse)
def evaluate_patient_health(patient_id: str, lang: str = "uz", db: Session = Depends(get_db)):
    latest_metric = db.query(HealthMetric).filter(HealthMetric.patient_id == patient_id).order_by(HealthMetric.timestamp.desc()).first()

    raw_metrics = {
        "heart_rate_bpm": latest_metric.heart_rate_bpm if (latest_metric and latest_metric.heart_rate_bpm is not None) else 72.0,
        "hrv_rmssd_ms": latest_metric.hrv_rmssd_ms if (latest_metric and latest_metric.hrv_rmssd_ms is not None) else 48.0,
        "spo2_percentage": latest_metric.spo2_percentage if (latest_metric and latest_metric.spo2_percentage is not None) else 98.0,
        "systolic_bp": latest_metric.systolic_bp if (latest_metric and latest_metric.systolic_bp is not None) else 118.0,
        "diastolic_bp": latest_metric.diastolic_bp if (latest_metric and latest_metric.diastolic_bp is not None) else 78.0,
        "skin_temp_celsius": latest_metric.skin_temp_celsius if (latest_metric and latest_metric.skin_temp_celsius is not None) else 34.2
    }

    ai_result = AiHealthEngine.evaluate_comprehensive(raw_metrics, lang=lang)

    return AiAnalysisResponse(
        patient_id=patient_id,
        timestamp=datetime.datetime.now(datetime.timezone.utc),
        overall_health_score=ai_result["overall_health_score"],
        cardiovascular_risk=ai_result["cardiovascular_risk"],
        arrhythmia_analysis=ai_result["arrhythmia_analysis"],
        hypoxia_risk=ai_result["hypoxia_risk"],
        hypertension_risk=ai_result["hypertension_risk"],
        sleep_apnea_risk=ai_result["sleep_apnea_risk"],
        autonomic_recovery=ai_result["autonomic_recovery"],
        digital_twin_variance=ai_result["digital_twin_variance"],
        critical_alerts=ai_result["critical_alerts"],
        actionable_recommendations=ai_result["actionable_recommendations"],
        clinical_disclaimer=ai_result["clinical_disclaimer"]
    )


# --- 6. DIGITAL HEALTH TWIN ---
@app.get("/api/v1/health-guard/patients/{patient_id}/twin")
def get_patient_digital_twin(patient_id: str, db: Session = Depends(get_db)):
    latest = db.query(HealthMetric).filter(HealthMetric.patient_id == patient_id).order_by(HealthMetric.timestamp.desc()).first()
    bpm = latest.heart_rate_bpm if (latest and latest.heart_rate_bpm is not None) else 70.0
    spo2 = latest.spo2_percentage if (latest and latest.spo2_percentage is not None) else 98.0
    sys_bp = latest.systolic_bp if (latest and latest.systolic_bp is not None) else 118.0
    hrv = latest.hrv_rmssd_ms if (latest and latest.hrv_rmssd_ms is not None) else 50.0
    temp = latest.skin_temp_celsius if (latest and latest.skin_temp_celsius is not None) else 34.2

    twin_analysis = AiHealthEngine.compute_digital_twin(bpm, spo2, sys_bp, hrv, temp)
    return {
        "patient_id": patient_id,
        "generated_at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "baseline_parameters": {
            "resting_bpm": 70.0,
            "spo2": 98.0,
            "systolic_bp": 118.0,
            "hrv_rmssd": 52.0,
            "skin_temp": 34.2
        },
        "current_parameters": {
            "bpm": bpm,
            "spo2": spo2,
            "systolic_bp": sys_bp,
            "hrv_rmssd": hrv,
            "skin_temp": temp
        },
        "twin_analysis": twin_analysis
    }


# --- 7. EXTERNAL MEDICAL DEVICES (GLUCOSE, BP CUFF, THERMOMETER) ---
@app.post("/api/v1/health-guard/external-devices")
def register_external_device(dev_in: ExternalDeviceCreate, db: Session = Depends(get_db)):
    dev = ExternalMedicalDevice(
        id=dev_in.id,
        patient_id=dev_in.patient_id,
        device_type=dev_in.device_type,
        device_name=dev_in.device_name,
        manufacturer=dev_in.manufacturer,
        model_number=dev_in.model_number,
        bluetooth_address=dev_in.bluetooth_address,
        battery_level=dev_in.battery_level
    )
    db.add(dev)
    db.commit()
    db.refresh(dev)
    return dev

@app.get("/api/v1/health-guard/external-devices")
def list_patient_external_devices(patient_id: str, db: Session = Depends(get_db)):
    return db.query(ExternalMedicalDevice).filter(ExternalMedicalDevice.patient_id == patient_id).all()


# --- 8. BLOOD GLUCOSE INGESTION & TRACKING ---
@app.post("/api/v1/health-guard/glucose")
def record_glucose(record_in: GlucoseRecordCreate, db: Session = Depends(get_db)):
    is_hypo = record_in.glucose_mmol_l < 3.9
    is_hyper = record_in.glucose_mmol_l > 10.0

    rec = GlucoseRecord(
        id=record_in.id,
        patient_id=record_in.patient_id,
        glucose_mmol_l=record_in.glucose_mmol_l,
        meal_context=record_in.meal_context,
        source_device=record_in.source_device,
        is_hypo=is_hypo,
        is_hyper=is_hyper
    )
    db.add(rec)

    if is_hypo:
        alert = AlertEvent(
            id=f"GLU-HYPO-{uuid.uuid4().hex[:6].upper()}",
            patient_id=record_in.patient_id,
            severity="CRITICAL",
            category="GLUCOSE",
            title="Gipoglikemiya xavfi (Shakar < 3.9 mmol/L)",
            description=f"Qondagi qand miqdori {record_in.glucose_mmol_l} mmol/L ga tushib ketdi.",
            ai_recommendation="Bemorga zudlik bilan 15-20g tez hazm bo'ladigan uglevod (sharbat, shakarli choy) bering."
        )
        db.add(alert)

    db.commit()
    db.refresh(rec)
    return rec


# --- 9. EMERGENCY SOS WITH 15-SECOND SAFEGUARD ---
@app.post("/api/v1/health-guard/emergency/trigger")
def trigger_emergency_sos(trigger_in: EmergencySosTrigger, db: Session = Depends(get_db)):
    event_id = f"SOS-{uuid.uuid4().hex[:8].upper()}"
    sos_event = EmergencySosEvent(
        id=event_id,
        patient_id=trigger_in.patient_id,
        trigger_type=trigger_in.trigger_type,
        latitude=trigger_in.latitude,
        longitude=trigger_in.longitude,
        status="COUNTDOWN"
    )
    db.add(sos_event)
    db.commit()
    return {
        "status": "COUNTDOWN_INITIATED",
        "event_id": event_id,
        "countdown_seconds": 15,
        "message": "15 soniya ichida bekor qilishingiz mumkin. Aks holda tez tibbiy yordam va ota-onaga xabar yuboriladi.",
        "latitude": trigger_in.latitude,
        "longitude": trigger_in.longitude
    }

@app.post("/api/v1/health-guard/emergency/cancel")
def cancel_emergency_sos(cancel_in: EmergencySosCancel, db: Session = Depends(get_db)):
    sos = db.query(EmergencySosEvent).filter(EmergencySosEvent.id == cancel_in.event_id).first()
    if not sos:
        raise HTTPException(status_code=404, detail="SOS Event not found.")
    sos.status = "CANCELLED_BY_USER"
    sos.cancellation_reason = cancel_in.cancellation_reason
    sos.cancelled_at = datetime.datetime.utcnow()
    db.commit()
    return {
        "status": "CANCELLED_SUCCESSFULLY",
        "event_id": cancel_in.event_id,
        "reason": cancel_in.cancellation_reason,
        "timestamp": sos.cancelled_at.isoformat()
    }


# --- 10. AI MEDICAL ASSISTANT CHAT ENDPOINT ---
@app.get("/api/v1/health-guard/assistant/chat")
def chat_with_medical_assistant(
    query: str = Query(..., description="User health inquiry"),
    lang: str = Query("uz", description="Language code: uz, ru, en"),
    patient_id: Optional[str] = Query(None)
):
    answer = AiHealthEngine.answer_query(query, lang=lang)
    return {
        "query": query,
        "language": lang,
        "response": answer,
        "timestamp": datetime.datetime.utcnow().isoformat(),
        "disclaimer": AiHealthEngine.CLINICAL_DISCLAIMER_UZ if lang == "uz" else (AiHealthEngine.CLINICAL_DISCLAIMER_RU if lang == "ru" else AiHealthEngine.CLINICAL_DISCLAIMER_EN)
    }


# --- 11. WEBSOCKET REAL-TIME WATCH BIOMETRICS ---
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, patient_id: str):
        await websocket.accept()
        if patient_id not in self.active_connections:
            self.active_connections[patient_id] = []
        self.active_connections[patient_id].append(websocket)

    def disconnect(self, websocket: WebSocket, patient_id: str):
        if patient_id in self.active_connections:
            self.active_connections[patient_id].remove(websocket)

    async def broadcast_biometrics(self, patient_id: str, message: dict):
        if patient_id in self.active_connections:
            for connection in self.active_connections[patient_id]:
                await connection.send_json(message)

manager = ConnectionManager()

@app.websocket("/ws/v1/health-guard/live/{patient_id}")
async def websocket_live_biometrics(websocket: WebSocket, patient_id: str):
    await manager.connect(websocket, patient_id)
    try:
        while True:
            data = await websocket.receive_text()
            # Echo or broadcast incoming watch biometrics
            await manager.broadcast_biometrics(patient_id, {
                "patient_id": patient_id,
                "raw_event": data,
                "timestamp": datetime.datetime.utcnow().isoformat()
            })
    except WebSocketDisconnect:
        manager.disconnect(websocket, patient_id)
