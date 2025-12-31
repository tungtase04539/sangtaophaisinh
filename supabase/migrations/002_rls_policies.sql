-- =====================================================
-- Content Localization & AI Tutorial Platform
-- Phase 1: Row Level Security (RLS) Policies
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE rank_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_config ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- PROFILES POLICIES
-- =====================================================

-- Everyone can read their own profile
CREATE POLICY "Users can view own profile"
    ON profiles FOR SELECT
    USING (auth.uid() = id);

-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles"
    ON profiles FOR SELECT
    USING (get_user_role() = 'admin');

-- Managers can view CTV profiles (for job assignment)
CREATE POLICY "Managers can view CTV profiles"
    ON profiles FOR SELECT
    USING (
        get_user_role() = 'manager' 
        AND role = 'ctv'
    );

-- Users can update their own profile (limited fields)
CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (
        auth.uid() = id
        -- Prevent users from changing their own role/rank/balance
        AND role = (SELECT role FROM profiles WHERE id = auth.uid())
        AND rank = (SELECT rank FROM profiles WHERE id = auth.uid())
        AND balance = (SELECT balance FROM profiles WHERE id = auth.uid())
    );

-- Only admins can modify role, rank, balance
CREATE POLICY "Admins can update any profile"
    ON profiles FOR UPDATE
    USING (get_user_role() = 'admin');

-- =====================================================
-- JOBS POLICIES
-- =====================================================

-- CTVs can see: available jobs OR jobs they locked
CREATE POLICY "CTVs can view available or own locked jobs"
    ON jobs FOR SELECT
    USING (
        get_user_role() = 'ctv'
        AND (
            status = 'available'
            OR locked_by = auth.uid()
        )
    );

-- Managers can see all jobs they created
CREATE POLICY "Managers can view own jobs"
    ON jobs FOR SELECT
    USING (
        get_user_role() = 'manager'
        AND created_by = auth.uid()
    );

-- Managers can also see jobs assigned to review
CREATE POLICY "Managers can view submitted jobs for review"
    ON jobs FOR SELECT
    USING (
        get_user_role() = 'manager'
        AND status IN ('submitted', 'approved', 'rejected', 'disputed')
    );

-- Admins can see all jobs
CREATE POLICY "Admins can view all jobs"
    ON jobs FOR SELECT
    USING (get_user_role() = 'admin');

-- Managers can create jobs
CREATE POLICY "Managers can create jobs"
    ON jobs FOR INSERT
    WITH CHECK (
        get_user_role() IN ('manager', 'admin')
        AND created_by = auth.uid()
    );

-- Managers can update their own jobs
CREATE POLICY "Managers can update own jobs"
    ON jobs FOR UPDATE
    USING (
        get_user_role() = 'manager'
        AND created_by = auth.uid()
    );

-- CTVs can only update jobs they locked (limited fields)
CREATE POLICY "CTVs can update locked jobs"
    ON jobs FOR UPDATE
    USING (
        get_user_role() = 'ctv'
        AND locked_by = auth.uid()
        AND status IN ('locked', 'rejected')  -- Can only update while working or after rejection
    );

-- Admins can update any job
CREATE POLICY "Admins can update all jobs"
    ON jobs FOR UPDATE
    USING (get_user_role() = 'admin');

-- Only admins can delete jobs
CREATE POLICY "Only admins can delete jobs"
    ON jobs FOR DELETE
    USING (get_user_role() = 'admin');

-- =====================================================
-- SUBMISSIONS POLICIES
-- =====================================================

-- CTVs can view their own submissions
CREATE POLICY "CTVs can view own submissions"
    ON submissions FOR SELECT
    USING (user_id = auth.uid());

-- Managers can view submissions for jobs they created
CREATE POLICY "Managers can view submissions for own jobs"
    ON submissions FOR SELECT
    USING (
        get_user_role() = 'manager'
        AND job_id IN (
            SELECT id FROM jobs WHERE created_by = auth.uid()
        )
    );

-- Admins can view all submissions
CREATE POLICY "Admins can view all submissions"
    ON submissions FOR SELECT
    USING (get_user_role() = 'admin');

-- CTVs can create submissions for jobs they locked
CREATE POLICY "CTVs can create submissions for locked jobs"
    ON submissions FOR INSERT
    WITH CHECK (
        get_user_role() = 'ctv'
        AND user_id = auth.uid()
        AND job_id IN (
            SELECT id FROM jobs 
            WHERE locked_by = auth.uid() 
            AND status = 'locked'
        )
    );

-- CTVs can update their own unreviewed submissions
CREATE POLICY "CTVs can update own unreviewed submissions"
    ON submissions FOR UPDATE
    USING (
        user_id = auth.uid()
        AND is_reviewed = FALSE
    );

-- Managers can update submissions (for review)
CREATE POLICY "Managers can review submissions"
    ON submissions FOR UPDATE
    USING (
        get_user_role() IN ('manager', 'admin')
        AND job_id IN (
            SELECT id FROM jobs WHERE created_by = auth.uid()
        )
    );

-- =====================================================
-- JOB HISTORY POLICIES
-- =====================================================

-- Users can view history of jobs they have access to
CREATE POLICY "Users can view relevant job history"
    ON job_history FOR SELECT
    USING (
        job_id IN (
            SELECT id FROM jobs  -- This inherits the jobs table RLS
        )
    );

-- System inserts history (via functions with SECURITY DEFINER)
CREATE POLICY "System can insert job history"
    ON job_history FOR INSERT
    WITH CHECK (TRUE);  -- Controlled by function permissions

-- =====================================================
-- RANK LIMITS POLICIES (Public read)
-- =====================================================

CREATE POLICY "Anyone can view rank limits"
    ON rank_limits FOR SELECT
    USING (TRUE);

-- Only admins can modify
CREATE POLICY "Only admins can modify rank limits"
    ON rank_limits FOR ALL
    USING (get_user_role() = 'admin');

-- =====================================================
-- PRICING CONFIG POLICIES
-- =====================================================

CREATE POLICY "Anyone can view active pricing config"
    ON pricing_config FOR SELECT
    USING (is_active = TRUE);

CREATE POLICY "Only admins can modify pricing config"
    ON pricing_config FOR ALL
    USING (get_user_role() = 'admin');
