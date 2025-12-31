-- =====================================================
-- Content Localization & AI Tutorial Platform
-- Phase 1: Initial Schema
-- =====================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_cron";

-- =====================================================
-- ENUMS
-- =====================================================

-- User roles for RBAC
CREATE TYPE user_role AS ENUM ('admin', 'manager', 'ctv');

-- CTV ranking system (determines concurrent job limits)
CREATE TYPE user_rank AS ENUM ('newbie', 'bronze', 'silver', 'gold', 'platinum');

-- Job lifecycle status
CREATE TYPE job_status AS ENUM (
    'available',   -- Open for CTVs to claim
    'locked',      -- Claimed by a CTV, work in progress
    'submitted',   -- CTV submitted work, awaiting review
    'approved',    -- Manager approved, pending payout
    'rejected',    -- Manager rejected, needs revision
    'disputed',    -- Under dispute resolution
    'completed',   -- Fully completed and paid
    'cancelled'    -- Job cancelled by manager/admin
);

-- Complexity levels for pricing
CREATE TYPE complexity_level AS ENUM ('easy', 'medium', 'hard', 'expert');

-- =====================================================
-- PROFILES TABLE
-- Linked to Supabase auth.users
-- =====================================================

CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Basic info
    full_name TEXT,
    avatar_url TEXT,
    phone TEXT,
    
    -- RBAC
    role user_role NOT NULL DEFAULT 'ctv',
    
    -- CTV-specific fields
    rank user_rank NOT NULL DEFAULT 'newbie',
    credit_score INTEGER NOT NULL DEFAULT 100 CHECK (credit_score >= 0 AND credit_score <= 200),
    
    -- Financial
    balance DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    total_earned DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    
    -- Legal compliance
    agreed_to_terms BOOLEAN NOT NULL DEFAULT FALSE,
    terms_agreed_at TIMESTAMPTZ,
    liability_waiver_signed BOOLEAN NOT NULL DEFAULT FALSE,
    waiver_signed_at TIMESTAMPTZ,
    
    -- Metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- JOBS TABLE
-- Core job listings with dynamic pricing & AI metadata
-- =====================================================

CREATE TABLE jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Basic job info
    title TEXT NOT NULL,
    description TEXT,
    source_url TEXT,  -- Original Chinese content URL
    
    -- Content details
    word_count INTEGER NOT NULL DEFAULT 0,
    video_duration_seconds INTEGER NOT NULL DEFAULT 0,
    is_re_record_required BOOLEAN NOT NULL DEFAULT TRUE,  -- Must create derivative work
    complexity complexity_level NOT NULL DEFAULT 'medium',
    
    -- Dynamic Pricing (JSONB for flexibility)
    pricing_data JSONB NOT NULL DEFAULT '{
        "word_count": 0,
        "rate_per_word": 0.05,
        "video_duration_minutes": 0,
        "rate_per_minute": 5.00,
        "complexity_multiplier": 1.0,
        "re_record_bonus": 0,
        "base_price": 0,
        "final_price": 0
    }'::jsonb,
    
    -- AI-specific metadata (CRITICAL for AI tutorial content)
    ai_metadata JSONB NOT NULL DEFAULT '{
        "prompt_source": "",
        "prompt_translated": "",
        "model_links": [],
        "hardware_requirements": "",
        "ai_tools_used": [],
        "tutorial_type": "",
        "difficulty_level": ""
    }'::jsonb,
    
    -- Workflow status
    status job_status NOT NULL DEFAULT 'available',
    
    -- Assignment tracking
    created_by UUID NOT NULL REFERENCES profiles(id),
    locked_by UUID REFERENCES profiles(id),
    locked_at TIMESTAMPTZ,
    deadline TIMESTAMPTZ,
    
    -- Safety flags (MANDATORY for payout approval)
    is_political_safe BOOLEAN,  -- NULL = not reviewed yet
    is_map_safe BOOLEAN,        -- NULL = not reviewed yet
    safety_reviewed_by UUID REFERENCES profiles(id),
    safety_reviewed_at TIMESTAMPTZ,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- Indexes for common queries
CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_jobs_locked_by ON jobs(locked_by);
CREATE INDEX idx_jobs_deadline ON jobs(deadline) WHERE status = 'locked';
CREATE INDEX idx_jobs_created_by ON jobs(created_by);

CREATE TRIGGER jobs_updated_at
    BEFORE UPDATE ON jobs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- SUBMISSIONS TABLE
-- CTV work submissions for review
-- =====================================================

CREATE TABLE submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- References
    job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id),
    
    -- Submitted content
    translated_text TEXT,
    video_url TEXT,           -- Link to re-recorded video
    thumbnail_url TEXT,
    additional_files JSONB DEFAULT '[]'::jsonb,  -- Array of file URLs
    
    -- Submission notes
    notes TEXT,
    
    -- Review status
    is_reviewed BOOLEAN NOT NULL DEFAULT FALSE,
    reviewed_by UUID REFERENCES profiles(id),
    reviewed_at TIMESTAMPTZ,
    
    -- Review outcome
    review_decision TEXT CHECK (review_decision IN ('approved', 'rejected', 'revision_requested')),
    review_notes TEXT,
    review_rating INTEGER CHECK (review_rating >= 1 AND review_rating <= 5),
    
    -- Revision tracking
    revision_number INTEGER NOT NULL DEFAULT 1,
    parent_submission_id UUID REFERENCES submissions(id),
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_submissions_job_id ON submissions(job_id);
CREATE INDEX idx_submissions_user_id ON submissions(user_id);
CREATE INDEX idx_submissions_pending_review ON submissions(is_reviewed) WHERE is_reviewed = FALSE;

CREATE TRIGGER submissions_updated_at
    BEFORE UPDATE ON submissions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- JOB HISTORY TABLE
-- Audit log for job status changes
-- =====================================================

CREATE TABLE job_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    
    -- Change details
    previous_status job_status,
    new_status job_status NOT NULL,
    changed_by UUID REFERENCES profiles(id),
    change_reason TEXT,
    
    -- Snapshot of key fields at time of change
    metadata JSONB DEFAULT '{}'::jsonb,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_job_history_job_id ON job_history(job_id);
CREATE INDEX idx_job_history_created_at ON job_history(created_at);

-- =====================================================
-- RANK LIMITS TABLE
-- Configurable concurrent job limits per rank
-- =====================================================

CREATE TABLE rank_limits (
    rank user_rank PRIMARY KEY,
    max_concurrent_jobs INTEGER NOT NULL,
    min_credit_score INTEGER NOT NULL DEFAULT 0,
    description TEXT
);

-- Insert default limits
INSERT INTO rank_limits (rank, max_concurrent_jobs, min_credit_score, description) VALUES
    ('newbie', 1, 0, 'New CTVs can hold 1 job at a time'),
    ('bronze', 2, 50, 'Bronze CTVs can hold 2 jobs'),
    ('silver', 3, 70, 'Silver CTVs can hold 3 jobs'),
    ('gold', 5, 85, 'Gold CTVs can hold 5 jobs'),
    ('platinum', 10, 95, 'Platinum CTVs can hold 10 jobs');

-- =====================================================
-- PRICING CONFIG TABLE
-- Configurable pricing rates
-- =====================================================

CREATE TABLE pricing_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    rate_per_word DECIMAL(6, 4) NOT NULL DEFAULT 0.0500,
    rate_per_minute DECIMAL(8, 2) NOT NULL DEFAULT 5.00,
    
    -- Complexity multipliers
    complexity_multipliers JSONB NOT NULL DEFAULT '{
        "easy": 1.0,
        "medium": 1.25,
        "hard": 1.5,
        "expert": 2.0
    }'::jsonb,
    
    -- Re-record bonus (30% extra for derivative work)
    re_record_bonus_percent DECIMAL(5, 2) NOT NULL DEFAULT 30.00,
    
    -- Base deadline in hours
    base_deadline_hours INTEGER NOT NULL DEFAULT 6,
    
    -- Penalty settings
    timeout_penalty_score INTEGER NOT NULL DEFAULT 10,
    
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert default config
INSERT INTO pricing_config (is_active) VALUES (TRUE);

-- =====================================================
-- HELPER FUNCTION: Get current user role
-- =====================================================

CREATE OR REPLACE FUNCTION get_user_role()
RETURNS user_role AS $$
BEGIN
    RETURN (
        SELECT role FROM profiles WHERE id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- HELPER FUNCTION: Get current user rank
-- =====================================================

CREATE OR REPLACE FUNCTION get_user_rank()
RETURNS user_rank AS $$
BEGIN
    RETURN (
        SELECT rank FROM profiles WHERE id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FUNCTION: Auto-create profile on user signup
-- =====================================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO profiles (id, full_name, avatar_url)
    VALUES (
        NEW.id,
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'avatar_url'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();
