#!/usr/bin/env python3
"""
====================================================================
SMART CHILD: Multi-School Child Safety, GPS Tracking, Health Monitoring
& Smart Attendance Platform (Python Standard Library Backend Engine)
====================================================================
Runs with standard Python 3: python server.py
Serves the web dashboard on http://localhost:3000
"""

import http.server
import json
import math
import os
import sys
import time
import urllib.parse
from datetime import datetime

PORT = 3000
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PUBLIC_DIR = os.path.join(BASE_DIR, 'public')
DATA_DIR = os.path.join(BASE_DIR, 'data')
os.makedirs(DATA_DIR, exist_ok=True)
DB_FILE = os.path.join(DATA_DIR, 'smart_child_multischool_db.json')

default_state = {
    "schools": [
        {
            "id": "SCH001",
            "geofenceId": "GEO001",
            "name": "1-Sonli Namunaviy Maktab",
            "name_ru": "Образцовая школа №1",
            "name_en": "Model School #1",
            "code": "SCH001",
            "address": "Toshkent sh., Chilonzor tumani, 1-mavze",
            "lat": 41.311081,
            "lng": 69.240562,
            "startTime": "08:30",
            "endTime": "13:30",
            "color": "#10b981",
            "polygon": [
                [41.312400, 69.238800],
                [41.312400, 69.242300],
                [41.309700, 69.242300],
                [41.309700, 69.238800]
            ],
            "adminEmail": "admin.sch1@smartchild.uz",
            "totalStudents": 3
        },
        {
            "id": "SCH002",
            "geofenceId": "GEO002",
            "name": "21-Sonli Ixtisoslashtirilgan Maktab",
            "name_ru": "Специализированная школа №21",
            "name_en": "Specialized School #21",
            "code": "SCH002",
            "address": "Toshkent sh., Yunusobod tumani, 5-mavze",
            "lat": 41.348500,
            "lng": 69.288200,
            "startTime": "08:30",
            "endTime": "13:30",
            "color": "#3b82f6",
            "polygon": [
                [41.350100, 69.286500],
                [41.350100, 69.290200],
                [41.347200, 69.290200],
                [41.347200, 69.286500]
            ],
            "adminEmail": "admin.sch21@smartchild.uz",
            "totalStudents": 1
        },
        {
            "id": "SCH003",
            "geofenceId": "GEO003",
            "name": "Al-Xorazmiy Nomidagi IT Maktabi",
            "name_ru": "IT Школа имени Аль-Хорезми",
            "name_en": "Al-Khwarizmi IT School",
            "code": "SCH003",
            "address": "Toshkent sh., Mirzo Ulug'bek tumani",
            "lat": 41.332500,
            "lng": 69.324100,
            "startTime": "08:00",
            "endTime": "14:00",
            "color": "#8b5cf6",
            "polygon": [
                [41.334000, 69.322000],
                [41.334000, 69.326500],
                [41.331000, 69.326500],
                [41.331000, 69.322000]
            ],
            "adminEmail": "admin.it@smartchild.uz",
            "totalStudents": 0
        }
    ],
    "students": [
        {
            "id": "10001",
            "studentId": "10001",
            "uniqueId": "10001",
            "name": "Ali Valiyev",
            "schoolId": "SCH001",
            "schoolName": "1-Sonli Namunaviy Maktab",
            "classId": "cls-5b",
            "className": "5-B",
            "parentId": "usr-parent-1",
            "parentName": "Jasur Bekmirzayev",
            "parentPhone": "+998903456789",
            "deviceId": "watch-5pro-01",
            "deviceModel": "Samsung Galaxy Watch5 Pro",
            "photo": "https://images.unsplash.com/photo-1544717305-2782549b5136?w=150&auto=format&fit=crop&q=80",
            "status": "ACTIVE"
        },
        {
            "id": "10002",
            "studentId": "10002",
            "uniqueId": "10002",
            "name": "Vali Karimov",
            "schoolId": "SCH001",
            "schoolName": "1-Sonli Namunaviy Maktab",
            "classId": "cls-5b",
            "className": "5-B",
            "parentId": "usr-parent-1",
            "parentName": "Zilola Alimova",
            "parentPhone": "+998911112233",
            "deviceId": "watch-5pro-02",
            "deviceModel": "Samsung Galaxy Watch5 Pro",
            "photo": "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80",
            "status": "ACTIVE"
        },
        {
            "id": "10003",
            "studentId": "10003",
            "uniqueId": "10003",
            "name": "Hasan Aliyev",
            "schoolId": "SCH001",
            "schoolName": "1-Sonli Namunaviy Maktab",
            "classId": "cls-9a",
            "className": "9-A",
            "parentId": "usr-parent-1",
            "parentName": "Farrux Toshpulatov",
            "parentPhone": "+998933334455",
            "deviceId": "watch-5pro-03",
            "deviceModel": "Samsung Galaxy Watch5 Pro",
            "photo": "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80",
            "status": "ACTIVE"
        },
        {
            "id": "20001",
            "studentId": "20001",
            "uniqueId": "20001",
            "name": "Rustam Yusupov",
            "schoolId": "SCH002",
            "schoolName": "21-Sonli Ixtisoslashtirilgan Maktab",
            "classId": "cls-7a",
            "className": "7-A",
            "parentId": "usr-parent-1",
            "parentName": "Nodir Yusupov",
            "parentPhone": "+998977778899",
            "deviceId": "watch-5pro-04",
            "deviceModel": "Samsung Galaxy Watch5 Pro",
            "photo": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
            "status": "ACTIVE"
        }
    ],
    "attendance": [
        {
            "id": "att-10001",
            "studentId": "10001",
            "schoolId": "SCH001",
            "date": datetime.now().strftime("%Y-%m-%d"),
            "arrivalTime": "08:18:24",
            "departureTime": None,
            "status": "PRESENT",
            "statusDisplay": "PRESENT – INSIDE SCHOOL",
            "statusColor": "GREEN",
            "isManualCorrection": False
        }
    ],
    "telemetryState": {
        "watch-5pro-01": {
            "deviceId": "watch-5pro-01",
            "studentId": "10001",
            "latitude": 41.311120,
            "longitude": 69.240610,
            "accuracy": 3.2,
            "speed": 0.0,
            "heading": 45,
            "altitude": 432.5,
            "heartRate": 78,
            "bodyTemperature": 36.6,
            "stepCount": 3410,
            "batteryLevel": 89,
            "isCharging": False,
            "isSos": False,
            "geofenceStatus": "INSIDE",
            "assignedSchoolId": "SCH001",
            "statusColor": "GREEN",
            "statusDisplay": "PRESENT – INSIDE SCHOOL",
            "lastSeen": int(time.time() * 1000)
        }
    },
    "notifications": [],
    "auditLogs": [
        {
            "id": "log-1",
            "timestamp": datetime.now().isoformat(),
            "user": "Sardor Alimov (Super Admin)",
            "role": "SUPER_ADMIN",
            "action": "PLATFORM_INITIALIZED",
            "target": "SYSTEM",
            "details": "SMART CHILD multi-school Python engine started."
        }
    ]
}

db = json.loads(json.dumps(default_state))
if os.path.exists(DB_FILE):
    try:
        with open(DB_FILE, 'r', encoding='utf-8') as f:
            db = json.load(f)
            if "auditLogs" not in db:
                db["auditLogs"] = default_state["auditLogs"]
    except Exception as e:
        print("Baza yuklashda xato:", e)

def save_db():
    try:
        with open(DB_FILE, 'w', encoding='utf-8') as f:
            json.dump(db, f, ensure_ascii=False, indent=2)
    except Exception as e:
        print("Baza saqlashda xato:", e)

def is_point_in_polygon(lat, lng, poly):
    if not poly or len(poly) < 3:
        return False
    inside = False
    j = len(poly) - 1
    for i in range(len(poly)):
        xi, yi = poly[i][0], poly[i][1]
        xj, yj = poly[j][0], poly[j][1]
        intersect = ((yi > lng) != (yj > lng)) and (lat < (xj - xi) * (lng - yi) / (yj - yi) + xi)
        if intersect:
            inside = not inside
        j = i
    return inside

def evaluate_strict_attendance(student, lat, lng, accuracy=3.5):
    if lat is None or lng is None:
        return {"status": "UNKNOWN", "schoolId": None, "color": "GRAY", "display": "UNKNOWN – GPS SIGNAL UNAVAILABLE"}
    
    assigned_school = next((s for s in db["schools"] if s["id"] == student.get("schoolId")), None)
    if not assigned_school or "polygon" not in assigned_school or len(assigned_school["polygon"]) < 3:
        return {"status": "UNKNOWN", "schoolId": None, "color": "GRAY", "display": "UNKNOWN – NO SCHOOL GEOFENCE DEFINED"}

    if accuracy and accuracy > 18.0:
        return {"status": "VERIFYING", "schoolId": assigned_school["id"], "color": "YELLOW", "display": f"GPS VERIFYING (±{round(accuracy)}m – Stabilizing)"}

    if is_point_in_polygon(lat, lng, assigned_school["polygon"]):
        return {"status": "INSIDE", "schoolId": assigned_school["id"], "schoolName": assigned_school["name"], "color": "GREEN", "display": "PRESENT – INSIDE SCHOOL"}

    other_school = next((s for s in db["schools"] if s["id"] != student.get("schoolId") and is_point_in_polygon(lat, lng, s.get("polygon", []))), None)
    if other_school:
        return {"status": "OUTSIDE", "schoolId": assigned_school["id"], "color": "RED", "display": f"OUTSIDE (Detected near {other_school['name']}, but assigned to {assigned_school['name']})", "isForeignSchool": True}

    return {"status": "OUTSIDE", "schoolId": assigned_school["id"], "color": "RED", "display": "LEFT SCHOOL – OUTSIDE SCHOOL"}

class SmartChildHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=PUBLIC_DIR, **kwargs)

    def _send_json(self, data, code=200):
        self.send_response(code)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.end_headers()
        self.wfile.write(json.dumps(data, ensure_ascii=False).encode('utf-8'))

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.end_headers()

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        query = urllib.parse.parse_qs(parsed.query)

        if path == '/api/v1/schools':
            schools = []
            for sch in db["schools"]:
                cnt = len([s for s in db["students"] if s.get("schoolId") == sch["id"]])
                s_copy = dict(sch)
                s_copy["totalStudents"] = cnt
                schools.append(s_copy)
            self._send_json({"success": True, "schools": schools})
            return

        elif path == '/api/v1/students':
            school_id = query.get('schoolId', ['ALL'])[0]
            students = db["students"]
            if school_id != 'ALL':
                students = [s for s in students if s.get("schoolId") == school_id]
            today = datetime.now().strftime("%Y-%m-%d")
            enriched = []
            for std in students:
                telem = db["telemetryState"].get(std["deviceId"], {})
                att = next((a for a in db["attendance"] if a["studentId"] == std["id"] and a["date"] == today), {
                    "status": "ABSENT",
                    "statusDisplay": "LEFT SCHOOL – OUTSIDE SCHOOL",
                    "statusColor": "RED"
                })
                s_dict = dict(std)
                s_dict["telemetry"] = telem
                s_dict["todayAttendance"] = att
                enriched.append(s_dict)
            self._send_json({"success": True, "students": enriched})
            return

        elif path.startswith('/api/v1/students/'):
            st_id = path.replace('/api/v1/students/', '')
            student = next((s for s in db["students"] if s["id"] == st_id or s.get("uniqueId") == st_id), None)
            if not student:
                self._send_json({"success": False, "message": "O'quvchi topilmadi"}, 404)
                return
            telem = db["telemetryState"].get(student["deviceId"], {})
            school = next((s for s in db["schools"] if s["id"] == student.get("schoolId")), {})
            today = datetime.now().strftime("%Y-%m-%d")
            att = next((a for a in db["attendance"] if a["studentId"] == student["id"] and a["date"] == today), None)
            self._send_json({"success": True, "student": student, "telemetry": telem, "assignedSchool": school, "todayAttendance": att})
            return

        elif path == '/api/v1/attendance/today':
            school_id = query.get('schoolId', ['ALL'])[0]
            today = datetime.now().strftime("%Y-%m-%d")
            st_list = db["students"]
            if school_id != 'ALL':
                st_list = [s for s in st_list if s.get("schoolId") == school_id]
            res_att = []
            for std in st_list:
                att = next((a for a in db["attendance"] if a["studentId"] == std["id"] and a["date"] == today), None)
                if not att:
                    att = {
                        "id": f"att-{std['id']}-{today}",
                        "studentId": std["id"],
                        "schoolId": std["schoolId"],
                        "date": today,
                        "arrivalTime": None,
                        "departureTime": None,
                        "status": "ABSENT",
                        "statusDisplay": "LEFT SCHOOL – OUTSIDE SCHOOL",
                        "statusColor": "RED",
                        "isManualCorrection": False
                    }
                a_copy = dict(att)
                a_copy["studentName"] = std["name"]
                a_copy["className"] = std["className"]
                a_copy["uniqueId"] = std["uniqueId"]
                a_copy["schoolName"] = std["schoolName"]
                res_att.append(a_copy)
            
            summary = {
                "total": len(res_att),
                "present": len([a for a in res_att if a.get("status") == "PRESENT" or a.get("statusColor") == "GREEN"]),
                "late": len([a for a in res_att if a.get("status") == "LATE"]),
                "absent": len([a for a in res_att if a.get("status") == "ABSENT" or a.get("statusColor") == "RED"]),
                "left": len([a for a in res_att if a.get("status") == "LEFT"])
            }
            self._send_json({"success": True, "date": today, "summary": summary, "attendance": res_att})
            return

        elif path == '/api/v1/reports':
            school_id = query.get('schoolId', ['ALL'])[0]
            period = query.get('period', ['daily'])[0]
            st_list = db["students"]
            if school_id != 'ALL':
                st_list = [s for s in st_list if s.get("schoolId") == school_id]
            total = len(st_list)
            today = datetime.now().strftime("%Y-%m-%d")
            today_att = [a for a in db["attendance"] if a.get("date") == today and (school_id == 'ALL' or a.get("schoolId") == school_id)]
            pres = len([a for a in today_att if a.get("status") == "PRESENT" or a.get("statusColor") == "GREEN"])
            late = len([a for a in today_att if a.get("status") == "LATE"])
            absent = max(0, total - (pres + late))
            rate = round(((pres + late) / total) * 100) if total > 0 else 100
            self._send_json({
                "success": True,
                "schoolId": school_id,
                "period": period,
                "summary": {
                    "totalStudents": total,
                    "presentCount": pres,
                    "lateCount": late,
                    "absentCount": absent,
                    "attendanceRate": f"{rate}%"
                }
            })
            return

        elif path == '/api/v1/classes':
            school_id = query.get('schoolId', ['ALL'])[0]
            classes = db.get("classes", [
                {"id": "cls-5b", "schoolId": "SCH001", "name": "5-B", "grade": 5, "teacherName": "Dilnoza Karimova"},
                {"id": "cls-9a", "schoolId": "SCH001", "name": "9-A", "grade": 9, "teacherName": "Aziz Mahmudov"},
                {"id": "cls-7a", "schoolId": "SCH002", "name": "7-A", "grade": 7, "teacherName": "Shahnoza Yusupova"}
            ])
            if school_id != 'ALL':
                classes = [c for c in classes if c.get("schoolId") == school_id]
            self._send_json({"success": True, "classes": classes})
            return

        elif path == '/api/v1/users':
            self._send_json({"success": True, "users": db.get("users", [])})
            return

        elif '/route-history' in path:
            st_id = path.split('/')[4]
            history = db.get("routeHistory", {}).get(st_id, [
                {"lat": 41.3060, "lng": 69.2360, "time": "07:55:00", "speed": 1.1, "status": "OUTSIDE", "color": "RED"},
                {"lat": 41.3075, "lng": 69.2372, "time": "08:02:15", "speed": 1.3, "status": "OUTSIDE", "color": "RED"},
                {"lat": 41.3090, "lng": 69.2385, "time": "08:10:30", "speed": 1.2, "status": "OUTSIDE", "color": "RED"},
                {"lat": 41.3102, "lng": 69.2398, "time": "08:15:10", "speed": 0.9, "status": "OUTSIDE", "color": "RED"},
                {"lat": 41.3111, "lng": 69.2406, "time": "08:18:24", "speed": 0.2, "status": "INSIDE", "color": "GREEN"}
            ])
            self._send_json({"success": True, "studentId": st_id, "points": history})
            return

        elif path.startswith('/api/v1/health-measurements/'):
            st_id = path.replace('/api/v1/health-measurements/', '')
            student = next((s for s in db["students"] if s["id"] == st_id or s.get("uniqueId") == st_id), db["students"][0])
            telem = db["telemetryState"].get(student.get("deviceId"), {})
            self._send_json({
                "success": True,
                "studentId": student["id"],
                "studentName": student["name"],
                "deviceId": student.get("deviceId"),
                "measurements": {
                    "currentHeartRate": telem.get("heartRate", 78),
                    "bodyTemperature": telem.get("bodyTemperature", 36.6),
                    "batteryLevel": telem.get("batteryLevel", 88),
                    "stepCount": telem.get("stepCount", 3400)
                },
                "thresholds": {"normalHeartRateRange": "60 - 100 BPM", "normalTemperatureRange": "36.1 - 37.2 °C"},
                "medicalDisclaimer": "Smartwatch readings are for child safety and wellness monitoring only and are not a medical diagnosis."
            })
            return

        elif path == '/api/v1/attendance/export/csv':
            school_id = query.get('schoolId', ['ALL'])[0]
            today = datetime.now().strftime("%Y-%m-%d")
            st_list = db["students"]
            if school_id != 'ALL':
                st_list = [s for s in st_list if s.get("schoolId") == school_id]
            csv_lines = ["Student ID,F.I.O,Maktab ID,Maktab Nomi,Sinf,Kelgan Vaqti,Ketgan Vaqti,Davomat Holati\n"]
            for s in st_list:
                att = next((a for a in db["attendance"] if a["studentId"] == s["id"] and a["date"] == today), {})
                csv_lines.append(f'"{s["uniqueId"]}","{s["name"]}","{s["schoolId"]}","{s.get("schoolName","")}","{s["className"]}","{att.get("arrivalTime","-")}","{att.get("departureTime","-")}","{att.get("statusDisplay","OUTSIDE")}"\n')
            csv_data = "".join(csv_lines).encode('utf-8')
            self.send_response(200)
            self.send_header('Content-Type', 'text/csv; charset=utf-8')
            self.send_header('Content-Disposition', f'attachment; filename="SmartChild_Davomat_{today}.csv"')
            self.end_headers()
            self.wfile.write(csv_data)
            return

        elif path == '/api/v1/audit-logs':
            self._send_json({"success": True, "auditLogs": db.get("auditLogs", [])})
            return

        elif path == '/api/v1/notifications':
            self._send_json({"success": True, "notifications": db.get("notifications", [])})
            return

        # Default fallback to static files (public/)
        super().do_GET()

    def do_POST(self):
        content_length = int(self.headers.get('Content-Length', 0))
        body = self.rfile.read(content_length).decode('utf-8')
        data = json.loads(body) if body else {}

        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path

        if path == '/api/v1/schools':
            name = data.get('name')
            if not name:
                self._send_json({"success": False, "message": "Maktab nomi shart"}, 400)
                return
            count = len(db["schools"]) + 1
            code = data.get('code', f"SCH{str(count).zfill(3)}").upper()
            new_sch = {
                "id": code,
                "geofenceId": f"GEO{str(count).zfill(3)}",
                "name": name,
                "code": code,
                "address": data.get("address", "Toshkent sh."),
                "lat": float(data.get("lat", 41.311081)),
                "lng": float(data.get("lng", 69.240562)),
                "startTime": data.get("startTime", "08:30"),
                "endTime": data.get("endTime", "13:30"),
                "color": "#10b981",
                "polygon": data.get("polygon", [
                    [41.3125, 69.239], [41.3125, 69.242], [41.3095, 69.242], [41.3095, 69.239]
                ]),
                "totalStudents": 0
            }
            db["schools"].append(new_sch)
            save_db()
            self._send_json({"success": True, "message": "Yangi maktab ro'yxatdan o'tdi", "school": new_sch})
            return

        elif path.startswith('/api/v1/schools/') and path.endswith('/geofence'):
            sch_id = path.split('/')[4]
            school = next((s for s in db["schools"] if s["id"] == sch_id or s.get("code") == sch_id), None)
            if not school:
                self._send_json({"success": False, "message": "Maktab topilmadi"}, 404)
                return
            polygon = data.get("polygon", [])
            if len(polygon) < 3:
                self._send_json({"success": False, "message": "Kamida 3 ta GPS nuqta kerak"}, 400)
                return
            school["polygon"] = polygon
            school["lat"] = sum(p[0] for p in polygon) / len(polygon)
            school["lng"] = sum(p[1] for p in polygon) / len(polygon)
            db["auditLogs"].insert(0, {
                "id": f"log-{int(time.time()*1000)}",
                "timestamp": datetime.now().isoformat(),
                "user": "Maktab Administratori",
                "role": "SCHOOL_ADMIN",
                "action": "GEOFENCE_UPDATED",
                "target": school["id"],
                "details": f"{school['name']} ({school['id']}) chegarasi {len(polygon)} ta nuqta bilan saqlandi."
            })
            save_db()
            self._send_json({"success": True, "message": f"Chegara ({school.get('geofenceId')}) saqlandi!", "school": school})
            return

        elif path == '/api/v1/students/bulk':
            sch_id = data.get("schoolId", "SCH001")
            target_school = next((s for s in db["schools"] if s["id"] == sch_id), db["schools"][0])
            st_list = data.get("students", [])
            added = []
            for idx, s in enumerate(st_list):
                s_id = s.get("studentId", f"10{len(db['students']) + 101 + idx}")
                new_std = {
                    "id": s_id,
                    "studentId": s_id,
                    "uniqueId": s_id,
                    "name": s.get("name", f"O'quvchi {s_id}"),
                    "schoolId": target_school["id"],
                    "schoolName": target_school["name"],
                    "className": s.get("className", "5-B"),
                    "parentName": "Ota-ona",
                    "parentPhone": s.get("parentPhone", "+998901112233"),
                    "deviceId": s.get("deviceId", f"watch-5pro-{s_id}"),
                    "deviceModel": "Samsung Galaxy Watch5 Pro",
                    "photo": "https://images.unsplash.com/photo-1544717305-2782549b5136?w=150&auto=format&fit=crop&q=80",
                    "status": "ACTIVE"
                }
                db["students"].append(new_std)
                added.append(new_std)
            save_db()
            self._send_json({"success": True, "message": f"{len(added)} nafar o'quvchi {target_school['name']} ga biriktirildi!", "students": added})
            return

        elif path == '/api/v1/telemetry':
            dev_id = data.get("device_id") or data.get("deviceId") or "watch-5pro-01"
            student = next((s for s in db["students"] if s.get("deviceId") == dev_id), db["students"][0])
            lat = float(data.get("latitude", 41.311081))
            lng = float(data.get("longitude", 69.240562))
            acc = float(data.get("accuracy", 3.5))

            eval_res = evaluate_strict_attendance(student, lat, lng, acc)
            st_data = {
                "deviceId": dev_id,
                "studentId": student["id"],
                "studentName": student["name"],
                "schoolId": student.get("schoolId"),
                "latitude": lat,
                "longitude": lng,
                "accuracy": acc,
                "heartRate": int(data.get("heart_rate", 78)),
                "bodyTemperature": float(data.get("body_temperature", 36.6)),
                "batteryLevel": int(data.get("battery_level", 88)),
                "geofenceStatus": eval_res["status"],
                "statusColor": eval_res["color"],
                "statusDisplay": eval_res["display"],
                "lastSeen": int(time.time() * 1000)
            }
            db["telemetryState"][dev_id] = st_data

            today = datetime.now().strftime("%Y-%m-%d")
            now_time = datetime.now().strftime("%H:%M:%S")
            att = next((a for a in db["attendance"] if a["studentId"] == student["id"] and a["date"] == today), None)
            if eval_res["status"] == "INSIDE":
                if not att:
                    att = {
                        "id": f"att-{student['id']}-{today}",
                        "studentId": student["id"],
                        "schoolId": student.get("schoolId"),
                        "date": today,
                        "arrivalTime": now_time,
                        "departureTime": None,
                        "status": "PRESENT",
                        "statusColor": "GREEN",
                        "statusDisplay": "PRESENT – INSIDE SCHOOL",
                        "isManualCorrection": False
                    }
                    db["attendance"].append(att)
                else:
                    att["arrivalTime"] = now_time
                    att["statusColor"] = "GREEN"
                    att["statusDisplay"] = "PRESENT – INSIDE SCHOOL"
            elif eval_res["status"] == "OUTSIDE":
                if att:
                    att["departureTime"] = now_time
                    att["statusColor"] = "RED"
                    att["statusDisplay"] = "LEFT SCHOOL – OUTSIDE SCHOOL"

            save_db()
            self._send_json({"success": True, "student_id": student["id"], "geofence_status": eval_res["status"], "status_display": eval_res["display"], "status_color": eval_res["color"]})
            return

        elif path == '/api/v1/auth/login':
            role = data.get("role", "SUPER_ADMIN")
            user = next((u for u in db.get("users", []) if u.get("role") == role), None)
            if not user:
                user = {"id": "usr-superadmin", "name": "Sardor Alimov", "role": role, "email": "superadmin@smartchild.uz"}
            self._send_json({"success": True, "user": user, "token": f"jwt-mock-{user['id']}"})
            return

        elif path == '/api/v1/users':
            name = data.get("name")
            role = data.get("role", "TEACHER").upper()
            new_u = {
                "id": f"usr-{int(time.time()*1000)}",
                "name": name,
                "role": role,
                "email": data.get("email", f"{role.lower()}@smartchild.uz"),
                "phone": data.get("phone", "+998900000000")
            }
            if "users" not in db: db["users"] = []
            db["users"].append(new_u)
            save_db()
            self._send_json({"success": True, "message": "Foydalanuvchi yaratildi", "user": new_u})
            return

        elif path == '/api/v1/students':
            u_id = data.get("studentId") or f"10{len(db['students']) + 101}"
            sch_id = data.get("schoolId", "SCH001")
            target_sch = next((s for s in db["schools"] if s["id"] == sch_id), db["schools"][0])
            new_std = {
                "id": u_id,
                "studentId": u_id,
                "uniqueId": u_id,
                "name": data.get("name", f"O'quvchi {u_id}"),
                "schoolId": target_sch["id"],
                "schoolName": target_sch["name"],
                "className": data.get("className", "5-B"),
                "parentPhone": data.get("parentPhone", "+998901112233"),
                "deviceId": data.get("deviceId", f"watch-5pro-{u_id}"),
                "deviceModel": "Samsung Galaxy Watch5 Pro",
                "photo": "https://images.unsplash.com/photo-1544717305-2782549b5136?w=150&auto=format&fit=crop&q=80",
                "status": "ACTIVE"
            }
            db["students"].append(new_std)
            save_db()
            self._send_json({"success": True, "message": "O'quvchi ro'yxatdan o'tdi", "student": new_std})
            return

        elif path == '/api/v1/parents/children/add':
            s_id = data.get("studentId")
            std = next((s for s in db["students"] if s["id"] == s_id or s.get("uniqueId") == s_id), None)
            if not std:
                self._send_json({"success": False, "message": "O'quvchi topilmadi"}, 404)
                return
            self._send_json({"success": True, "message": f"{std['name']} profilga biriktirildi!", "student": std})
            return

        elif path == '/api/v1/devices/pair':
            s_id = data.get("studentId")
            std = next((s for s in db["students"] if s["id"] == s_id or s.get("uniqueId") == s_id), None)
            if not std:
                self._send_json({"success": False, "message": "O'quvchi topilmadi"}, 404)
                return
            std["deviceId"] = data.get("deviceId")
            save_db()
            self._send_json({"success": True, "message": f"{std['name']} uchun soat ulandi!", "student": std})
            return

        elif '/transfer' in path:
            s_id = path.split('/')[4]
            target_sch_id = data.get("toSchoolId")
            std = next((s for s in db["students"] if s["id"] == s_id or s.get("uniqueId") == s_id), None)
            target_sch = next((s for s in db["schools"] if s["id"] == target_sch_id), None)
            if not std or not target_sch:
                self._send_json({"success": False, "message": "Ma'lumot topilmadi"}, 404)
                return
            std["schoolId"] = target_sch["id"]
            std["schoolName"] = target_sch["name"]
            save_db()
            self._send_json({"success": True, "message": f"{std['name']} {target_sch['name']} ga ko'chirildi!", "student": std})
            return

        elif path == '/api/v1/sos':
            dev_id = data.get("device_id") or "watch-5pro-01"
            std = next((s for s in db["students"] if s.get("deviceId") == dev_id), db["students"][0])
            notif = {
                "id": f"notif-sos-{int(time.time()*1000)}",
                "userId": std.get("parentId", "usr-parent-1"),
                "studentId": std["id"],
                "type": "SOS",
                "title": "🚨 FAVQULODDA SOS TUGMASI BOSILDI!",
                "message": f"{std['name']} favqulodda SOS signalini yubordi!",
                "time": datetime.now().strftime("%H:%M:%S")
            }
            if "notifications" not in db: db["notifications"] = []
            db["notifications"].insert(0, notif)
            save_db()
            self._send_json({"success": True, "message": "SOS signal yetkazildi!"})
            return

        elif path == '/api/v1/telemetry/simulate-walk':
            s_id = data.get("studentId", "10001")
            std = next((s for s in db["students"] if s["id"] == s_id or s.get("uniqueId") == s_id), db["students"][0])
            stage = data.get("stage", "ENTER_SCHOOL")
            sch = next((s for s in db["schools"] if s["id"] == std.get("schoolId")), db["schools"][0])
            c_lat = sch.get("lat", 41.311081)
            c_lng = sch.get("lng", 69.240562)

            if stage == 'OUTSIDE_STREET':
                lat, lng, acc = c_lat - 0.0055, c_lng - 0.0055, 3.5
            elif stage == 'APPROACHING_GATE':
                lat, lng, acc = c_lat - 0.0018, c_lng - 0.0018, 19.5
            elif stage == 'ENTER_SCHOOL':
                lat, lng, acc = c_lat, c_lng, 3.2
            elif stage == 'INSIDE_CLASS':
                lat, lng, acc = c_lat + 0.0003, c_lng + 0.0003, 2.8
            else:
                lat, lng, acc = c_lat + 0.0045, c_lng + 0.0045, 4.0

            eval_res = evaluate_strict_attendance(std, lat, lng, acc)
            st_data = {
                "deviceId": std.get("deviceId", "watch-5pro-01"),
                "studentId": std["id"],
                "studentName": std["name"],
                "schoolId": std.get("schoolId"),
                "latitude": lat,
                "longitude": lng,
                "accuracy": acc,
                "heartRate": 88 if stage == 'ENTER_SCHOOL' else 76,
                "bodyTemperature": 36.6,
                "batteryLevel": 87,
                "geofenceStatus": eval_res["status"],
                "statusColor": eval_res["color"],
                "statusDisplay": eval_res["display"],
                "lastSeen": int(time.time() * 1000)
            }
            db["telemetryState"][std.get("deviceId", "watch-5pro-01")] = st_data

            today = datetime.now().strftime("%Y-%m-%d")
            now_time = datetime.now().strftime("%H:%M:%S")
            att = next((a for a in db["attendance"] if a["studentId"] == std["id"] and a["date"] == today), None)
            if eval_res["status"] == "INSIDE":
                if not att:
                    att = {
                        "id": f"att-{std['id']}-{today}", "studentId": std["id"], "schoolId": std.get("schoolId"),
                        "date": today, "arrivalTime": now_time, "departureTime": None, "status": "PRESENT",
                        "statusColor": "GREEN", "statusDisplay": "PRESENT – INSIDE SCHOOL", "isManualCorrection": False
                    }
                    db["attendance"].append(att)
                else:
                    att["arrivalTime"] = att.get("arrivalTime") or now_time
                    att["status"] = "PRESENT"
                    att["statusColor"] = "GREEN"
                    att["statusDisplay"] = "PRESENT – INSIDE SCHOOL"

            save_db()
            self._send_json({"success": True, "stage": stage, "telemetry": st_data, "statusDisplay": eval_res["display"], "statusColor": eval_res["color"]})
            return

        self._send_json({"success": False, "message": "Noma'lum API yo'nalishi"}, 404)

if __name__ == '__main__':
    server_address = ('', PORT)
    httpd = http.server.HTTPServer(server_address, SmartChildHandler)
    print("=" * 66)
    print("🚀 SMART CHILD Python Backend Engine ishga tushdi!")
    print(f"📡 Web Dashboard: http://localhost:{PORT}")
    print("=" * 66)
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nTo'xtatildi.")
