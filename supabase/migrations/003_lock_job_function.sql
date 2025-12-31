-- =====================================================
-- Content Localization & AI Tutorial Platform
-- Phase 1: Lock Job Function (Atomic Transaction)
-- =====================================================

-- =====================================================
-- FUNCTION: lock_job
-- Handles the "grab" mechanism with race condition protection
-- 
-- Returns: JSON with success status and message
-- =====================================================

CREATE OR REPLACE FUNCTION lock_job(p_job_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_user_id UUID;
    v_user_rank user_rank;
    v_user_credit_score INTEGER;
    v_max_concurrent INTEGER;
    v_current_locked INTEGER;
    v_job_status job_status;
    v_deadline_hours INTEGER;
    v_new_deadline TIMESTAMPTZ;
    v_job_word_count INTEGER;
    v_job_video_duration INTEGER;
BEGIN
    -- Get current user
    v_user_id := auth.uid();
    
    IF v_user_id IS NULL THEN
        RETURN jsonb_build_object(
            'success', FALSE,
            'error', 'NOT_AUTHENTICATED',
            'message', 'User must be authenticated'
        );
    END IF;
    
    -- Get user profile info
    SELECT rank, credit_score INTO v_user_rank, v_user_credit_score
    FROM profiles
    WHERE id = v_user_id;
    
    IF v_user_rank IS NULL THEN
        RETURN jsonb_build_object(
            'success', FALSE,
            'error', 'PROFILE_NOT_FOUND',
            'message', 'User profile not found'
        );
    END IF;
    
    -- Check if user has agreed to terms
    IF NOT EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = v_user_id 
        AND agreed_to_terms = TRUE 
        AND liability_waiver_signed = TRUE
    ) THEN
        RETURN jsonb_build_object(
            'success', FALSE,
            'error', 'TERMS_NOT_AGREED',
            'message', 'You must agree to terms and sign liability waiver first'
        );
    END IF;
    
    -- Check minimum credit score for rank
    IF NOT EXISTS (
        SELECT 1 FROM rank_limits 
        WHERE rank = v_user_rank 
        AND v_user_credit_score >= min_credit_score
    ) THEN
        RETURN jsonb_build_object(
            'success', FALSE,
            'error', 'CREDIT_SCORE_TOO_LOW',
            'message', 'Your credit score is too low for your current rank'
        );
    END IF;
    
    -- Get max concurrent jobs for user's rank
    SELECT max_concurrent_jobs INTO v_max_concurrent
    FROM rank_limits
    WHERE rank = v_user_rank;
    
    -- Count user's currently locked jobs
    SELECT COUNT(*) INTO v_current_locked
    FROM jobs
    WHERE locked_by = v_user_id
    AND status = 'locked';
    
    -- Check concurrent limit
    IF v_current_locked >= v_max_concurrent THEN
        RETURN jsonb_build_object(
            'success', FALSE,
            'error', 'MAX_JOBS_REACHED',
            'message', format('You can only hold %s jobs at a time (current: %s)', 
                              v_max_concurrent, v_current_locked),
            'current_locked', v_current_locked,
            'max_allowed', v_max_concurrent
        );
    END IF;
    
    -- Try to lock the job atomically
    -- FOR UPDATE SKIP LOCKED prevents race conditions
    SELECT status, word_count, video_duration_seconds 
    INTO v_job_status, v_job_word_count, v_job_video_duration
    FROM jobs
    WHERE id = p_job_id
    FOR UPDATE SKIP LOCKED;
    
    -- Job not found or already locked by another transaction
    IF v_job_status IS NULL THEN
        RETURN jsonb_build_object(
            'success', FALSE,
            'error', 'JOB_NOT_AVAILABLE',
            'message', 'Job is not available or is being claimed by another user'
        );
    END IF;
    
    -- Check if job is still available
    IF v_job_status != 'available' THEN
        RETURN jsonb_build_object(
            'success', FALSE,
            'error', 'JOB_ALREADY_TAKEN',
            'message', format('Job status is %s, not available', v_job_status)
        );
    END IF;
    
    -- Calculate dynamic deadline
    -- Base: 6 hours + (word_count / 1000) hours + (video_minutes / 60) hours
    SELECT base_deadline_hours INTO v_deadline_hours
    FROM pricing_config WHERE is_active = TRUE LIMIT 1;
    
    v_deadline_hours := COALESCE(v_deadline_hours, 6);
    v_deadline_hours := v_deadline_hours 
        + CEIL(v_job_word_count::NUMERIC / 1000)
        + CEIL((v_job_video_duration / 60)::NUMERIC / 60);
    
    v_new_deadline := NOW() + (v_deadline_hours || ' hours')::INTERVAL;
    
    -- Lock the job
    UPDATE jobs
    SET 
        status = 'locked',
        locked_by = v_user_id,
        locked_at = NOW(),
        deadline = v_new_deadline,
        updated_at = NOW()
    WHERE id = p_job_id;
    
    -- Record in history
    INSERT INTO job_history (job_id, previous_status, new_status, changed_by, change_reason)
    VALUES (p_job_id, 'available', 'locked', v_user_id, 'CTV claimed job');
    
    RETURN jsonb_build_object(
        'success', TRUE,
        'message', 'Job locked successfully',
        'job_id', p_job_id,
        'deadline', v_new_deadline,
        'deadline_hours', v_deadline_hours
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'success', FALSE,
            'error', 'SYSTEM_ERROR',
            'message', SQLERRM
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FUNCTION: release_job
-- Allows CTV to voluntarily release a job
-- =====================================================

CREATE OR REPLACE FUNCTION release_job(p_job_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_user_id UUID;
    v_job_locked_by UUID;
    v_job_status job_status;
BEGIN
    v_user_id := auth.uid();
    
    IF v_user_id IS NULL THEN
        RETURN jsonb_build_object(
            'success', FALSE,
            'error', 'NOT_AUTHENTICATED',
            'message', 'User must be authenticated'
        );
    END IF;
    
    -- Check job ownership
    SELECT locked_by, status INTO v_job_locked_by, v_job_status
    FROM jobs
    WHERE id = p_job_id
    FOR UPDATE;
    
    IF v_job_locked_by IS NULL OR v_job_locked_by != v_user_id THEN
        RETURN jsonb_build_object(
            'success', FALSE,
            'error', 'NOT_JOB_OWNER',
            'message', 'You do not own this job'
        );
    END IF;
    
    IF v_job_status != 'locked' THEN
        RETURN jsonb_build_object(
            'success', FALSE,
            'error', 'INVALID_STATUS',
            'message', 'Job cannot be released in current status'
        );
    END IF;
    
    -- Release the job
    UPDATE jobs
    SET 
        status = 'available',
        locked_by = NULL,
        locked_at = NULL,
        deadline = NULL,
        updated_at = NOW()
    WHERE id = p_job_id;
    
    -- Record in history
    INSERT INTO job_history (job_id, previous_status, new_status, changed_by, change_reason)
    VALUES (p_job_id, 'locked', 'available', v_user_id, 'CTV voluntarily released job');
    
    -- Minor credit score penalty for releasing
    UPDATE profiles
    SET credit_score = GREATEST(0, credit_score - 2)
    WHERE id = v_user_id;
    
    RETURN jsonb_build_object(
        'success', TRUE,
        'message', 'Job released successfully',
        'penalty_applied', TRUE,
        'penalty_amount', 2
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'success', FALSE,
            'error', 'SYSTEM_ERROR',
            'message', SQLERRM
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FUNCTION: submit_job
-- CTV submits work for review
-- =====================================================

CREATE OR REPLACE FUNCTION submit_job(
    p_job_id UUID,
    p_translated_text TEXT DEFAULT NULL,
    p_video_url TEXT DEFAULT NULL,
    p_notes TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_user_id UUID;
    v_job_locked_by UUID;
    v_job_status job_status;
    v_submission_id UUID;
BEGIN
    v_user_id := auth.uid();
    
    IF v_user_id IS NULL THEN
        RETURN jsonb_build_object(
            'success', FALSE,
            'error', 'NOT_AUTHENTICATED',
            'message', 'User must be authenticated'
        );
    END IF;
    
    -- Check job ownership
    SELECT locked_by, status INTO v_job_locked_by, v_job_status
    FROM jobs
    WHERE id = p_job_id
    FOR UPDATE;
    
    IF v_job_locked_by IS NULL OR v_job_locked_by != v_user_id THEN
        RETURN jsonb_build_object(
            'success', FALSE,
            'error', 'NOT_JOB_OWNER',
            'message', 'You do not own this job'
        );
    END IF;
    
    IF v_job_status NOT IN ('locked', 'rejected') THEN
        RETURN jsonb_build_object(
            'success', FALSE,
            'error', 'INVALID_STATUS',
            'message', 'Job cannot be submitted in current status'
        );
    END IF;
    
    -- Create submission
    INSERT INTO submissions (job_id, user_id, translated_text, video_url, notes)
    VALUES (p_job_id, v_user_id, p_translated_text, p_video_url, p_notes)
    RETURNING id INTO v_submission_id;
    
    -- Update job status
    UPDATE jobs
    SET 
        status = 'submitted',
        updated_at = NOW()
    WHERE id = p_job_id;
    
    -- Record in history
    INSERT INTO job_history (job_id, previous_status, new_status, changed_by, change_reason)
    VALUES (p_job_id, v_job_status, 'submitted', v_user_id, 'CTV submitted work for review');
    
    RETURN jsonb_build_object(
        'success', TRUE,
        'message', 'Job submitted successfully',
        'submission_id', v_submission_id
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'success', FALSE,
            'error', 'SYSTEM_ERROR',
            'message', SQLERRM
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION lock_job(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION release_job(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION submit_job(UUID, TEXT, TEXT, TEXT) TO authenticated;
