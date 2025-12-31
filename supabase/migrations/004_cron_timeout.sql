-- =====================================================
-- Content Localization & AI Tutorial Platform
-- Phase 1: pg_cron Timeout Handler
-- =====================================================

-- =====================================================
-- FUNCTION: handle_job_timeouts
-- Runs periodically to revert timed-out jobs
-- =====================================================

CREATE OR REPLACE FUNCTION handle_job_timeouts()
RETURNS JSONB AS $$
DECLARE
    v_timeout_count INTEGER := 0;
    v_penalty_score INTEGER;
    v_job RECORD;
BEGIN
    -- Get penalty score from config
    SELECT timeout_penalty_score INTO v_penalty_score
    FROM pricing_config WHERE is_active = TRUE LIMIT 1;
    
    v_penalty_score := COALESCE(v_penalty_score, 10);
    
    -- Find and process timed-out jobs
    FOR v_job IN 
        SELECT id, locked_by, title
        FROM jobs
        WHERE status = 'locked'
        AND deadline < NOW()
        FOR UPDATE SKIP LOCKED
    LOOP
        -- Revert job to available
        UPDATE jobs
        SET 
            status = 'available',
            locked_by = NULL,
            locked_at = NULL,
            deadline = NULL,
            updated_at = NOW()
        WHERE id = v_job.id;
        
        -- Penalize CTV
        UPDATE profiles
        SET credit_score = GREATEST(0, credit_score - v_penalty_score)
        WHERE id = v_job.locked_by;
        
        -- Record in history
        INSERT INTO job_history (job_id, previous_status, new_status, changed_by, change_reason, metadata)
        VALUES (
            v_job.id, 
            'locked', 
            'available', 
            NULL,  -- System action
            'Job timed out - automatically reverted',
            jsonb_build_object(
                'penalty_applied', v_penalty_score,
                'penalized_user', v_job.locked_by
            )
        );
        
        v_timeout_count := v_timeout_count + 1;
    END LOOP;
    
    RETURN jsonb_build_object(
        'success', TRUE,
        'jobs_reverted', v_timeout_count,
        'penalty_per_job', v_penalty_score,
        'processed_at', NOW()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- CRON JOB: Run timeout handler every 5 minutes
-- =====================================================

-- Schedule the cron job (runs every 5 minutes)
SELECT cron.schedule(
    'job-timeout-handler',           -- Job name
    '*/5 * * * *',                   -- Every 5 minutes
    $$SELECT handle_job_timeouts()$$ -- SQL to execute
);

-- =====================================================
-- FUNCTION: update_user_rank
-- Automatically promote/demote users based on credit score
-- =====================================================

CREATE OR REPLACE FUNCTION update_user_rank()
RETURNS TRIGGER AS $$
DECLARE
    v_new_rank user_rank;
BEGIN
    -- Determine new rank based on credit score
    SELECT rank INTO v_new_rank
    FROM rank_limits
    WHERE NEW.credit_score >= min_credit_score
    ORDER BY min_credit_score DESC
    LIMIT 1;
    
    IF v_new_rank IS NOT NULL AND v_new_rank != NEW.rank THEN
        NEW.rank := v_new_rank;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update rank when credit score changes
CREATE TRIGGER auto_update_user_rank
    BEFORE UPDATE OF credit_score ON profiles
    FOR EACH ROW
    WHEN (OLD.credit_score IS DISTINCT FROM NEW.credit_score)
    EXECUTE FUNCTION update_user_rank();

-- =====================================================
-- FUNCTION: notify_job_status_change (Realtime trigger)
-- Broadcasts job status changes for real-time updates
-- =====================================================

CREATE OR REPLACE FUNCTION notify_job_status_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Broadcast to Supabase Realtime
    PERFORM pg_notify(
        'job_status_change',
        json_build_object(
            'job_id', NEW.id,
            'old_status', OLD.status,
            'new_status', NEW.status,
            'locked_by', NEW.locked_by,
            'updated_at', NEW.updated_at
        )::text
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER job_status_realtime
    AFTER UPDATE OF status ON jobs
    FOR EACH ROW
    WHEN (OLD.status IS DISTINCT FROM NEW.status)
    EXECUTE FUNCTION notify_job_status_change();
