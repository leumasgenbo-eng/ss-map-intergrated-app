-- COMPREHENSIVE SCHOOL MANAGEMENT SYSTEM SCHEMA
-- Supports all three projects: comprehensive management, exercises/assessments, and mock examinations

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. SCHOOL IDENTITY & GLOBAL SETTINGS
-- This table stores all the "Particulars" you want editable on reports
CREATE TABLE school_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_name TEXT DEFAULT 'UNITED BAYLOR ACADEMY',
    email TEXT DEFAULT 'info@unitedbaylor.edu.gh',
    telephone TEXT DEFAULT '+233 24 000 0000',
    logo_url TEXT,
    academic_year TEXT DEFAULT '2024/2025',
    current_term INTEGER DEFAULT 1,
    mock_series TEXT DEFAULT 'MOCK TWO',
    exam_start DATE,
    exam_end DATE,
    total_attendance_days INTEGER DEFAULT 85,
    -- Flexible configurations stored as JSONB for React state parity
    grading_remarks JSONB DEFAULT '{"A1": "Excellent", "B2": "Very Good", "B3": "Good", "C4": "Credit", "C5": "Credit", "C6": "Credit", "D7": "Pass", "E8": "Pass", "F9": "Fail"}'::jsonb,
    popout_lists JSONB,
    module_permissions JSONB DEFAULT '{}'::jsonb,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. STAFF / USER PROFILES
-- Links to Supabase Auth users
CREATE TABLE profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    full_name TEXT NOT NULL,
    role TEXT CHECK (role IN ('Administrator', 'Facilitator')) DEFAULT 'Facilitator',
    department TEXT, -- 'D&N', 'JHS', etc.
    id_number TEXT UNIQUE,
    contact_phone TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. STUDENT REGISTRY
CREATE TABLE students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    serial_id TEXT UNIQUE, -- e.g., UBA-B1-001
    first_name TEXT NOT NULL,
    surname TEXT NOT NULL,
    other_names TEXT,
    dob DATE,
    sex TEXT CHECK (sex IN ('Male', 'Female')),
    current_class TEXT NOT NULL,
    status TEXT DEFAULT 'Admitted', -- 'Pending', 'Admitted', 'Withdrawn'
    lives_with TEXT,
    special_needs_detail TEXT,
    -- JSONB storage for parent/guardian info to match React types
    father_info JSONB,
    mother_info JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. ACADEMIC RECORDS (SCORES)
CREATE TABLE assessment_scores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    subject_name TEXT NOT NULL,
    academic_year TEXT NOT NULL,
    term INTEGER NOT NULL,
    section_a NUMERIC DEFAULT 0, -- CAT 1 / Daily Avg
    section_b NUMERIC DEFAULT 0, -- CAT 3 / Observation
    section_c NUMERIC DEFAULT 0, -- CAT 2 (Group)
    total_score NUMERIC DEFAULT 0,
    facilitator_remark TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(student_id, subject_name, academic_year, term)
);

-- 6. ATTENDANCE REGISTRY
CREATE TABLE attendance_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    status TEXT CHECK (status IN ('P', 'A', 'W/P')),
    term INTEGER NOT NULL,
    academic_year TEXT NOT NULL,
    UNIQUE(student_id, date)
);

-- 7. DAILY EXERCISES & ASSESSMENTS (for exercisesassessmentandreportingsimpler-2)
CREATE TABLE daily_exercises (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    class_name TEXT NOT NULL,
    subject TEXT NOT NULL,
    facilitator TEXT NOT NULL,
    week INTEGER NOT NULL,
    type TEXT CHECK (type IN ('Classwork', 'Homework', 'Project')),
    bloom_taxonomy TEXT[],
    pupil_status JSONB DEFAULT '{}'::jsonb, -- Record<string, 'Marked' | 'Defaulter' | 'Missing'>
    pupil_scores JSONB DEFAULT '{}'::jsonb, -- Record<string, number>
    defaulter_reasons JSONB, -- Record<string, string>
    is_disciplinary_referral BOOLEAN DEFAULT false,
    max_score NUMERIC DEFAULT 0,
    has_test_item_prepared BOOLEAN DEFAULT false,
    handwriting_rating INTEGER CHECK (handwriting_rating >= 1 AND handwriting_rating <= 5),
    clarity_rating INTEGER CHECK (clarity_rating >= 1 AND clarity_rating <= 5),
    appearance_rating INTEGER CHECK (appearance_rating >= 1 AND appearance_rating <= 5),
    is_late_submission BOOLEAN DEFAULT false,
    indicator TEXT,
    strand TEXT,
    sub_strand TEXT,
    spelling_count INTEGER,
    confirmed_with_pupil_id TEXT,
    date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. TIMETABLES & CALENDARS (JSON Storage)
CREATE TABLE academic_calendar (
    term INTEGER PRIMARY KEY,
    weeks JSONB -- Array of AcademicCalendarWeek objects
);

CREATE TABLE timetables (
    class_name TEXT PRIMARY KEY,
    schedule JSONB -- Record<Day, string[]> or specialized DaycareTimeTableSlot
);

-- 9. MOCK EXAMINATION SPECIFIC TABLES (for mock examination analytics)
CREATE TABLE mock_scores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    mock_series TEXT NOT NULL,
    scores JSONB DEFAULT '{}'::jsonb, -- Record<string, number>
    sba_scores JSONB DEFAULT '{}'::jsonb, -- Record<string, number>
    exam_sub_scores JSONB DEFAULT '{}'::jsonb, -- Record<string, ExamSubScore>
    facilitator_remarks JSONB DEFAULT '{}'::jsonb, -- Record<string, string>
    observations JSONB, -- {facilitator: string, invigilator: string, examiner: string}
    attendance INTEGER,
    conduct_remark TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(student_id, mock_series)
);

CREATE TABLE mock_series_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    mock_series TEXT NOT NULL,
    aggregate NUMERIC,
    rank INTEGER,
    date DATE NOT NULL,
    time TIME,
    review_status TEXT DEFAULT 'pending' CHECK (review_status IN ('pending', 'complete')),
    is_approved BOOLEAN DEFAULT false,
    facilitator_snapshot JSONB, -- Record<string, string>
    subject_performance_summary JSONB, -- Record<string, {mean: number, grade: string}>
    sub_scores JSONB, -- Record<string, ExamSubScore>
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(student_id, mock_series)
);

CREATE TABLE bece_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    year TEXT NOT NULL,
    grades JSONB DEFAULT '{}'::jsonb, -- Record<string, number> Subject -> Grade (1-9)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(student_id, year)
);

CREATE TABLE institutional_performance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mock_series TEXT NOT NULL,
    avg_composite NUMERIC,
    avg_aggregate NUMERIC,
    avg_objective NUMERIC,
    avg_theory NUMERIC,
    student_count INTEGER,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE remark_telemetry (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mock_series TEXT NOT NULL,
    subject_remarks JSONB DEFAULT '{}'::jsonb, -- Record<string, RemarkMetric[]>
    conduct_remarks JSONB DEFAULT '[]'::jsonb, -- RemarkMetric[]
    facilitator_notes JSONB DEFAULT '[]'::jsonb, -- RemarkMetric[]
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE verification_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    subject TEXT NOT NULL,
    verified_by TEXT NOT NULL,
    date DATE NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    confirmed_scripts TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. COMPREHENSIVE MANAGEMENT TABLES (for smap-huge-project-3)
CREATE TABLE staff_compliance_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    staff_id TEXT NOT NULL,
    staff_name TEXT NOT NULL,
    date DATE NOT NULL,
    day TEXT NOT NULL,
    period TEXT NOT NULL,
    subject TEXT NOT NULL,
    class_name TEXT NOT NULL,
    presence_status TEXT CHECK (presence_status IN ('Present', 'Late', 'Closed Early', 'Interrupted', 'Absent')),
    time_in TIME,
    time_used INTEGER,
    lesson_content TEXT,
    interruption_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE material_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    item_name TEXT NOT NULL,
    category TEXT NOT NULL,
    purpose TEXT NOT NULL,
    quantity_requested INTEGER NOT NULL,
    date_requested DATE NOT NULL,
    date_required DATE NOT NULL,
    usage_duration TEXT NOT NULL,
    priority TEXT NOT NULL,
    remarks TEXT,
    staff_id TEXT NOT NULL,
    staff_name TEXT NOT NULL,
    status TEXT DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Issued', 'Declined')),
    date_issued DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE classroom_inventory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    block TEXT NOT NULL,
    room_number TEXT NOT NULL,
    school_class TEXT NOT NULL,
    inspection_date DATE NOT NULL,
    items JSONB DEFAULT '{}'::jsonb, -- Record<string, {status: string, condition: string}>
    damaged_missing_notes TEXT,
    priority TEXT,
    comments TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE announcements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    category TEXT CHECK (category IN ('Urgent', 'General', 'Academic', 'Financial', 'Event')),
    content TEXT NOT NULL,
    date_created TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    target_audience TEXT CHECK (target_audience IN ('Parents', 'Staff', 'All', 'Specific Class')),
    target_class TEXT,
    status TEXT DEFAULT 'Draft' CHECK (status IN ('Draft', 'Sent', 'Scheduled')),
    platforms TEXT[] DEFAULT '{}',
    author_name TEXT NOT NULL
);

CREATE TABLE special_disciplinary_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    student_name TEXT NOT NULL,
    type TEXT NOT NULL,
    date DATE NOT NULL,
    repeat_count INTEGER DEFAULT 0,
    correction1 TEXT,
    correction2 TEXT,
    correction3 TEXT,
    class_name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 11. INITIAL SEED DATA
-- Create the initial settings row
INSERT INTO school_settings (school_name, academic_year, current_term)
VALUES ('UNITED BAYLOR ACADEMY', '2024/2025', 1);

-- 12. ENABLE ROW LEVEL SECURITY (Optional but recommended for Supabase)
ALTER TABLE school_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE mock_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE mock_series_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE bece_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE institutional_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE remark_telemetry ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_compliance_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE material_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE classroom_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE special_disciplinary_logs ENABLE ROW LEVEL SECURITY;

-- Simple Policy: Authenticated users can read/write everything (for initial dev)
CREATE POLICY "Allow all to authenticated" ON school_settings FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all to authenticated" ON profiles FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all to authenticated" ON students FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all to authenticated" ON assessment_scores FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all to authenticated" ON attendance_logs FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all to authenticated" ON daily_exercises FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all to authenticated" ON mock_scores FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all to authenticated" ON mock_series_records FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all to authenticated" ON bece_results FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all to authenticated" ON institutional_performance FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all to authenticated" ON remark_telemetry FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all to authenticated" ON verification_logs FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all to authenticated" ON staff_compliance_logs FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all to authenticated" ON material_requests FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all to authenticated" ON classroom_inventory FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all to authenticated" ON announcements FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all to authenticated" ON special_disciplinary_logs FOR ALL TO authenticated USING (true);