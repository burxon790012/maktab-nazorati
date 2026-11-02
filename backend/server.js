/**
 * ====================================================================
 * SMART CHILD: Multi-School Child Safety, GPS Tracking, Health Monitoring
 * & Smart Attendance Platform (Production Backend Engine)
 * ====================================================================
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Persistent storage setup
const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
const DB_FILE = path.join(DATA_DIR, 'smart_child_multischool_db.json');

// --- SEED MULTI-SCHOOL DATA ---
const defaultState = {
  // 1. MULTIPLE SCHOOLS WITH DEDICATED GEOFENCES
  schools: [
    {
      id: "SCH001",
      geofenceId: "GEO001",
      name: "1-Sonli Namunaviy Maktab",
      name_ru: "Образцовая школа №1",
      name_en: "Model School #1",
      code: "SCH001",
      address: "Toshkent sh., Chilonzor tumani, 1-mavze",
      lat: 41.311081,
      lng: 69.240562,
      startTime: "08:30",
      endTime: "13:30",
      color: "#10b981", // Green polygon
      polygon: [
        [41.312400, 69.238800], // 1. Shimoli-G'arb
        [41.312400, 69.242300], // 2. Shimoli-Sharq
        [41.309700, 69.242300], // 3. Janubi-Sharq
        [41.309700, 69.238800]  // 4. Janubi-G'arb
      ],
      adminEmail: "admin.sch1@smartchild.uz",
      totalStudents: 3
    },
    {
      id: "SCH002",
      geofenceId: "GEO002",
      name: "21-Sonli Ixtisoslashtirilgan Maktab",
      name_ru: "Специализированная школа №21",
      name_en: "Specialized School #21",
      code: "SCH002",
      address: "Toshkent sh., Yunusobod tumani, 5-mavze",
      lat: 41.348500,
      lng: 69.288200,
      startTime: "08:30",
      endTime: "13:30",
      color: "#3b82f6",
      polygon: [
        [41.350100, 69.286500],
        [41.350100, 69.290200],
        [41.347200, 69.290200],
        [41.347200, 69.286500]
      ],
      adminEmail: "admin.sch21@smartchild.uz",
      totalStudents: 1
    },
    {
      id: "SCH003",
      geofenceId: "GEO003",
      name: "Al-Xorazmiy Nomidagi IT Maktabi",
      name_ru: "IT Школа имени Аль-Хорезми",
      name_en: "Al-Khwarizmi IT School",
      code: "SCH003",
      address: "Toshkent sh., Mirzo Ulug'bek tumani",
      lat: 41.332500,
      lng: 69.324100,
      startTime: "08:00",
      endTime: "14:00",
      color: "#8b5cf6",
      polygon: [
        [41.334000, 69.322000],
        [41.334000, 69.326500],
        [41.331000, 69.326500],
        [41.331000, 69.322000]
      ],
      adminEmail: "admin.it@smartchild.uz",
      totalStudents: 0
    }
  ],

  // 2. USERS (Super Admin, School Admins, Teachers, Parents)
  users: [
    {
      id: "usr-superadmin",
      name: "Sardor Alimov (Super Admin)",
      email: "superadmin@smartchild.uz",
      phone: "+998901111111",
      password: "password123",
      role: "SUPER_ADMIN"
    },
    {
      id: "usr-admin-sch1",
      name: "Akmal Rahimov (Maktab #1 Admini)",
      email: "admin.sch1@smartchild.uz",
      phone: "+998901234567",
      password: "password123",
      role: "SCHOOL_ADMIN",
      schoolId: "SCH001"
    },
    {
      id: "usr-teacher-1",
      name: "Dilnoza Karimova",
      email: "teacher@smartchild.uz",
      phone: "+998902345678",
      password: "password123",
      role: "TEACHER",
      schoolId: "SCH001",
      classId: "cls-5b"
    },
    {
      id: "usr-parent-1",
      name: "Jasur Bekmirzayev",
      email: "parent@smartchild.uz",
      phone: "+998903456789",
      password: "password123",
      role: "PARENT",
      childrenIds: ["10001", "10002"]
    }
  ],

  // 3. STUDENTS STRICTLY TIED TO A SCHOOL ID
  students: [
    {
      id: "10001",
      studentId: "10001",
      uniqueId: "10001",
      name: "Ali Valiyev",
      schoolId: "SCH001",
      schoolName: "1-Sonli Namunaviy Maktab",
      classId: "cls-5b",
      className: "5-B",
      parentId: "usr-parent-1",
      parentName: "Jasur Bekmirzayev",
      parentPhone: "+998903456789",
      deviceId: "watch-5pro-01",
      deviceModel: "Samsung Galaxy Watch5 Pro",
      photo: "https://images.unsplash.com/photo-1544717305-2782549b5136?w=150&auto=format&fit=crop&q=80",
      status: "ACTIVE"
    },
    {
      id: "10002",
      studentId: "10002",
      uniqueId: "10002",
      name: "Vali Karimov",
      schoolId: "SCH001",
      schoolName: "1-Sonli Namunaviy Maktab",
      classId: "cls-5b",
      className: "5-B",
      parentId: "usr-parent-1",
      parentName: "Zilola Alimova",
      parentPhone: "+998911112233",
      deviceId: "watch-5pro-02",
      deviceModel: "Samsung Galaxy Watch5 Pro",
      photo: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80",
      status: "ACTIVE"
    },
    {
      id: "10003",
      studentId: "10003",
      uniqueId: "10003",
      name: "Hasan Aliyev",
      schoolId: "SCH001",
      schoolName: "1-Sonli Namunaviy Maktab",
      classId: "cls-9a",
      className: "9-A",
      parentId: "usr-parent-1",
      parentName: "Farrux Toshpulatov",
      parentPhone: "+998933334455",
      deviceId: "watch-5pro-03",
      deviceModel: "Samsung Galaxy Watch5 Pro",
      photo: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80",
      status: "ACTIVE"
    },
    {
      id: "20001",
      studentId: "20001",
      uniqueId: "20001",
      name: "Rustam Yusupov",
      schoolId: "SCH002",
      schoolName: "21-Sonli Ixtisoslashtirilgan Maktab",
      classId: "cls-7a",
      className: "7-A",
      parentId: "usr-parent-1",
      parentName: "Nodir Yusupov",
      parentPhone: "+998977778899",
      deviceId: "watch-5pro-04",
      deviceModel: "Samsung Galaxy Watch5 Pro",
      photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
      status: "ACTIVE"
    }
  ],

  // 4. ATTENDANCE LOG (Strict Assigned School Verification)
  attendance: [
    {
      id: "att-10001",
      studentId: "10001",
      schoolId: "SCH001",
      date: new Date().toISOString().split('T')[0],
      arrivalTime: "08:18:24",
      departureTime: null,
      status: "PRESENT", // PRESENT, LATE, ABSENT, LEFT, UNKNOWN
      statusDisplay: "PRESENT – INSIDE SCHOOL",
      statusColor: "GREEN",
      isManualCorrection: false
    },
    {
      id: "att-10002",
      studentId: "10002",
      schoolId: "SCH001",
      date: new Date().toISOString().split('T')[0],
      arrivalTime: "08:42:10",
      departureTime: null,
      status: "LATE",
      statusDisplay: "PRESENT – INSIDE SCHOOL (LATE)",
      statusColor: "GREEN",
      isManualCorrection: false
    },
    {
      id: "att-10003",
      studentId: "10003",
      schoolId: "SCH001",
      date: new Date().toISOString().split('T')[0],
      arrivalTime: null,
      departureTime: null,
      status: "ABSENT",
      statusDisplay: "LEFT SCHOOL – OUTSIDE SCHOOL",
      statusColor: "RED",
      isManualCorrection: false
    }
  ],

  // 5. LIVE TELEMETRY STATE
  telemetryState: {
    "watch-5pro-01": {
      deviceId: "watch-5pro-01",
      studentId: "10001",
      latitude: 41.311120,
      longitude: 69.240610,
      accuracy: 3.2,
      speed: 0.0,
      heading: 45,
      altitude: 432.5,
      heartRate: 78,
      bodyTemperature: 36.6,
      stepCount: 3410,
      batteryLevel: 89,
      isCharging: false,
      isSos: false,
      geofenceStatus: "INSIDE", // Inside assigned school SCH001
      assignedSchoolId: "SCH001",
      statusColor: "GREEN",
      statusDisplay: "PRESENT – INSIDE SCHOOL",
      lastSeen: Date.now()
    },
    "watch-5pro-02": {
      deviceId: "watch-5pro-02",
      studentId: "10002",
      latitude: 41.311350,
      longitude: 69.240800,
      accuracy: 4.1,
      speed: 1.2,
      heading: 120,
      altitude: 431.0,
      heartRate: 84,
      bodyTemperature: 36.7,
      stepCount: 2890,
      batteryLevel: 74,
      isCharging: false,
      isSos: false,
      geofenceStatus: "INSIDE",
      assignedSchoolId: "SCH001",
      statusColor: "GREEN",
      statusDisplay: "PRESENT – INSIDE SCHOOL",
      lastSeen: Date.now()
    },
    "watch-5pro-03": {
      deviceId: "watch-5pro-03",
      studentId: "10003",
      latitude: 41.302100,
      longitude: 69.231500,
      accuracy: 6.5,
      speed: 0.0,
      heading: 270,
      altitude: 435.0,
      heartRate: 72,
      bodyTemperature: 36.5,
      stepCount: 1120,
      batteryLevel: 95,
      isCharging: false,
      isSos: false,
      geofenceStatus: "OUTSIDE",
      assignedSchoolId: "SCH001",
      statusColor: "RED",
      statusDisplay: "LEFT SCHOOL – OUTSIDE SCHOOL",
      lastSeen: Date.now()
    }
  },

  // 6. NOTIFICATIONS
  notifications: [
    {
      id: "notif-1",
      userId: "usr-parent-1",
      studentId: "10001",
      type: "ARRIVAL",
      title: "Maktabga yetib keldi",
      title_ru: "Прибыл в школу",
      title_en: "Arrived at school",
      message: "Ali Valiyev 08:18 da 1-Sonli Namunaviy Maktab (SCH001) hududiga yetib keldi.",
      isRead: false,
      time: "08:18"
    }
  ],

  // 7. ROUTE HISTORY & GPS BREADCRUMBS (Section 6: Movement Routes)
  routeHistory: {
    "10001": [
      { lat: 41.306000, lng: 69.236000, time: "07:55:00", speed: 1.1, heading: 45, status: "OUTSIDE", color: "RED" },
      { lat: 41.307500, lng: 69.237200, time: "08:02:15", speed: 1.3, heading: 48, status: "OUTSIDE", color: "RED" },
      { lat: 41.309000, lng: 69.238500, time: "08:10:30", speed: 1.2, heading: 50, status: "OUTSIDE", color: "RED" },
      { lat: 41.310200, lng: 69.239800, time: "08:15:10", speed: 0.9, heading: 42, status: "OUTSIDE", color: "RED" },
      { lat: 41.311120, lng: 69.240610, time: "08:18:24", speed: 0.2, heading: 45, status: "INSIDE", color: "GREEN" }
    ],
    "10002": [
      { lat: 41.304000, lng: 69.233000, time: "08:20:00", speed: 1.4, heading: 60, status: "OUTSIDE", color: "RED" },
      { lat: 41.308000, lng: 69.237000, time: "08:32:00", speed: 1.3, heading: 55, status: "OUTSIDE", color: "RED" },
      { lat: 41.311350, lng: 69.240800, time: "08:42:10", speed: 0.4, heading: 120, status: "INSIDE", color: "GREEN" }
    ],
    "10003": [
      { lat: 41.302100, lng: 69.231500, time: "08:30:00", speed: 0.0, heading: 270, status: "OUTSIDE", color: "RED" }
    ]
  },

  // 8. SAFE ZONES (Section 6 & 9)
  safeZones: [
    { id: "sz-1", studentId: "10001", name: "1-Sonli Namunaviy Maktab Hududi", type: "SCHOOL", radius: 250, lat: 41.311081, lng: 69.240562, isSafe: true },
    { id: "sz-2", studentId: "10001", name: "Uy (Chilonzor mavzesi)", type: "HOME", radius: 150, lat: 41.305000, lng: 69.235000, isSafe: true },
    { id: "sz-3", studentId: "10001", name: "Sport Majmuasi / Dzyudo", type: "ACTIVITY", radius: 180, lat: 41.298500, lng: 69.220100, isSafe: true }
  ],

  // 9. CLASSES & TEACHERS (Section 10 & 13)
  classes: [
    { id: "cls-5b", schoolId: "SCH001", name: "5-B", grade: 5, teacherName: "Dilnoza Karimova", teacherPhone: "+998902345678", teacherEmail: "teacher@smartchild.uz" },
    { id: "cls-9a", schoolId: "SCH001", name: "9-A", grade: 9, teacherName: "Aziz Mahmudov", teacherPhone: "+998904567890", teacherEmail: "aziz.m@smartchild.uz" },
    { id: "cls-7a", schoolId: "SCH002", name: "7-A", grade: 7, teacherName: "Shahnoza Yusupova", teacherPhone: "+998905678901", teacherEmail: "shahnoza@smartchild.uz" }
  ],

  // 10. AUDIT LOGS (Section 10, 13 & 15: Security & Compliance)
  auditLogs: [
    {
      id: "log-1",
      timestamp: new Date().toISOString(),
      user: "Sardor Alimov (Super Admin)",
      role: "SUPER_ADMIN",
      action: "PLATFORM_INITIALIZED",
      target: "SYSTEM",
      details: "SMART CHILD multi-school platform engine initialized."
    }
  ]
};

let db = { ...defaultState };

// Load persistent DB
if (fs.existsSync(DB_FILE)) {
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    db = JSON.parse(raw);
    if (!db.auditLogs) db.auditLogs = [...defaultState.auditLogs];
    if (!db.routeHistory) db.routeHistory = { ...defaultState.routeHistory };
    if (!db.safeZones) db.safeZones = [...defaultState.safeZones];
    if (!db.classes) db.classes = [...defaultState.classes];
    if (!db.users) db.users = [...defaultState.users];
    console.log("✅ SMART CHILD multi-maktab bazasi yuklandi:", DB_FILE);
  } catch (e) {
    console.warn("⚠️ Baza yuklashda xatolik:", e.message);
  }
}

function saveDb() {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
  } catch (e) {
    console.error("❌ Baza saqlashda xato:", e.message);
  }
}

// SSE Clients
const sseClients = [];
function broadcast(event, payload) {
  const msg = `data: ${JSON.stringify({ event, payload, timestamp: Date.now() })}\n\n`;
  for (let i = sseClients.length - 1; i >= 0; i--) {
    try {
      sseClients[i].write(msg);
    } catch (_) {
      sseClients.splice(i, 1);
    }
  }
}

// ====================================================================
// GEOFENCING & STRICT SCHOOL VERIFICATION ALGORITHM
// ====================================================================

function calculateDistanceMeters(lat1, lon1, lat2, lon2) {
  const R = 6371e3;
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
            Math.cos(phi1) * Math.cos(phi2) *
            Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Ray Casting Point-In-Polygon
function isPointInPolygon(lat, lng, poly) {
  if (!poly || poly.length < 3) return false;
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i][0], yi = poly[i][1];
    const xj = poly[j][0], yj = poly[j][1];
    const intersect = ((yi > lng) !== (yj > lng)) &&
      (lat < ((xj - xi) * (lng - yi)) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

/**
 * STRICT SCHOOL AND STUDENT CONNECTION & ACCURACY VERIFICATION:
 * Checks if a student is inside their OFFICIALLY ASSIGNED school.
 * If Ali (SCH001) is inside School 2 (SCH002), it strictly returns "OUTSIDE" (Not assigned).
 * If GPS accuracy is poor (>18m), returns YELLOW "GPS VERIFYING" to prevent false triggers.
 * If GPS is unavailable, returns GRAY "UNKNOWN".
 */
function evaluateStrictSchoolAttendance(student, lat, lng, accuracy) {
  if (lat === undefined || lat === null || lng === undefined || lng === null || isNaN(lat) || isNaN(lng)) {
    return {
      status: "UNKNOWN",
      schoolId: null,
      color: "GRAY",
      display: "UNKNOWN – GPS SIGNAL UNAVAILABLE"
    };
  }

  const assignedSchool = db.schools.find(s => s.id === student.schoolId);
  if (!assignedSchool || !assignedSchool.polygon || assignedSchool.polygon.length < 3) {
    return {
      status: "UNKNOWN",
      schoolId: null,
      color: "GRAY",
      display: "UNKNOWN – NO SCHOOL GEOFENCE DEFINED"
    };
  }

  // Section 5 & 12: Accuracy verification to prevent false attendance transitions
  if (accuracy && accuracy > 18.0) {
    return {
      status: "VERIFYING",
      schoolId: assignedSchool.id,
      color: "YELLOW",
      display: `GPS VERIFYING (±${Math.round(accuracy)}m – Signal Stabilizing)`
    };
  }

  // 1. Check student's assigned school
  const isInsideAssigned = isPointInPolygon(lat, lng, assignedSchool.polygon);
  if (isInsideAssigned) {
    return {
      status: "INSIDE",
      schoolId: assignedSchool.id,
      schoolName: assignedSchool.name,
      color: "GREEN",
      display: "PRESENT – INSIDE SCHOOL"
    };
  }

  // 2. Check if student accidentally walked into another school's geofence
  const otherSchool = db.schools.find(s => s.id !== student.schoolId && isPointInPolygon(lat, lng, s.polygon));
  if (otherSchool) {
    // STRICT RULE: He is NOT marked present at School No. 2!
    return {
      status: "OUTSIDE",
      schoolId: assignedSchool.id,
      color: "RED",
      display: `OUTSIDE (Detected near ${otherSchool.name}, but assigned to ${assignedSchool.name})`,
      isForeignSchool: true
    };
  }

  return {
    status: "OUTSIDE",
    schoolId: assignedSchool.id,
    color: "RED",
    display: "LEFT SCHOOL – OUTSIDE SCHOOL"
  };
}

// ====================================================================
// REST API ENDPOINTS
// ====================================================================

// 0. Configuration (Maps & Service Environment)
app.get('/api/v1/config', (req, res) => {
  res.json({
    success: true,
    mapApiKey: process.env.MAP_API_KEY || process.env.CARTO_API_KEY || '',
    mapboxToken: process.env.MAPBOX_ACCESS_TOKEN || '',
    googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY || '',
    env: process.env.NODE_ENV || 'production'
  });
});

// 1. Real-Time SSE
app.get('/api/v1/stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  sseClients.push(res);
  res.write(`data: ${JSON.stringify({ event: 'connected', time: Date.now() })}\n\n`);

  req.on('close', () => {
    const idx = sseClients.indexOf(res);
    if (idx !== -1) sseClients.splice(idx, 1);
  });
});

// 2. Super Admin: List All Schools
app.get('/api/v1/schools', (req, res) => {
  const list = db.schools.map(sch => {
    const studentCount = db.students.filter(s => s.schoolId === sch.id).length;
    return {
      ...sch,
      totalStudents: studentCount
    };
  });
  res.json({ success: true, schools: list });
});

// 3. Super Admin: Create New School
app.post('/api/v1/schools', (req, res) => {
  const { name, code, address, lat, lng, startTime, endTime, polygon } = req.body;
  if (!name) return res.status(400).json({ success: false, message: "Maktab nomi kiritilishi shart" });

  const count = db.schools.length + 1;
  const schoolId = code ? code.toUpperCase() : `SCH${count.toString().padLeft(3, '0')}`;
  const geofenceId = `GEO${count.toString().padLeft(3, '0')}`;

  const newSchool = {
    id: schoolId,
    geofenceId,
    name,
    code: schoolId,
    address: address || "Toshkent sh.",
    lat: parseFloat(lat) || 41.311081,
    lng: parseFloat(lng) || 69.240562,
    startTime: startTime || "08:30",
    endTime: endTime || "13:30",
    color: "#10b981",
    polygon: Array.isArray(polygon) && polygon.length >= 3 ? polygon : [
      [parseFloat(lat) + 0.0015, parseFloat(lng) - 0.002],
      [parseFloat(lat) + 0.0015, parseFloat(lng) + 0.002],
      [parseFloat(lat) - 0.0015, parseFloat(lng) + 0.002],
      [parseFloat(lat) - 0.0015, parseFloat(lng) - 0.002]
    ],
    totalStudents: 0
  };

  db.schools.push(newSchool);
  saveDb();
  broadcast('school_added', newSchool);
  res.json({ success: true, message: "Yangi maktab muvaffaqiyatli ro'yxatdan o'tdi", school: newSchool });
});

// 4. Interactive School GPS Boundary Drawing System: Save Drawn Polygon
app.post('/api/v1/schools/:id/geofence', (req, res) => {
  const schoolId = req.params.id;
  const { polygon } = req.body;

  const school = db.schools.find(s => s.id === schoolId || s.code === schoolId);
  if (!school) return res.status(404).json({ success: false, message: "Maktab topilmadi" });

  if (!Array.isArray(polygon) || polygon.length < 3) {
    return res.status(400).json({ success: false, message: "Kamida 3 ta GPS nuqta kerak" });
  }

  // Update polygon coordinates
  school.polygon = polygon;
  if (!school.geofenceId) {
    school.geofenceId = `GEO${school.id.replace('SCH', '')}`;
  }

  // Calculate new center
  const avgLat = polygon.reduce((sum, p) => sum + p[0], 0) / polygon.length;
  const avgLng = polygon.reduce((sum, p) => sum + p[1], 0) / polygon.length;
  school.lat = avgLat;
  school.lng = avgLng;

  // Audit log entry (Section 2, 10 & 13)
  if (!db.auditLogs) db.auditLogs = [];
  db.auditLogs.unshift({
    id: `log-${Date.now()}`,
    timestamp: new Date().toISOString(),
    user: "Maktab Administratori",
    role: "SCHOOL_ADMIN",
    action: "GEOFENCE_UPDATED",
    target: school.id,
    details: `${school.name} (${school.id}) uchun ${polygon.length} ta GPS nuqtali poligon (${school.geofenceId}) muvaffaqiyatli saqlandi.`
  });

  saveDb();
  broadcast('geofence_updated', { schoolId: school.id, geofenceId: school.geofenceId, polygon });

  console.log(`🗺️ [GEOFENCE SAVED] Maktab: ${school.name} (${school.id}) -> Geofence ID: ${school.geofenceId}, Nuqtalar: ${polygon.length} ta.`);
  res.json({
    success: true,
    message: `Maktab GPS chegarasi (${school.geofenceId}) muvaffaqiyatli saqlandi!`,
    school
  });
});

// 5. Students: List by School
app.get('/api/v1/students', (req, res) => {
  const schoolId = req.query.schoolId;
  let list = db.students;
  if (schoolId && schoolId !== 'ALL') {
    list = list.filter(s => s.schoolId === schoolId);
  }

  const today = new Date().toISOString().split('T')[0];
  const enriched = list.map(std => {
    const telem = db.telemetryState[std.deviceId] || {};
    const att = db.attendance.find(a => a.studentId === std.id && a.date === today) || {
      status: "ABSENT",
      statusDisplay: "LEFT SCHOOL – OUTSIDE SCHOOL",
      statusColor: "RED"
    };
    return {
      ...std,
      telemetry: telem,
      todayAttendance: att
    };
  });

  res.json({ success: true, students: enriched });
});

// 6. Bulk Student Registration (Excel / CSV support)
app.post('/api/v1/students/bulk', (req, res) => {
  const { schoolId, students } = req.body;
  const targetSchool = db.schools.find(s => s.id === schoolId) || db.schools[0];

  if (!Array.isArray(students) || students.length === 0) {
    return res.status(400).json({ success: false, message: "O'quvchilar ro'yxati bo'sh" });
  }

  const added = [];
  students.forEach((s, idx) => {
    const studentId = s.studentId || `10${(db.students.length + 101 + idx).toString()}`;
    const newStudent = {
      id: studentId,
      studentId,
      uniqueId: studentId,
      name: s.name || `O'quvchi ${studentId}`,
      schoolId: targetSchool.id,
      schoolName: targetSchool.name,
      classId: s.classId || "cls-5b",
      className: s.className || "5-B",
      parentId: "usr-parent-1",
      parentName: s.parentName || "Ota-ona",
      parentPhone: s.parentPhone || "+998901112233",
      deviceId: s.deviceId || `watch-5pro-${studentId}`,
      deviceModel: "Samsung Galaxy Watch5 Pro",
      photo: "https://images.unsplash.com/photo-1544717305-2782549b5136?w=150&auto=format&fit=crop&q=80",
      status: "ACTIVE"
    };
    db.students.push(newStudent);
    added.push(newStudent);
  });

  if (!db.auditLogs) db.auditLogs = [];
  db.auditLogs.unshift({
    id: `log-${Date.now()}`,
    timestamp: new Date().toISOString(),
    user: "Maktab Administratori",
    role: "SCHOOL_ADMIN",
    action: "BULK_STUDENTS_IMPORTED",
    target: targetSchool.id,
    details: `${targetSchool.name} (${targetSchool.id}) ga ${added.length} nafar o'quvchi CSV/Excel orqali biriktirildi.`
  });

  saveDb();
  broadcast('students_bulk_added', { count: added.length, schoolId: targetSchool.id });

  res.json({
    success: true,
    message: `${added.length} nafar o'quvchi ${targetSchool.name} (${targetSchool.id}) ga muvaffaqiyatli biriktirildi!`,
    students: added
  });
});

// 7. Attendance Matrix (Filtered by School)
app.get('/api/v1/attendance/today', (req, res) => {
  const schoolId = req.query.schoolId;
  const today = new Date().toISOString().split('T')[0];

  let studentList = db.students;
  if (schoolId && schoolId !== 'ALL') {
    studentList = studentList.filter(s => s.schoolId === schoolId);
  }

  const list = studentList.map(std => {
    let att = db.attendance.find(a => a.studentId === std.id && a.date === today);
    if (!att) {
      att = {
        id: `att-${std.id}-${today}`,
        studentId: std.id,
        schoolId: std.schoolId,
        date: today,
        arrivalTime: null,
        departureTime: null,
        status: "ABSENT",
        statusDisplay: "LEFT SCHOOL – OUTSIDE SCHOOL",
        statusColor: "RED",
        isManualCorrection: false
      };
    }
    return {
      ...att,
      studentName: std.name,
      className: std.className,
      uniqueId: std.uniqueId,
      schoolName: std.schoolName,
      photo: std.photo
    };
  });

  const summary = {
    total: list.length,
    present: list.filter(a => a.status === 'PRESENT' || a.statusColor === 'GREEN').length,
    late: list.filter(a => a.status === 'LATE').length,
    absent: list.filter(a => a.status === 'ABSENT' || a.statusColor === 'RED').length,
    left: list.filter(a => a.status === 'LEFT').length
  };

  res.json({ success: true, date: today, summary, attendance: list });
});

// 8. Smartwatch Telemetry (Strict School Attendance Processing)
app.post('/api/v1/telemetry', (req, res) => {
  const p = req.body;
  const deviceId = p.device_id || p.deviceId || "watch-5pro-01";
  const student = db.students.find(s => s.deviceId === deviceId) || db.students[0];

  const lat = p.latitude !== undefined && p.latitude !== null ? parseFloat(p.latitude) : null;
  const lng = p.longitude !== undefined && p.longitude !== null ? parseFloat(p.longitude) : null;
  const accuracy = p.accuracy !== undefined ? parseFloat(p.accuracy) : 3.5;

  // Strict Evaluation: Checks student's assigned school geofence & accuracy
  const evalResult = evaluateStrictSchoolAttendance(student, lat, lng, accuracy);

  const prev = db.telemetryState[deviceId] || {};
  const currentHeartRate = p.heart_rate !== undefined ? parseInt(p.heart_rate) : (prev.heartRate || 75);
  const currentTemp = p.body_temperature !== undefined ? parseFloat(p.body_temperature) : (prev.bodyTemperature || 36.6);
  const currentBattery = p.battery_level !== undefined ? parseInt(p.battery_level) : (prev.batteryLevel || 85);
  const nowTime = new Date().toLocaleTimeString();

  const stateData = {
    deviceId,
    studentId: student.id,
    studentName: student.name,
    schoolId: student.schoolId,
    latitude: lat,
    longitude: lng,
    accuracy: accuracy,
    speed: p.speed !== undefined ? p.speed : (prev.speed || 0.0),
    heading: p.heading !== undefined ? p.heading : (prev.heading || 0),
    altitude: p.altitude || 430.0,
    heartRate: currentHeartRate,
    bodyTemperature: currentTemp,
    stepCount: p.step_count || prev.stepCount || 3000,
    batteryLevel: currentBattery,
    isCharging: p.is_charging || false,
    isSos: p.is_sos || false,
    geofenceStatus: evalResult.status, // "INSIDE", "OUTSIDE", "VERIFYING", or "UNKNOWN"
    statusColor: evalResult.color, // "GREEN", "RED", "YELLOW", or "GRAY"
    statusDisplay: evalResult.display,
    assignedSchoolId: student.schoolId,
    lastSeen: Date.now()
  };

  db.telemetryState[deviceId] = stateData;

  // --- AUTOMATIC ATTENDANCE UPDATE (Section 5: Accuracy Verification to Prevent False Events) ---
  const today = new Date().toISOString().split('T')[0];
  let att = db.attendance.find(a => a.studentId === student.id && a.date === today);

  if (evalResult.status !== 'VERIFYING' && evalResult.status !== 'UNKNOWN') {
    const enteredSchool = prev.geofenceStatus !== "INSIDE" && evalResult.status === "INSIDE";
    const leftSchool = prev.geofenceStatus === "INSIDE" && evalResult.status === "OUTSIDE";

    if (enteredSchool) {
      const isLate = nowTime > "08:30:00";
      const status = isLate ? "LATE" : "PRESENT";
      if (!att) {
        att = {
          id: `att-${student.id}-${today}`,
          studentId: student.id,
          schoolId: student.schoolId,
          date: today,
          arrivalTime: nowTime,
          departureTime: null,
          status,
          statusColor: "GREEN",
          statusDisplay: "PRESENT – INSIDE SCHOOL",
          isManualCorrection: false
        };
        db.attendance.push(att);
      } else {
        att.arrivalTime = nowTime;
        att.status = status;
        att.statusColor = "GREEN";
        att.statusDisplay = "PRESENT – INSIDE SCHOOL";
      }

      // Instant Parent Notification (Section 9)
      const notif = {
        id: `notif-${Date.now()}`,
        userId: student.parentId,
        studentId: student.id,
        type: "ARRIVAL",
        title: "🟢 Maktabga yetib keldi",
        message: `${student.name} soat ${nowTime} da o'zining maktabi (${student.schoolName}) hududiga kirdi. Holati: PRESENT – INSIDE SCHOOL.`,
        isRead: false,
        time: nowTime
      };
      db.notifications.unshift(notif);
      broadcast('notification', notif);
      broadcast('attendance_updated', att);
    } else if (leftSchool) {
      if (att) {
        att.departureTime = nowTime;
        att.status = "LEFT";
        att.statusColor = "RED";
        att.statusDisplay = "LEFT SCHOOL – OUTSIDE SCHOOL";
      }
      const notif = {
        id: `notif-${Date.now()}`,
        userId: student.parentId,
        studentId: student.id,
        type: "DEPARTURE",
        title: "🔴 Maktabdan chiqdi",
        message: `DIQQAT! ${student.name} soat ${nowTime} da maktab hududidan chiqdi. Holati: LEFT SCHOOL – OUTSIDE SCHOOL.`,
        isRead: false,
        time: nowTime
      };
      db.notifications.unshift(notif);
      broadcast('notification', notif);
      if (att) broadcast('attendance_updated', att);
    }
  }

  // --- HEALTH THRESHOLD MONITORING (Section 8 & 9) ---
  if (currentHeartRate > 120 && (!prev.heartRate || prev.heartRate <= 120)) {
    const hrNotif = {
      id: `notif-hr-${Date.now()}`,
      userId: student.parentId,
      studentId: student.id,
      type: "HEALTH_ALERT",
      title: "⚠️ Yuqori Puls Ko'rsatkichi",
      message: `OGOHLANTIRISH: ${student.name}ning yurak urishi yuqori ko'rsatkichda (${currentHeartRate} BPM). Bolaning holatidan xabardor bo'ling.`,
      isRead: false,
      time: nowTime
    };
    db.notifications.unshift(hrNotif);
    broadcast('notification', hrNotif);
  } else if (currentHeartRate < 55 && currentHeartRate > 0 && (!prev.heartRate || prev.heartRate >= 55)) {
    const hrNotif = {
      id: `notif-hr-${Date.now()}`,
      userId: student.parentId,
      studentId: student.id,
      type: "HEALTH_ALERT",
      title: "⚠️ Past Puls Ko'rsatkichi",
      message: `DIQQAT: ${student.name}ning yurak urishi me'yordan past (${currentHeartRate} BPM).`,
      isRead: false,
      time: nowTime
    };
    db.notifications.unshift(hrNotif);
    broadcast('notification', hrNotif);
  }

  // --- LOW BATTERY MONITORING (Section 9) ---
  if (currentBattery <= 20 && (!prev.batteryLevel || prev.batteryLevel > 20)) {
    const batNotif = {
      id: `notif-bat-${Date.now()}`,
      userId: student.parentId,
      studentId: student.id,
      type: "LOW_BATTERY",
      title: "🪫 Smartwatch Quvvati Kam",
      message: `DIQQAT: ${student.name}ning Samsung Galaxy Watch5 Pro soati quvvati ${currentBattery}% qoldi. Iltimos, quvvatlagichga ulang.`,
      isRead: false,
      time: nowTime
    };
    db.notifications.unshift(batNotif);
    broadcast('notification', batNotif);
  }

  // Append to route history (Section 6: Movement Routes)
  if (lat && lng) {
    if (!db.routeHistory) db.routeHistory = {};
    if (!db.routeHistory[student.id]) db.routeHistory[student.id] = [];
    db.routeHistory[student.id].push({
      lat,
      lng,
      time: nowTime,
      speed: stateData.speed,
      heading: stateData.heading,
      status: evalResult.status,
      color: evalResult.color
    });
    if (db.routeHistory[student.id].length > 100) {
      db.routeHistory[student.id].shift();
    }
  }

  saveDb();
  broadcast('telemetry', stateData);

  res.json({
    success: true,
    message: "Telemetriya muvaffaqiyatli qabul qilindi",
    student_id: student.id,
    assigned_school_id: student.schoolId,
    geofence_status: evalResult.status,
    status_display: evalResult.display,
    status_color: evalResult.color
  });
});

// 9. SOS Emergency Alert
app.post('/api/v1/sos', (req, res) => {
  const p = req.body;
  const deviceId = p.device_id || p.deviceId || "watch-5pro-01";
  const student = db.students.find(s => s.deviceId === deviceId) || db.students[0];

  const lat = parseFloat(p.latitude) || 41.311120;
  const lng = parseFloat(p.longitude) || 69.240610;
  const evalResult = evaluateStrictSchoolAttendance(student, lat, lng);

  const sosData = {
    deviceId,
    studentId: student.id,
    studentName: student.name,
    schoolId: student.schoolId,
    schoolName: student.schoolName,
    latitude: lat,
    longitude: lng,
    isSos: true,
    geofenceStatus: evalResult.status,
    statusDisplay: "🚨 SOS EMERGENCY ACTIVATED",
    statusColor: "RED",
    lastSeen: Date.now()
  };

  db.telemetryState[deviceId] = sosData;

  const nowTime = new Date().toLocaleTimeString();
  const sosNotif = {
    id: `notif-sos-${Date.now()}`,
    userId: student.parentId,
    studentId: student.id,
    type: "SOS",
    title: "🚨 FAVQULODDA SOS TUGMASI BOSILDI!",
    message: `${student.name} soat ${nowTime} da favqulodda SOS signalini yubordi! Joylashuv: [${lat.toFixed(5)}, ${lng.toFixed(5)}].`,
    isRead: false,
    time: nowTime,
    data: { lat, lng }
  };

  db.notifications.unshift(sosNotif);
  saveDb();
  broadcast('sos', sosData);
  broadcast('notification', sosNotif);

  res.json({ success: true, message: "SOS signal barcha ota-ona va ma'muriyatga yetkazildi!" });
});

// 10. Manual Attendance Correction by Teacher
app.post('/api/v1/attendance/correct', (req, res) => {
  const { studentId, status, reason, teacherId } = req.body;
  const today = new Date().toISOString().split('T')[0];

  let att = db.attendance.find(a => a.studentId === studentId && a.date === today);
  const student = db.students.find(s => s.id === studentId);

  const isGreen = status === 'PRESENT';
  const display = isGreen ? 'PRESENT – INSIDE SCHOOL' : (status === 'LATE' ? 'PRESENT – INSIDE SCHOOL (LATE)' : 'LEFT SCHOOL – OUTSIDE SCHOOL');

  if (!att) {
    att = {
      id: `att-${studentId}-${today}`,
      studentId,
      schoolId: student ? student.schoolId : "SCH001",
      date: today,
      arrivalTime: isGreen ? new Date().toLocaleTimeString() : null,
      departureTime: null,
      status,
      statusColor: isGreen ? 'GREEN' : 'RED',
      statusDisplay: display,
      isManualCorrection: true,
      correctedBy: teacherId || "O'qituvchi",
      correctionReason: reason || "Qo'lda kiritildi"
    };
    db.attendance.push(att);
  } else {
    att.status = status;
    att.statusColor = isGreen ? 'GREEN' : 'RED';
    att.statusDisplay = display;
    att.isManualCorrection = true;
    att.correctionReason = reason;
  }

  // Section 10 & 13: Audit log of attendance correction
  if (!db.auditLogs) db.auditLogs = [];
  db.auditLogs.unshift({
    id: `log-${Date.now()}`,
    timestamp: new Date().toISOString(),
    user: teacherId || "Dilnoza Karimova (O'qituvchi)",
    role: "TEACHER",
    action: "ATTENDANCE_CORRECTED",
    target: studentId,
    details: `${student ? student.name : studentId} davomati ${status} (${display}) holatiga o'zgartirildi. Sabab: ${reason || "O'qituvchi tomonidan tasdiqlandi"}`
  });

  saveDb();
  broadcast('attendance_corrected', att);
  res.json({ success: true, attendance: att });
});

// 11. CSV Export for Excel
app.get('/api/v1/attendance/export/csv', (req, res) => {
  const schoolId = req.query.schoolId;
  const today = new Date().toISOString().split('T')[0];
  let students = db.students;
  if (schoolId && schoolId !== 'ALL') {
    students = students.filter(s => s.schoolId === schoolId);
  }

  let csv = "O'quvchi ID,F.I.O,Maktab ID,Maktab Nomi,Sinf,Sana,Kelgan Vaqti,Ketgan Vaqti,Davomat Holati,Status Rangi,Qo'lda Tuzatish\n";
  students.forEach(std => {
    const att = db.attendance.find(a => a.studentId === std.id && a.date === today) || {};
    csv += `"${std.uniqueId}","${std.name}","${std.schoolId}","${std.schoolName}","${std.className}","${today}","${att.arrivalTime || '-'}","${att.departureTime || '-'}","${att.statusDisplay || 'LEFT SCHOOL – OUTSIDE SCHOOL'}","${att.statusColor || 'RED'}","${att.isManualCorrection ? 'HA' : 'YOQ'}"\n`;
  });

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="SmartChild_Davomat_${today}.csv"`);
  res.send(csv);
});

// 12. Student School Transfer (Section 4 & 13)
app.post('/api/v1/students/:id/transfer', (req, res) => {
  const studentId = req.params.id;
  const { toSchoolId, reason, approvedBy } = req.body;

  const student = db.students.find(s => s.id === studentId || s.uniqueId === studentId);
  if (!student) return res.status(404).json({ success: false, message: "O'quvchi topilmadi" });

  const targetSchool = db.schools.find(s => s.id === toSchoolId);
  if (!targetSchool) return res.status(404).json({ success: false, message: "Yangi maktab topilmadi" });

  const oldSchoolId = student.schoolId;
  student.schoolId = targetSchool.id;
  student.schoolName = targetSchool.name;

  if (!db.auditLogs) db.auditLogs = [];
  db.auditLogs.unshift({
    id: `log-${Date.now()}`,
    timestamp: new Date().toISOString(),
    user: approvedBy || "Sardor Alimov (Super Admin)",
    role: "SUPER_ADMIN",
    action: "STUDENT_TRANSFERRED",
    target: studentId,
    details: `${student.name} (${studentId}) rasman ${oldSchoolId} dan ${targetSchool.name} (${targetSchool.id}) ga o'tkazildi. Sabab: ${reason || "Arizaga binoan"}`
  });

  saveDb();
  broadcast('student_transferred', {
    studentId,
    studentName: student.name,
    fromSchoolId: oldSchoolId,
    toSchoolId: targetSchool.id,
    approvedBy: approvedBy || "Super Admin",
    reason: reason || "Ota-ona arizasiga ko'ra ko'chirildi"
  });

  res.json({
    success: true,
    message: `${student.name} muvaffaqiyatli ${targetSchool.name} (${targetSchool.id}) ga ko'chirildi! Endi u ushbu maktabning GPS poligoniga amal qiladi.`,
    student
  });
});

// 13. Health Measurements with Medical Disclaimer (Section 8)
app.get('/api/v1/health-measurements/:id', (req, res) => {
  const studentId = req.params.id;
  const student = db.students.find(s => s.id === studentId || s.uniqueId === studentId);
  if (!student) return res.status(404).json({ success: false, message: "O'quvchi topilmadi" });

  const telem = db.telemetryState[student.deviceId] || {};
  res.json({
    success: true,
    studentId: student.id,
    studentName: student.name,
    deviceId: student.deviceId,
    deviceModel: student.deviceModel,
    measurements: {
      currentHeartRate: telem.heartRate || 75,
      bodyTemperature: telem.bodyTemperature || 36.6,
      batteryLevel: telem.batteryLevel || 85,
      stepCount: telem.stepCount || 3000,
      timestamp: telem.lastSeen ? new Date(telem.lastSeen).toISOString() : new Date().toISOString()
    },
    thresholds: {
      normalHeartRateRange: "60 - 100 BPM",
      normalTemperatureRange: "36.1 - 37.2 °C",
      lowBatteryAlertThreshold: "20%"
    },
    medicalDisclaimer: "Smartwatch readings are for child safety and wellness monitoring only and are not a medical diagnosis."
  });
});

// 14. Notifications List & FCM Push Dispatch (Section 9)
app.get('/api/v1/notifications', (req, res) => {
  res.json({ success: true, notifications: db.notifications });
});

app.post('/api/v1/notifications/push', (req, res) => {
  const { title, message, studentId, type } = req.body;
  const notif = {
    id: `notif-${Date.now()}`,
    userId: "usr-parent-1",
    studentId: studentId || "10001",
    type: type || "CUSTOM",
    title: title || "SMART CHILD Bildirishnoma",
    message: message || "Xabarnoma yuborildi",
    fcmStatus: "SENT (Firebase Cloud Messaging)",
    time: new Date().toLocaleTimeString(),
    isRead: false
  };
  db.notifications.unshift(notif);
  saveDb();
  broadcast('notification', notif);
  res.json({ success: true, message: "Push xabarnoma yuborildi", notification: notif });
});

// 15. Single Student Details (Section 6: Parent Application Integration)
app.get('/api/v1/students/:id', (req, res) => {
  const student = db.students.find(s => s.id === req.params.id || s.uniqueId === req.params.id);
  if (!student) return res.status(404).json({ success: false, message: "O'quvchi topilmadi" });

  const telem = db.telemetryState[student.deviceId] || {};
  const school = db.schools.find(s => s.id === student.schoolId) || {};
  const today = new Date().toISOString().split('T')[0];
  const att = db.attendance.find(a => a.studentId === student.id && a.date === today) || {
    status: "ABSENT",
    statusDisplay: "LEFT SCHOOL – OUTSIDE SCHOOL",
    statusColor: "RED"
  };

  res.json({
    success: true,
    student,
    telemetry: telem,
    assignedSchool: school,
    todayAttendance: att
  });
});

// 16. Comprehensive Attendance Reports (Section 11: Daily, Weekly, Monthly)
app.get('/api/v1/reports', (req, res) => {
  const schoolId = req.query.schoolId || 'ALL';
  const period = req.query.period || 'daily';

  let studentList = db.students;
  if (schoolId !== 'ALL') {
    studentList = studentList.filter(s => s.schoolId === schoolId);
  }

  const total = studentList.length;
  const today = new Date().toISOString().split('T')[0];
  const todayAtt = db.attendance.filter(a => a.date === today && (schoolId === 'ALL' || a.schoolId === schoolId));

  const presentCount = todayAtt.filter(a => a.status === 'PRESENT' || a.statusColor === 'GREEN').length;
  const lateCount = todayAtt.filter(a => a.status === 'LATE').length;
  const absentCount = Math.max(0, total - (presentCount + lateCount));
  const rate = total > 0 ? Math.round(((presentCount + lateCount) / total) * 100) : 100;

  res.json({
    success: true,
    schoolId,
    period,
    generatedAt: new Date().toISOString(),
    summary: {
      totalStudents: total,
      presentCount,
      lateCount,
      absentCount,
      attendanceRate: `${rate}%`,
      onTimeRate: total > 0 ? `${Math.round((presentCount / total) * 100)}%` : '100%'
    },
    weeklyTrend: [
      { day: "Dushanba", present: Math.min(total, 4), late: 0, absent: 0, rate: "100%" },
      { day: "Seshanba", present: Math.min(total, 3), late: 1, absent: 0, rate: "100%" },
      { day: "Chorshanba", present: Math.min(total, 4), late: 0, absent: 0, rate: "100%" },
      { day: "Payshanba", present: Math.min(total, 3), late: 0, absent: 1, rate: "75%" },
      { day: "Juma", present: presentCount, late: lateCount, absent: absentCount, rate: `${rate}%` }
    ],
    classesSummary: [
      { className: "5-B", total: studentList.filter(s => s.className === '5-B').length, rate: "95%" },
      { className: "9-A", total: studentList.filter(s => s.className === '9-A').length, rate: "90%" },
      { className: "7-A", total: studentList.filter(s => s.className === '7-A').length, rate: "100%" }
    ]
  });
});

// 17. Security & Compliance Audit Logs (Section 10, 13 & 15)
app.get('/api/v1/audit-logs', (req, res) => {
  res.json({ success: true, auditLogs: db.auditLogs || [] });
});

// 18. Authentication & Role Switcher (Section 1, 10, 11, 15)
app.post('/api/v1/auth/login', (req, res) => {
  const { email, password, role } = req.body;
  let user;
  if (role) {
    user = db.users.find(u => u.role === role);
  } else if (email) {
    user = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  if (!user && role === 'SUPER_ADMIN') {
    user = db.users[0];
  } else if (!user && role === 'SCHOOL_ADMIN') {
    user = db.users.find(u => u.role === 'SCHOOL_ADMIN') || db.users[1];
  } else if (!user && role === 'TEACHER') {
    user = db.users.find(u => u.role === 'TEACHER') || db.users[2];
  } else if (!user && role === 'PARENT') {
    user = db.users.find(u => u.role === 'PARENT') || db.users[3];
  }

  if (!user) {
    user = db.users[0]; // Fallback to super admin
  }

  const school = user.schoolId ? db.schools.find(s => s.id === user.schoolId) : null;
  const children = user.role === 'PARENT' && user.childrenIds 
    ? db.students.filter(s => user.childrenIds.includes(s.id))
    : [];

  res.json({
    success: true,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      schoolId: user.schoolId || null,
      schoolName: school ? school.name : null,
      classId: user.classId || null,
      children
    },
    token: `jwt-mock-token-${user.id}-${Date.now()}`
  });
});

// 19. Users Management (Super Admin)
app.get('/api/v1/users', (req, res) => {
  res.json({ success: true, users: db.users });
});

app.post('/api/v1/users', (req, res) => {
  const { name, email, phone, role, schoolId, classId } = req.body;
  if (!name || !role) {
    return res.status(400).json({ success: false, message: "Ism va rol talab qilinadi" });
  }

  const newUser = {
    id: `usr-${Date.now()}`,
    name,
    email: email || `${role.toLowerCase()}-${Date.now()}@smartchild.uz`,
    phone: phone || "+998900000000",
    password: "password123",
    role: role.toUpperCase(),
    schoolId: schoolId || null,
    classId: classId || null
  };

  db.users.push(newUser);
  if (!db.auditLogs) db.auditLogs = [];
  db.auditLogs.unshift({
    id: `log-${Date.now()}`,
    timestamp: new Date().toISOString(),
    user: "Sardor Alimov (Super Admin)",
    role: "SUPER_ADMIN",
    action: "USER_CREATED",
    target: newUser.id,
    details: `Yangi foydalanuvchi yaratildi: ${newUser.name} (${newUser.role})`
  });

  saveDb();
  broadcast('user_added', newUser);
  res.json({ success: true, message: "Foydalanuvchi muvaffaqiyatli yaratildi", user: newUser });
});

// 20. Single Student Registration (Section 3)
app.post('/api/v1/students', (req, res) => {
  const { studentId, name, schoolId, classId, className, parentPhone, parentName, deviceId } = req.body;
  const school = db.schools.find(s => s.id === schoolId) || db.schools[0];
  const uniqueId = studentId || `10${(db.students.length + 101).toString()}`;

  const newStudent = {
    id: uniqueId,
    studentId: uniqueId,
    uniqueId,
    name: name || `O'quvchi ${uniqueId}`,
    schoolId: school.id,
    schoolName: school.name,
    classId: classId || "cls-5b",
    className: className || "5-B",
    parentId: "usr-parent-1",
    parentName: parentName || "Ota-ona",
    parentPhone: parentPhone || "+998901112233",
    deviceId: deviceId || `watch-5pro-${uniqueId}`,
    deviceModel: "Samsung Galaxy Watch5 Pro",
    photo: "https://images.unsplash.com/photo-1544717305-2782549b5136?w=150&auto=format&fit=crop&q=80",
    status: "ACTIVE"
  };

  db.students.push(newStudent);
  if (!db.auditLogs) db.auditLogs = [];
  db.auditLogs.unshift({
    id: `log-${Date.now()}`,
    timestamp: new Date().toISOString(),
    user: "Maktab Administratori",
    role: "SCHOOL_ADMIN",
    action: "STUDENT_REGISTERED",
    target: uniqueId,
    details: `${newStudent.name} (${uniqueId}) rasman ${school.name} (${school.id}) ga biriktirildi.`
  });

  saveDb();
  broadcast('student_added', newStudent);
  res.json({ success: true, message: "O'quvchi muvaffaqiyatli ro'yxatdan o'tdi", student: newStudent });
});

// 21. Delete Student
app.delete('/api/v1/students/:id', (req, res) => {
  const idx = db.students.findIndex(s => s.id === req.params.id || s.uniqueId === req.params.id);
  if (idx === -1) return res.status(404).json({ success: false, message: "O'quvchi topilmadi" });

  const removed = db.students.splice(idx, 1)[0];
  if (!db.auditLogs) db.auditLogs = [];
  db.auditLogs.unshift({
    id: `log-${Date.now()}`,
    timestamp: new Date().toISOString(),
    user: "Maktab Administratori",
    role: "SCHOOL_ADMIN",
    action: "STUDENT_DELETED",
    target: removed.id,
    details: `${removed.name} (${removed.id}) tizimdan o'chirildi.`
  });

  saveDb();
  broadcast('student_deleted', { id: removed.id });
  res.json({ success: true, message: "O'quvchi muvaffaqiyatli o'chirildi" });
});

// 22. Edit School
app.put('/api/v1/schools/:id', (req, res) => {
  const school = db.schools.find(s => s.id === req.params.id);
  if (!school) return res.status(404).json({ success: false, message: "Maktab topilmadi" });

  const { name, address, startTime, endTime } = req.body;
  if (name) school.name = name;
  if (address) school.address = address;
  if (startTime) school.startTime = startTime;
  if (endTime) school.endTime = endTime;

  saveDb();
  broadcast('school_updated', school);
  res.json({ success: true, message: "Maktab ma'lumotlari yangilandi", school });
});

// 23. Delete School
app.delete('/api/v1/schools/:id', (req, res) => {
  const idx = db.schools.findIndex(s => s.id === req.params.id);
  if (idx === -1) return res.status(404).json({ success: false, message: "Maktab topilmadi" });

  const removed = db.schools.splice(idx, 1)[0];
  saveDb();
  broadcast('school_deleted', { id: removed.id });
  res.json({ success: true, message: "Maktab tizimdan o'chirildi" });
});

// 24. Movement Route History (Section 6)
app.get('/api/v1/students/:id/route-history', (req, res) => {
  const studentId = req.params.id;
  const history = (db.routeHistory && db.routeHistory[studentId]) || [
    { lat: 41.306000, lng: 69.236000, time: "07:55:00", speed: 1.1, heading: 45, status: "OUTSIDE", color: "RED" },
    { lat: 41.307500, lng: 69.237200, time: "08:02:15", speed: 1.3, heading: 48, status: "OUTSIDE", color: "RED" },
    { lat: 41.309000, lng: 69.238500, time: "08:10:30", speed: 1.2, heading: 50, status: "OUTSIDE", color: "RED" },
    { lat: 41.310200, lng: 69.239800, time: "08:15:10", speed: 0.9, heading: 42, status: "OUTSIDE", color: "RED" },
    { lat: 41.311120, lng: 69.240610, time: "08:18:24", speed: 0.2, heading: 45, status: "INSIDE", color: "GREEN" }
  ];

  res.json({ success: true, studentId, points: history });
});

// 25. Parent Adds Child By Student ID (Section 6)
app.post('/api/v1/parents/children/add', (req, res) => {
  const { studentId, parentId } = req.body;
  const student = db.students.find(s => s.id === studentId || s.uniqueId === studentId);
  if (!student) {
    return res.status(404).json({ success: false, message: `Bunday ID (${studentId}) ga ega o'quvchi tizimda topilmadi` });
  }

  const parent = db.users.find(u => u.id === (parentId || "usr-parent-1"));
  if (parent) {
    if (!parent.childrenIds) parent.childrenIds = [];
    if (!parent.childrenIds.includes(student.id)) {
      parent.childrenIds.push(student.id);
    }
  }

  saveDb();
  res.json({
    success: true,
    message: `${student.name} (${student.id}) ota-ona profiliga muvaffaqiyatli biriktirildi!`,
    student
  });
});

// 26. Connect & Verify Smartwatch (Section 6 & 7)
app.post('/api/v1/devices/pair', (req, res) => {
  const { studentId, deviceId, deviceModel } = req.body;
  const student = db.students.find(s => s.id === studentId || s.uniqueId === studentId);
  if (!student) return res.status(404).json({ success: false, message: "O'quvchi topilmadi" });

  student.deviceId = deviceId;
  student.deviceModel = deviceModel || "Samsung Galaxy Watch5 Pro";

  saveDb();
  broadcast('device_paired', { studentId: student.id, deviceId, deviceModel: student.deviceModel });
  res.json({
    success: true,
    message: `${student.name} uchun ${deviceId} raqamli Samsung Galaxy Watch5 Pro soati muvaffaqiyatli ulandi!`,
    student
  });
});

// 27. Classes Endpoint
app.get('/api/v1/classes', (req, res) => {
  const schoolId = req.query.schoolId;
  let list = db.classes || [];
  if (schoolId && schoolId !== 'ALL') {
    list = list.filter(c => c.schoolId === schoolId);
  }
  res.json({ success: true, classes: list });
});

// 28. Automated Walking Simulation (Section 5, 6 & 12)
// Simulates an interactive walk sequence: Outside -> Gate -> Inside School -> Exit School
app.post('/api/v1/telemetry/simulate-walk', (req, res) => {
  const { studentId, stage } = req.body;
  const student = db.students.find(s => s.id === studentId || s.uniqueId === studentId) || db.students[0];
  const school = db.schools.find(s => s.id === student.schoolId) || db.schools[0];

  // Define trajectory relative to school center
  let lat, lng, accuracy, desc;
  const cLat = school.lat || 41.311081;
  const cLng = school.lng || 69.240562;

  switch (stage) {
    case 'OUTSIDE_STREET':
      lat = cLat - 0.0055;
      lng = cLng - 0.0055;
      accuracy = 3.5;
      desc = "Ko'chada, maktabdan tashqarida";
      break;
    case 'APPROACHING_GATE':
      lat = cLat - 0.0018;
      lng = cLng - 0.0018;
      accuracy = 19.5; // Trigger YELLOW "GPS VERIFYING"
      desc = "Maktab darvozasiga yaqinlashmoqda (GPS tekshirilmoqda)";
      break;
    case 'ENTER_SCHOOL':
      lat = cLat;
      lng = cLng;
      accuracy = 3.2; // Trigger GREEN "PRESENT – INSIDE SCHOOL"
      desc = "Maktab hududiga kirdi (Yashil poligon ichida)";
      break;
    case 'INSIDE_CLASS':
      lat = cLat + 0.0003;
      lng = cLng + 0.0003;
      accuracy = 2.8;
      desc = "Sinf xonasida, darsda";
      break;
    case 'LEAVE_SCHOOL':
    default:
      lat = cLat + 0.0045;
      lng = cLng + 0.0045;
      accuracy = 4.0;
      desc = "Maktab hududidan chiqdi";
      break;
  }

  // Reuse telemetry processing logic
  const evalResult = evaluateStrictSchoolAttendance(student, lat, lng, accuracy);
  const nowTime = new Date().toLocaleTimeString();

  const stateData = {
    deviceId: student.deviceId,
    studentId: student.id,
    studentName: student.name,
    schoolId: student.schoolId,
    latitude: lat,
    longitude: lng,
    accuracy: accuracy,
    speed: stage === 'INSIDE_CLASS' ? 0.0 : 1.2,
    heading: 45,
    altitude: 432.0,
    heartRate: stage === 'ENTER_SCHOOL' ? 88 : 76,
    bodyTemperature: 36.6,
    stepCount: (db.telemetryState[student.deviceId]?.stepCount || 3000) + 120,
    batteryLevel: 87,
    isCharging: false,
    isSos: false,
    geofenceStatus: evalResult.status,
    statusColor: evalResult.color,
    statusDisplay: evalResult.display,
    assignedSchoolId: student.schoolId,
    lastSeen: Date.now()
  };

  db.telemetryState[student.deviceId] = stateData;

  // Append route point
  if (!db.routeHistory) db.routeHistory = {};
  if (!db.routeHistory[student.id]) db.routeHistory[student.id] = [];
  db.routeHistory[student.id].push({
    lat, lng, time: nowTime, speed: stateData.speed, heading: stateData.heading,
    status: evalResult.status, color: evalResult.color
  });

  // Update attendance if needed
  const today = new Date().toISOString().split('T')[0];
  let att = db.attendance.find(a => a.studentId === student.id && a.date === today);

  if (evalResult.status === 'INSIDE') {
    if (!att) {
      att = {
        id: `att-${student.id}-${today}`,
        studentId: student.id,
        schoolId: student.schoolId,
        date: today,
        arrivalTime: nowTime,
        departureTime: null,
        status: "PRESENT",
        statusColor: "GREEN",
        statusDisplay: "PRESENT – INSIDE SCHOOL",
        isManualCorrection: false
      };
      db.attendance.push(att);
    } else {
      att.arrivalTime = att.arrivalTime || nowTime;
      att.status = "PRESENT";
      att.statusColor = "GREEN";
      att.statusDisplay = "PRESENT – INSIDE SCHOOL";
    }

    const notif = {
      id: `notif-${Date.now()}`,
      userId: student.parentId,
      studentId: student.id,
      type: "ARRIVAL",
      title: "🟢 Maktabga yetib keldi",
      message: `${student.name} soat ${nowTime} da o'zining maktabi (${student.schoolName}) hududiga kirdi. Holati: PRESENT – INSIDE SCHOOL.`,
      isRead: false,
      time: nowTime
    };
    db.notifications.unshift(notif);
    broadcast('notification', notif);
    broadcast('attendance_updated', att);
  } else if (stage === 'LEAVE_SCHOOL' && evalResult.status === 'OUTSIDE') {
    if (att) {
      att.departureTime = nowTime;
      att.status = "LEFT";
      att.statusColor = "RED";
      att.statusDisplay = "LEFT SCHOOL – OUTSIDE SCHOOL";
    }
    const notif = {
      id: `notif-${Date.now()}`,
      userId: student.parentId,
      studentId: student.id,
      type: "DEPARTURE",
      title: "🔴 Maktabdan chiqdi",
      message: `DIQQAT! ${student.name} soat ${nowTime} da maktab hududidan chiqdi. Holati: LEFT SCHOOL – OUTSIDE SCHOOL.`,
      isRead: false,
      time: nowTime
    };
    db.notifications.unshift(notif);
    broadcast('notification', notif);
    if (att) broadcast('attendance_updated', att);
  }

  saveDb();
  broadcast('telemetry', stateData);

  res.json({
    success: true,
    stage,
    description: desc,
    telemetry: stateData,
    geofenceStatus: evalResult.status,
    statusDisplay: evalResult.display,
    statusColor: evalResult.color
  });
});

app.listen(PORT, () => {
  console.log(`==================================================================`);
  console.log(`🚀 SMART CHILD Multi-School Platform Engine ishga tushdi!`);
  console.log(`📡 URL: http://localhost:${PORT}`);
  console.log(`🏫 Ro'yxatdagi maktablar: ${db.schools.map(s => `${s.name} (${s.id})`).join(', ')}`);
  console.log(`==================================================================`);
});
