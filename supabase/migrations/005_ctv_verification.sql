-- =====================================================
-- Version 2.0: CTV Verification System
-- =====================================================

-- Add new columns to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS zalo TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS verified_by UUID REFERENCES auth.users(id);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS verification_notes TEXT;

-- Update RLS for managers to verify CTVs
CREATE POLICY "Managers can update CTV verification"
    ON profiles
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'manager')
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'manager')
        )
    );

-- Function to verify CTV
CREATE OR REPLACE FUNCTION verify_ctv(p_ctv_id UUID, p_notes TEXT DEFAULT NULL)
RETURNS JSONB AS $$
DECLARE
    v_manager_id UUID;
BEGIN
    v_manager_id := auth.uid();
    
    -- Check if caller is manager/admin
    IF NOT EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = v_manager_id 
        AND role IN ('admin', 'manager')
    ) THEN
        RETURN jsonb_build_object(
            'success', FALSE,
            'error', 'NOT_AUTHORIZED',
            'message', 'Only managers and admins can verify CTVs'
        );
    END IF;
    
    -- Update CTV verification status
    UPDATE profiles
    SET 
        is_verified = TRUE,
        verified_by = v_manager_id,
        verified_at = NOW(),
        verification_notes = p_notes
    WHERE id = p_ctv_id AND role = 'ctv';
    
    RETURN jsonb_build_object(
        'success', TRUE,
        'message', 'CTV verified successfully'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION verify_ctv(UUID, TEXT) TO authenticated;
