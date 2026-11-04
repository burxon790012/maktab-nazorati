# 🛡️ SMART CHILD — Complete GPS Child Safety, Health Monitoring & Smart School Attendance Platform

**SMART CHILD** is a complete, professional, modern, and fully functional multi-school platform connecting parents, children, GPS smartwatches (Samsung Galaxy Watch5 Pro / Wear OS), teachers, school administrators, and a Super Admin in one intelligent system.

---

## 🌟 System Architecture

```
 ┌─────────────────────────────────────────────────────────────────────────────┐
 │                 🏢 1. SUPER ADMIN & MULTI-SCHOOL DASHBOARD                  │
 │  - Unlimited Schools Registration (Unique School IDs: SCH001, SCH002, ...)  │
 │  - Interactive Google Maps / Leaflet Green GPS Territory Boundary Drawing   │
 │  - School Administrators & Teachers Management, User Roles & Audit Logs     │
 └──────────────────────────────────────┬──────────────────────────────────────┘
                                        │
                                        ▼
 ┌─────────────────────────────────────────────────────────────────────────────┐
 │                🌐 2. PRODUCTION MULTI-SCHOOL BACKEND ENGINE                 │
 │                  (Node.js server.js & Python server.py)                     │
 │  - Ray-Casting Point-in-Polygon Geofencing (4, 5, 6+ Point Coordinates)     │
 │  - Strict School-Student Attachment (Foreign School Anti-Spoofing Check)    │
 │  - Real-Time Accuracy Filtering (±18m stabilization & UNKNOWN offline state)│
 │  - Auto Attendance Recording (Exact Arrival & Departure Timestamps)         │
 │  - Push Notifications via FCM (Arrival, Departure, Low Battery, SOS)        │
 │  - PostgreSQL + PostGIS Scalable Architecture (schema.sql)                  │
 └───────────────────┬───────────────────────────────┬─────────────────────────┘
                     │                               │
                     ▼                               ▼
 ┌───────────────────────────────────────┐ ┌───────────────────────────────────┐
 │   ⌚ 3. WEAR OS SMARTWATCH CLIENT     │ │   📱 4. PARENT MOBILE PORTAL      │
 │    (Samsung Galaxy Watch5 Pro)        │ │  (Flutter parent-app & Web Portal)│
 │  - FusedLocationProviderClient (GPS)  │ │  - Real-time GPS Location on Map  │
 │  - Foreground Tracking Service        │ │  - 🟢 PRESENT – INSIDE SCHOOL     │
 │  - 3-Second Hold Large SOS Button     │ │  - 🔴 LEFT SCHOOL – OUTSIDE       │
 │  - Offline Buffering via Room DB      │ │  - Route Playback & Breadcrumbs   │
 │  - Heart Rate (BPM) & Temperature     │ │  - Heart Rate ECG & Temp Vitals   │
 │  - Battery Level & Sync Optimization  │ │  - Instant Push & Alarm Sirens    │
 └───────────────────────────────────────┘ └───────────────────────────────────┘
```

---

## 📋 Comprehensive Feature Breakdown (All 17 Specifications)

### 1. 🏢 Super Admin Panel
* Register and manage unlimited schools (`SCH001`, `SCH002`, `SCH003`, `SCH004`...).
* Automatically assign unique **School ID** and **Geofence ID** (`GEO001`, `GEO002`...).
* Manage school administrators, teachers, and assign permissions.
* Interactive system-wide Google Maps / Leaflet map displaying all school territories and student clusters.
* Real-time platform KPI metrics: Overall Attendance Rate, Total Students inside/outside, Active Smartwatches, and Emergency SOS logs.

### 2. ✏️ Interactive School GPS Boundary Drawing System
* Open interactive map with search input (search school location via geocoder).
* Click on the map to draw an exact green boundary around the school territory (4, 5, 6, 8 or more GPS points).
* Real-time green dashed lines automatically connect all points into a closed polygon.
* Coordinates of every point (`latitude`, `longitude`) are calculated and previewed live.
* Click **"Chegarani Saqlash" (Save Boundary)** to permanently commit the polygon to the database under the school's unique School ID and Geofence ID.
* Authorized administrators can edit, redraw, or clear the boundary anytime.

### 3. 👥 Student Registration & School Assignment
* Register students with:
  * Unique Student ID (`10001`, `10002`, `10003`...);
  * Full name;
  * School ID assignment;
  * Class and grade (e.g. `5-B`, `9-A`);
  * Parent phone number and parent account linkage;
  * Registered smartwatch Device ID (`watch-5pro-01`).
* **Bulk Import:** Excel and CSV upload tool to import hundreds of students at once.
* **Important:** All students assigned to `SCH001` automatically and strictly inherit the GPS polygon of `SCH001`.

### 4. 🔒 Strict School and Student Connection
* The engine evaluates: `Student ID` + `School ID` + `Smartwatch Device ID` + `GPS Coordinates` + `Assigned School Polygon`.
* **Strict Rule:** If Ali belongs to School No. 1 (`SCH001`) and enters School No. 2 (`SCH002`), the system strictly will **NOT** mark him present at School No. 2! It displays: `🔴 OUTSIDE (Detected near School #2, but assigned to School #1)`.
* Only entering his own assigned school's polygon generates official attendance.
* School transfers require authorized administrator approval with documented reason and audit log.

### 5. 🟢🔴 Automatic GPS School Attendance
* Student enters assigned polygon:
  * Status changes to **🟢 GREEN — "PRESENT – INSIDE SCHOOL"**;
  * Exact arrival time recorded automatically;
  * Immediate parent push notification and arrival chime sent.
* Student leaves assigned polygon:
  * Status changes to **🔴 RED — "LEFT SCHOOL – OUTSIDE SCHOOL"**;
  * Exact departure time recorded;
  * Immediate parent warning notification dispatched.
* Accuracy verification: If GPS accuracy is poor (>18m), status shows **🟡 "GPS VERIFYING"** to prevent false triggers.
* If GPS is unavailable, shows **⚪ "UNKNOWN"** instead of wrongly marking absent.

### 6. 📱 Parent Mobile Application (Flutter & Web Simulator)
* Real-time GPS location tracking on map with custom avatar marker and pulsing halo.
* Visual school boundary polygon in green.
* Inside / outside status indicator.
* **Interactive Route History Playback:** Scrub through the day's timeline (07:55 Home -> 08:10 Street -> 08:18 Inside School) with GPS breadcrumb trail!
* Health vitals: BPM, body temperature, battery percentage, step counter.
* Safe-zone alerts and emergency SOS alarm sirens.

### 7. ⌚ GPS Smartwatch Integration (Samsung Galaxy Watch5 Pro)
* Real-time GPS location telemetry.
* Heart rate monitoring in BPM.
* Body temperature monitoring (if supported by hardware sensors).
* 3-second hold large emergency SOS button with haptic feedback.
* Battery percentage monitoring with low-power warning (<20%).
* Offline buffering via Android Room DB: stores points when disconnected from internet and syncs automatically upon reconnection.

### 8. ❤️ Child Health Monitoring
* Current heart rate and dynamic heartbeat ECG animation.
* Body temperature gauge.
* Health alerts based on age-appropriate medical thresholds:
  * Normal: 60 - 100 BPM
  * High Alert: > 120 BPM
  * Low Alert: < 55 BPM
  * Normal Temp: 36.1 - 37.2 °C
* **Prominent Medical Disclaimer Banner:** Smartwatch readings are for child safety and wellness monitoring only and are not a medical diagnosis.

### 9. 🔔 Instant Parent Notifications
* Push notifications via Firebase Cloud Messaging (FCM) architecture.
* Real-time Web Audio API sound effects:
  * High-pitched pleasant chime on arrival.
  * Warning alert on departure.
  * Loud siren alarm on emergency SOS.
* Notification drawer with unread counter and test push dispatcher.

### 10. 👩‍🏫 Teacher Dashboard
* Filter by assigned class (`5-B`, `9-A`, `7-A`).
* Search students by Student ID or Name.
* Real-time attendance grid with green and red statuses.
* Identifies late arrivals (after 08:30).
* Attendance correction modal with required teacher reason and security audit trail.
* Teachers cannot modify GPS boundaries (read-only for security).

### 11. 🏫 School Administrator Dashboard
* Draw, edit, and update school GPS polygon boundaries.
* Register students individually and via bulk CSV/Excel import.
* Daily, weekly, and monthly attendance reports with Excel (CSV) and printable PDF export.
* School transfer approval workflow.

### 12. 🗺️ Live Map & Student Status Indicators
* 🟢 **GREEN:** Inside assigned school territory ("PRESENT – INSIDE SCHOOL").
* 🔴 **RED:** Outside school territory ("LEFT SCHOOL – OUTSIDE SCHOOL").
* 🟡 **YELLOW:** GPS verification in progress (accuracy > 18m).
* ⚪ **GRAY:** Offline / unknown GPS signal.
* **Auto-Walk GPS Simulator:** One-click live demonstration of walking into and out of school.

### 13. 🗄️ Database & Backend Architecture
* Complete PostgreSQL + PostGIS database schema in `backend/schema.sql` covering all 16 core entities:
  1. `users` (Super Admin, School Admin, Teacher, Parent)
  2. `schools`
  3. `school_geofences`
  4. `classrooms`
  5. `students`
  6. `smartwatch_devices`
  7. `telemetry`
  8. `health_measurements`
  9. `attendance_records`
  10. `entry_exit_events`
  11. `school_transfers`
  12. `notifications`
  13. `safe_zones`
  14. `audit_logs`
  15. `parent_child_connections`
  16. `device_connections`

### 14. 🌐 Multilingual & Multi-Theme Support (Section 16)
* 🇺🇿 **Uzbek (O'zbekcha)**
* 🇷🇺 **Russian (Русский)**
* 🇬🇧 **English (English)**
* Instant live language switching across every tab, modal, badge, button, and toast.
* Modern Dark Mode and Light Mode with high-contrast palette.

---

## 🚀 How to Run the Platform

### 1. Web Dashboard & Server (Node.js or Python)

#### Option A: Node.js Engine (Recommended)
```bash
cd backend
npm install
node server.js
```

#### Production Database Configuration & Render Deployment
> [!IMPORTANT]
> **Render.com Ephemeral Disk Notice**: Render's free web service disk is ephemeral, meaning any local files (like SQLite files) will be wiped on restarts or redeployments. Therefore, **production environments must use PostgreSQL**.

To configure the production database:
1. Set the following environment variables:
   - `DB_CLIENT=pg`
   - `DATABASE_URL=postgres://user:password@hostname:5432/dbname?ssl=true`
   - `JWT_SECRET=your-production-crypto-random-jwt-secret`
   - `RETENTION_DAYS=30` (automatically cleans up location points older than 30 days)
2. Database migrations are executed automatically on server startup (`knex.migrate.latest()`) before the server opens its listening port.
3. For local development, Knex automatically defaults to `better-sqlite3` when `DATABASE_URL` is omitted.

#### Docker Deployment
The backend Docker image uses `node:22-alpine` with production-only dependencies:
```bash
cd backend
docker build -t maktab-watch-backend .
docker run -p 3000:3000 -e DB_CLIENT=pg -e DATABASE_URL="postgres://..." maktab-watch-backend
```

#### Option B: Python 3 Engine (Standard Library, zero external pip dependencies needed)
```bash
cd backend
python server.py
```

Open your browser at: **`http://localhost:3000`**

### 2. Parent Mobile App (Flutter for Android & iOS)
```bash
cd parent-app
flutter pub get
flutter run
# Generate production APK:
flutter build apk --release
```

### 3. Wear OS Smartwatch App (Samsung Galaxy Watch5 Pro)
1. Open **Android Studio**.
2. Select **File -> Open...** and choose `maktab-nazorati/watch-app`.
3. Gradle syncs automatically.
4. Connect Samsung Galaxy Watch via Wireless Debugging (ADB).
5. Click **Run (▶)** to install directly on the smartwatch.

---

## 🔒 Security, Compliance & Child Privacy (Section 15)
* Parental consent verification workflow.
* Role-based access control (RBAC).
* Strict audit logging for all manual corrections and boundary edits.
* Protected health records with explicit medical disclaimer.

