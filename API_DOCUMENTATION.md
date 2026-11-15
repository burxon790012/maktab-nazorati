# API DOCUMENTATION: AI HEALTH GUARD REST & WEBSOCKET APIs
**Version:** 2.0.0 Enterprise  
**Base URL:** `http://localhost:8000/api/v1/health-guard` (or production Render endpoint)  
**Authentication:** Header `X-Clinic-ID` (Tenant Identification) & Bearer JWT token  

---

## 1. System Health & Diagnostic

### `GET /status`
Returns real-time status of the Samsung Galaxy Watch 5 Pro sensor pipeline and multitenancy engine.
- **Response `200 OK`**:
```json
{
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
  "timestamp": "2026-11-15T15:45:00Z"
}
```

---

## 2. Biometric Ingestion & Watch Telemetry

### `POST /telemetry`
Ingests real biometric readings measured by the Samsung Galaxy Watch 5 Pro Wear OS companion.
- **Request Body**:
```json
{
  "patient_id": "PATIENT-10003",
  "device_model": "Samsung Galaxy Watch 5 Pro",
  "source": "GALAXY_WATCH_5_PRO_PPG",
  "is_real_measurement": true,
  "heart_rate_bpm": 74.0,
  "hrv_rmssd_ms": 52.0,
  "spo2_percentage": 98.5,
  "systolic_bp": 118.0,
  "diastolic_bp": 78.0,
  "skin_temp_celsius": 34.3,
  "stress_level": 22,
  "fatigue_index": 18,
  "sleep_score": 88,
  "steps_count": 6420
}
```
- **Response `200 OK`**:
```json
{
  "status": "INGESTED",
  "metric_id": "MTR-8A91F2C0",
  "patient_id": "PATIENT-10003",
  "is_real_measurement": true,
  "timestamp": "2026-11-15T15:46:12Z",
  "ai_flags": {
    "arrhythmia": false,
    "hypoxia": false,
    "hypertension": false
  }
}
```

---

## 3. 12-Module AI Evaluation Engine

### `GET /patients/{patient_id}/evaluate?lang=uz|ru|en`
Executes comprehensive algorithmic evaluation across all 12 AI modules.
- **Parameters**: `lang` (optional, default `"uz"`).
- **Response `200 OK`**:
```json
{
  "patient_id": "PATIENT-10003",
  "timestamp": "2026-11-15T15:47:00Z",
  "overall_health_score": 94,
  "cardiovascular_risk": {
    "current_bpm": 74.0,
    "resting_baseline": 68.0,
    "rhythm_classification": "NORMAL_SINUS",
    "hrv_rmssd_ms": 52.0,
    "hrv_status": "OPTIMAL",
    "risk_level": "LOW",
    "arrhythmia_probability": 0.04
  },
  "hypoxia_risk": {
    "spo2_percentage": 98.5,
    "status": "OPTIMAL",
    "risk_level": "LOW"
  },
  "hypertension_risk": {
    "systolic": 118.0,
    "diastolic": 78.0,
    "pulse_pressure": 40.0,
    "aha_category": "NORMAL",
    "risk_level": "LOW"
  },
  "sleep_apnea_risk": {
    "total_hours": 7.7,
    "sleep_quality_score": 88,
    "deep_sleep_pct": 22.0,
    "sleep_apnea_indicator": "LOW"
  },
  "autonomic_recovery": {
    "stress_score": 24,
    "recovery_score": 88.5,
    "stress_category": "RELAXED",
    "autonomic_balance": "PARASYMPATHETIC_DOMINANT"
  },
  "digital_twin_variance": {
    "digital_twin_stability_score": 94,
    "systemic_divergence_index": 0.32,
    "twin_status": "HOMEOSTASIS_STABLE"
  },
  "critical_alerts": [],
  "actionable_recommendations": [
    "Muntazam jismoniy mashqlarni va suv balansini saqlang.",
    "Tungi uyqu rejimiga rioya qiling."
  ],
  "clinical_disclaimer": "DIQQAT: Ushbu tahlil faqat axborot va monitoring uchun mo'ljallangan. Bu rasmiy tibbiy tashxis emas."
}
```

---

## 4. Digital Health Twin

### `GET /patients/{patient_id}/twin`
Calculates multidimensional physiological vector distance between current metrics and personal baseline.
- **Response `200 OK`**:
```json
{
  "patient_id": "PATIENT-10003",
  "generated_at": "2026-11-15T15:48:00Z",
  "baseline_parameters": {
    "resting_bpm": 70.0,
    "spo2": 98.0,
    "systolic_bp": 118.0,
    "hrv_rmssd": 52.0,
    "skin_temp": 34.2
  },
  "current_parameters": {
    "bpm": 74.0,
    "spo2": 98.5,
    "systolic_bp": 118.0,
    "hrv_rmssd": 52.0,
    "skin_temp": 34.3
  },
  "twin_analysis": {
    "digital_twin_stability_score": 94,
    "systemic_divergence_index": 0.32,
    "cardiovascular_twin_match": "ALIGNED",
    "respiratory_twin_match": "ALIGNED",
    "autonomic_twin_match": "ALIGNED",
    "twin_status": "HOMEOSTASIS_STABLE"
  }
}
```

---

## 5. Emergency SOS System

### `POST /emergency/trigger`
Initiates emergency protocol with a 15-second cancellation safeguard.
- **Request Body**:
```json
{
  "patient_id": "PATIENT-10003",
  "trigger_type": "MANUAL_WATCH_HOLD",
  "latitude": 41.5695,
  "longitude": 60.6327
}
```
- **Response `200 OK`**:
```json
{
  "status": "COUNTDOWN_INITIATED",
  "event_id": "SOS-A1B2C3D4",
  "countdown_seconds": 15,
  "message": "15 soniya ichida bekor qilishingiz mumkin. Aks holda tez tibbiy yordam va ota-onaga xabar yuboriladi.",
  "latitude": 41.5695,
  "longitude": 60.6327
}
```

### `POST /emergency/cancel`
Cancels countdown within 15 seconds to avoid false alarms.
- **Request Body**:
```json
{
  "event_id": "SOS-A1B2C3D4",
  "cancellation_reason": "Accidental long-press cancelled by student"
}
```
- **Response `200 OK`**:
```json
{
  "status": "CANCELLED_SUCCESSFULLY",
  "event_id": "SOS-A1B2C3D4",
  "reason": "Accidental long-press cancelled by student",
  "timestamp": "2026-11-15T15:49:10Z"
}
```

---

## 6. Real-Time Telemetry WebSocket

### `WS /ws/v1/health-guard/live/{patient_id}`
Bidirectional WebSocket streaming live 60Hz ECG raw signals and second-by-second PPG pulse rates to clinician monitors and mobile apps.
