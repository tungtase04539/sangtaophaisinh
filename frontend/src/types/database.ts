/**
 * Database Types for Content Localization Platform
 * Auto-generated types would normally come from Supabase CLI
 */

export type UserRole = 'admin' | 'manager' | 'ctv'
export type UserRank = 'newbie' | 'bronze' | 'silver' | 'gold' | 'platinum'
export type JobStatus = 'available' | 'locked' | 'submitted' | 'approved' | 'rejected' | 'disputed' | 'completed' | 'cancelled'
export type ComplexityLevel = 'easy' | 'medium' | 'hard' | 'expert'

export interface Profile {
    id: string
    full_name: string | null
    avatar_url: string | null
    phone: string | null
    role: UserRole
    rank: UserRank
    credit_score: number
    balance: number
    total_earned: number
    agreed_to_terms: boolean
    terms_agreed_at: string | null
    liability_waiver_signed: boolean
    waiver_signed_at: string | null
    created_at: string
    updated_at: string
}

export interface PricingData {
    word_count: number
    rate_per_word: number
    video_duration_minutes: number
    rate_per_minute: number
    complexity_multiplier: number
    re_record_bonus: number
    base_price: number
    final_price: number
}

export interface AIMetadata {
    prompt_source?: string
    prompt_translated?: string
    model_links?: string[]
    hardware_requirements?: string
    ai_tools_used: string[]
    tutorial_type?: string
    difficulty_level?: string
    notes?: string
}

export interface Job {
    id: string
    title: string
    description: string | null
    source_url: string | null
    word_count: number
    video_duration_seconds: number
    is_re_record_required: boolean
    complexity: ComplexityLevel
    pricing_data: PricingData
    ai_metadata: AIMetadata
    status: JobStatus
    created_by: string
    locked_by: string | null
    locked_at: string | null
    deadline: string | null
    is_political_safe: boolean | null
    is_map_safe: boolean | null
    safety_reviewed_by: string | null
    safety_reviewed_at: string | null
    created_at: string
    updated_at: string
    completed_at: string | null
}

export interface Submission {
    id: string
    job_id: string
    user_id: string
    translated_text: string | null
    video_url: string | null
    thumbnail_url: string | null
    additional_files: string[]
    notes: string | null
    is_reviewed: boolean
    reviewed_by: string | null
    reviewed_at: string | null
    review_decision: 'approved' | 'rejected' | 'revision_requested' | null
    review_notes: string | null
    review_rating: number | null
    revision_number: number
    parent_submission_id: string | null
    created_at: string
    updated_at: string
}

export interface RankLimit {
    rank: UserRank
    max_concurrent_jobs: number
    min_credit_score: number
    description: string | null
}

// RPC function return types
export interface LockJobResult {
    success: boolean
    message: string
    error?: string
    job_id?: string
    deadline?: string
    deadline_hours?: number
    current_locked?: number
    max_allowed?: number
}

export interface SubmitJobResult {
    success: boolean
    message: string
    error?: string
    submission_id?: string
}

// Form types
export interface SafetyChecks {
    is_political_safe: boolean
    is_map_safe: boolean
    is_derivative_work: boolean
    no_copyright_violation: boolean
    safety_notes?: string
}

export interface ReviewFormData {
    job_id: string
    submission_id: string
    safety_checks: SafetyChecks
    quality_assessment: {
        translation_accuracy: number
        video_quality: number
        voice_clarity?: number
        technical_accuracy?: number
        overall_rating: number
    }
    decision: {
        action: 'approve' | 'reject' | 'request_revision' | 'dispute'
        rejection_reason?: string
        revision_instructions?: string
        dispute_reason?: string
        public_feedback?: string
        internal_notes?: string
    }
    payout?: {
        approved_amount: number
        bonus_amount?: number
        deduction_amount?: number
        deduction_reason?: string
    }
}
