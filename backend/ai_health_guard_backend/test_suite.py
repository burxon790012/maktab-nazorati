"""
AI HEALTH GUARD — Comprehensive Automated Test Suite
Verifies multi-tenancy, sensor telemetry ingestion, 12 AI modules,
emergency SOS countdown safeguard, and trilingual AI assistant.
"""

import sys
import unittest
from fastapi.testclient import TestClient
from .main import app, Base, engine

client = TestClient(app)

class TestAiHealthGuard(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        Base.metadata.create_all(bind=engine)

    def test_01_system_status(self):
        resp = client.get("/api/v1/health-guard/status")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertEqual(data["status"], "OPERATIONAL")
        self.assertIn("Samsung Galaxy Watch 5 Pro", data["supported_watch"])
        self.assertEqual(data["sensor_pipeline"]["ppg_heart_rate"], "ACTIVE")

    def test_02_tenant_isolation(self):
        # Create Clinic A
        clinic_a = {"id": "CLINIC-A", "name": "Cardio Center A", "license_number": "LIC-AAA-01"}
        resp_a = client.post("/api/v1/health-guard/clinics", json=clinic_a)
        self.assertIn(resp_a.status_code, [200, 400])

        # Create Clinic B
        clinic_b = {"id": "CLINIC-B", "name": "Pediatric Clinic B", "license_number": "LIC-BBB-02"}
        resp_b = client.post("/api/v1/health-guard/clinics", json=clinic_b)
        self.assertIn(resp_b.status_code, [200, 400])

        # Add doctor to Clinic A
        doc_a = {
            "id": "DOC-A1",
            "clinic_id": "CLINIC-A",
            "full_name": "Dr. Rustam Karimov",
            "license_id": "UZ-MD-901",
            "email": "rustam@clinica.uz"
        }
        client.post("/api/v1/health-guard/doctors", json=doc_a, headers={"X-Clinic-ID": "CLINIC-A"})

        # Doctor list for Clinic A should contain DOC-A1
        res_list_a = client.get("/api/v1/health-guard/doctors", headers={"X-Clinic-ID": "CLINIC-A"})
        self.assertEqual(res_list_a.status_code, 200)
        docs_a = [d["id"] for d in res_list_a.json()]
        self.assertIn("DOC-A1", docs_a)

        # Doctor list for Clinic B MUST NOT contain DOC-A1 (Strict isolation)
        res_list_b = client.get("/api/v1/health-guard/doctors", headers={"X-Clinic-ID": "CLINIC-B"})
        self.assertEqual(res_list_b.status_code, 200)
        docs_b = [d["id"] for d in res_list_b.json()]
        self.assertNotIn("DOC-A1", docs_b)

    def test_03_telemetry_ingestion_and_ai_flags(self):
        # Ingest normal biometrics
        telemetry_normal = {
            "patient_id": "PATIENT-101",
            "device_model": "Samsung Galaxy Watch 5 Pro",
            "source": "GALAXY_WATCH_5_PRO_PPG",
            "is_real_measurement": True,
            "heart_rate_bpm": 74.0,
            "hrv_rmssd_ms": 52.0,
            "spo2_percentage": 98.5,
            "systolic_bp": 118.0,
            "diastolic_bp": 78.0,
            "skin_temp_celsius": 34.3,
            "stress_level": 20
        }
        resp = client.post("/api/v1/health-guard/telemetry", json=telemetry_normal)
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertEqual(data["status"], "INGESTED")
        self.assertFalse(data["ai_flags"]["arrhythmia"])
        self.assertFalse(data["ai_flags"]["hypoxia"])

        # Ingest critical hypoxia telemetry
        telemetry_hypoxia = {
            "patient_id": "PATIENT-101",
            "is_real_measurement": True,
            "heart_rate_bpm": 112.0,
            "spo2_percentage": 88.0 # Critical (<92%)
        }
        resp_crit = client.post("/api/v1/health-guard/telemetry", json=telemetry_hypoxia)
        self.assertEqual(resp_crit.status_code, 200)
        self.assertTrue(resp_crit.json()["ai_flags"]["hypoxia"])

    def test_04_ai_evaluation_12_modules(self):
        resp = client.get("/api/v1/health-guard/patients/PATIENT-101/evaluate?lang=uz")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertIn("overall_health_score", data)
        self.assertIn("cardiovascular_risk", data)
        self.assertIn("digital_twin_variance", data)
        self.assertIn("autonomic_recovery", data)
        self.assertIn("clinical_disclaimer", data)
        self.assertIn("DIQQAT", data["clinical_disclaimer"])

    def test_05_digital_health_twin(self):
        resp = client.get("/api/v1/health-guard/patients/PATIENT-101/twin")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertIn("baseline_parameters", data)
        self.assertIn("twin_analysis", data)
        self.assertIn("digital_twin_stability_score", data["twin_analysis"])

    def test_06_emergency_sos_countdown_and_cancellation(self):
        # Trigger SOS
        trigger = {
            "patient_id": "PATIENT-101",
            "trigger_type": "MANUAL_WATCH_HOLD",
            "latitude": 41.5695,
            "longitude": 60.6327
        }
        resp_trig = client.post("/api/v1/health-guard/emergency/trigger", json=trigger)
        self.assertEqual(resp_trig.status_code, 200)
        event_id = resp_trig.json()["event_id"]
        self.assertEqual(resp_trig.json()["countdown_seconds"], 15)

        # Cancel SOS
        cancel = {
            "event_id": event_id,
            "cancellation_reason": "Test accidental tap cancelled within safeguard window"
        }
        resp_canc = client.post("/api/v1/health-guard/emergency/cancel", json=cancel)
        self.assertEqual(resp_canc.status_code, 200)
        self.assertEqual(resp_canc.json()["status"], "CANCELLED_SUCCESSFULLY")

    def test_07_trilingual_ai_assistant(self):
        # Uzbek
        r_uz = client.get("/api/v1/health-guard/assistant/chat?query=yurak+urishi&lang=uz")
        self.assertEqual(r_uz.status_code, 200)
        self.assertIn("BPM", r_uz.json()["response"])

        # Russian
        r_ru = client.get("/api/v1/health-guard/assistant/chat?query=пульс&lang=ru")
        self.assertEqual(r_ru.status_code, 200)
        self.assertIn("уд/мин", r_ru.json()["response"])

        # English
        r_en = client.get("/api/v1/health-guard/assistant/chat?query=oxygen&lang=en")
        self.assertEqual(r_en.status_code, 200)
        self.assertIn("SpO2", r_en.json()["response"])

if __name__ == "__main__":
    unittest.main()
