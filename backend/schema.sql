-- ====================================================================
-- SMART CHILD: Production-Grade PostgreSQL + PostGIS Database Architecture
-- Child Safety, Multi-School GPS Geofencing, Health Monitoring & Smart Attendance
-- ====================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
-- CREATE EXTENSION IF NOT EXISTS "postgis"; -- Enable if PostGIS is installed

-- 1. SCHOOLS TABLE (Section 1 & 13)
CREATE TABLE IF NOT EXISTS schools (
    id VARCHAR(50) PRIMARY KEY, -- e.g. "SCH001", "SCH002"
    geofence_id VARCHAR(50) UNIQUE NOT NULL, -- e.g. "GEO001"
    name VARCHAR(255) NOT NULL,
    name_ru VARCHAR(255),
    name_en VARCHAR(255),
    address TEXT NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    geofence_polygon JSONB NOT NULL, -- Array of [lat, lng] coordinates (4, 5, 6+ points)
    school_start_time TIME NOT NULL DEFAULT '08:30:00',
    school_end_time TIME NOT NULL DEFAULT '13:30:00',
    late_threshold_minutes INT NOT NULL DEFAULT 15,
    admin_user_id UUID,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. SCHOOL GEOFENCES HISTORY & REVISIONS (Section 2)
CREATE TABLE IF NOT EXISTS school_geofences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    geofence_id VARCHAR(50) NOT NULL,
    school_id VARCHAR(50) NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    boundary_points JSONB NOT NULL, -- Array of [lat, lng]
    point_count INT NOT NULL,
    drawn_by UUID,
    version INT NOT NULL DEFAULT 1,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. USERS (SUPER_ADMIN, SCHOOL_ADMIN, TEACHER, PARENT)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(30) NOT NULL CHECK (role IN ('SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER', 'PARENT')),
    school_id VARCHAR(50) REFERENCES schools(id) ON DELETE SET NULL,
    preferred_language VARCHAR(5) NOT NULL DEFAULT 'uz', -- 'uz', 'ru', 'en'
    fcm_device_token TEXT, -- Firebase Cloud Messaging push token
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. CLASSROOMS
CREATE TABLE IF NOT EXISTS classrooms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id VARCHAR(50) NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL, -- e.g. "5-B", "9-A"
    grade_level INT NOT NULL DEFAULT 5,
    teacher_id UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. STUDENTS (Section 3 & 4: Strict School Connection)
CREATE TABLE IF NOT EXISTS students (
    id VARCHAR(50) PRIMARY KEY, -- Unique Student ID: e.g. "10001", "10002"
    unique_student_id VARCHAR(50) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    school_id VARCHAR(50) NOT NULL REFERENCES schools(id) ON DELETE RESTRICT, -- STRICT SCHOOL ATTACHMENT
    classroom_id UUID REFERENCES classrooms(id) ON DELETE SET NULL,
    class_name VARCHAR(50) NOT NULL DEFAULT '5-B',
    parent_id UUID REFERENCES users(id) ON DELETE SET NULL,
    parent_phone VARCHAR(50) NOT NULL,
    smartwatch_device_id VARCHAR(100) UNIQUE,
    photo_url TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE', -- 'ACTIVE', 'TRANSFERRED', 'INACTIVE'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_students_school ON students(school_id);
CREATE INDEX IF NOT EXISTS idx_students_parent ON students(parent_id);

-- 6. SMARTWATCH DEVICES (Section 7)
CREATE TABLE IF NOT EXISTS smartwatch_devices (
    device_id VARCHAR(100) PRIMARY KEY,
    student_id VARCHAR(50) UNIQUE REFERENCES students(id) ON DELETE SET NULL,
    model VARCHAR(100) DEFAULT 'Samsung Galaxy Watch5 Pro',
    firmware_version VARCHAR(50),
    battery_level INT DEFAULT 100,
    is_charging BOOLEAN DEFAULT FALSE,
    is_online BOOLEAN DEFAULT FALSE,
    last_ping_at TIMESTAMP WITH TIME ZONE,
    secret_token VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. GPS COORDINATES & TELEMETRY TIMESERIES
CREATE TABLE IF NOT EXISTS telemetry (
    id BIGSERIAL PRIMARY KEY,
    device_id VARCHAR(100) NOT NULL REFERENCES smartwatch_devices(device_id) ON DELETE CASCADE,
    student_id VARCHAR(50) NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    school_id VARCHAR(50) NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    accuracy DOUBLE PRECISION NOT NULL DEFAULT 4.0,
    speed DOUBLE PRECISION DEFAULT 0.0,
    heading DOUBLE PRECISION DEFAULT 0.0,
    altitude DOUBLE PRECISION DEFAULT 0.0,
    battery_level INT NOT NULL,
    is_sos BOOLEAN NOT NULL DEFAULT FALSE,
    geofence_status VARCHAR(20) NOT NULL DEFAULT 'OUTSIDE', -- 'INSIDE', 'OUTSIDE', 'UNKNOWN'
    status_display VARCHAR(50) NOT NULL DEFAULT 'LEFT SCHOOL – OUTSIDE SCHOOL',
    status_color VARCHAR(10) NOT NULL DEFAULT 'RED', -- 'GREEN', 'RED', 'YELLOW', 'GRAY'
    recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_telemetry_student_time ON telemetry(student_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_telemetry_device_time ON telemetry(device_id, recorded_at DESC);

-- 8. HEALTH MEASUREMENTS (Section 8: Actual Sensor Readings)
CREATE TABLE IF NOT EXISTS health_measurements (
    id BIGSERIAL PRIMARY KEY,
    student_id VARCHAR(50) NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    device_id VARCHAR(100) NOT NULL REFERENCES smartwatch_devices(device_id) ON DELETE CASCADE,
    heart_rate INT, -- BPM (actual sensor reading)
    body_temperature DOUBLE PRECISION, -- Celsius (actual hardware sensor if supported)
    step_count INT DEFAULT 0,
    is_abnormal BOOLEAN NOT NULL DEFAULT FALSE,
    alert_type VARCHAR(50), -- 'HIGH_BPM', 'LOW_BPM', 'HIGH_TEMP'
    recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_health_student_time ON health_measurements(student_id, recorded_at DESC);

-- 9. AUTOMATIC GPS SCHOOL ATTENDANCE (Section 5)
CREATE TABLE IF NOT EXISTS attendance_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id VARCHAR(50) NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    school_id VARCHAR(50) NOT NULL REFERENCES schools(id) ON DELETE RESTRICT,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    arrival_time TIME,
    departure_time TIME,
    status VARCHAR(30) NOT NULL CHECK (status IN ('PRESENT', 'LATE', 'ABSENT', 'LEFT', 'UNKNOWN', 'EXCUSED')),
    status_display VARCHAR(50) NOT NULL DEFAULT 'LEFT SCHOOL – OUTSIDE SCHOOL',
    status_color VARCHAR(10) NOT NULL DEFAULT 'RED', -- 'GREEN', 'RED', 'YELLOW', 'GRAY'
    arrival_latitude DOUBLE PRECISION,
    arrival_longitude DOUBLE PRECISION,
    departure_latitude DOUBLE PRECISION,
    departure_longitude DOUBLE PRECISION,
    is_manual_correction BOOLEAN NOT NULL DEFAULT FALSE,
    corrected_by UUID REFERENCES users(id) ON DELETE SET NULL,
    correction_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_student_daily_attendance UNIQUE(student_id, date)
);

CREATE INDEX IF NOT EXISTS idx_attendance_school_date ON attendance_records(school_id, date);

-- 10. ENTRY AND EXIT GEOFENCE EVENTS (Section 5 & 13)
CREATE TABLE IF NOT EXISTS entry_exit_events (
    id BIGSERIAL PRIMARY KEY,
    student_id VARCHAR(50) NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    school_id VARCHAR(50) NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    event_type VARCHAR(10) NOT NULL CHECK (event_type IN ('ENTER', 'EXIT')),
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    accuracy DOUBLE PRECISION NOT NULL,
    event_timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 11. SCHOOL TRANSFER HISTORY (Section 4 & 13)
CREATE TABLE IF NOT EXISTS school_transfers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id VARCHAR(50) NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    from_school_id VARCHAR(50) NOT NULL REFERENCES schools(id) ON DELETE RESTRICT,
    to_school_id VARCHAR(50) NOT NULL REFERENCES schools(id) ON DELETE RESTRICT,
    requested_by UUID NOT NULL REFERENCES users(id),
    approved_by UUID REFERENCES users(id),
    status VARCHAR(20) NOT NULL DEFAULT 'APPROVED' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
    reason TEXT,
    transfer_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 12. NOTIFICATIONS & ALERTS (Section 9: Firebase Cloud Messaging Integration)
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    student_id VARCHAR(50) REFERENCES students(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- 'ARRIVAL', 'DEPARTURE', 'SAFE_ZONE_EXIT', 'SOS', 'LOW_BATTERY', 'DISCONNECT', 'HEALTH_ALERT'
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    fcm_message_id VARCHAR(255),
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, is_read, created_at DESC);

-- 13. SAFE ZONES & RESTRICTED AREAS (Configured by Parents)
CREATE TABLE IF NOT EXISTS safe_zones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id VARCHAR(50) NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    zone_type VARCHAR(20) NOT NULL DEFAULT 'SAFE' CHECK (zone_type IN ('SAFE', 'RESTRICTED')),
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    radius_meters DOUBLE PRECISION NOT NULL DEFAULT 150.0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 14. AUDIT LOGS (Section 10, 13 & 15: Security & Privacy Compliance)
CREATE TABLE IF NOT EXISTS audit_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    target_resource VARCHAR(100) NOT NULL,
    details JSONB,
    ip_address VARCHAR(50),
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 15. PARENT-CHILD CONNECTIONS (Section 13)
CREATE TABLE IF NOT EXISTS parent_child_connections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    parent_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    student_id VARCHAR(50) NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    relationship_type VARCHAR(50) NOT NULL DEFAULT 'PARENT', -- 'FATHER', 'MOTHER', 'GUARDIAN'
    is_primary_contact BOOLEAN NOT NULL DEFAULT TRUE,
    verified_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_parent_child_pair UNIQUE(parent_user_id, student_id)
);

-- 16. DEVICE CONNECTIONS & PAIRING AUDIT (Section 7 & 13)
CREATE TABLE IF NOT EXISTS device_connections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_id VARCHAR(100) NOT NULL REFERENCES smartwatch_devices(device_id) ON DELETE CASCADE,
    student_id VARCHAR(50) NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    paired_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    paired_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    unpaired_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

