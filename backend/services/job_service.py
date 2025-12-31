"""
Content Localization & AI Tutorial Platform
Job Service - API Layer

Handles job operations including locking, releasing, and submissions.
"""

from dataclasses import dataclass
from typing import Optional, List
from datetime import datetime
from enum import Enum
import json

# Assuming Supabase client is configured elsewhere
# from supabase import create_client, Client


class JobStatus(str, Enum):
    """Job lifecycle status."""
    AVAILABLE = "available"
    LOCKED = "locked"
    SUBMITTED = "submitted"
    APPROVED = "approved"
    REJECTED = "rejected"
    DISPUTED = "disputed"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class UserRole(str, Enum):
    """User roles for RBAC."""
    ADMIN = "admin"
    MANAGER = "manager"
    CTV = "ctv"


class UserRank(str, Enum):
    """CTV ranking system."""
    NEWBIE = "newbie"
    BRONZE = "bronze"
    SILVER = "silver"
    GOLD = "gold"
    PLATINUM = "platinum"


@dataclass
class JobLockResult:
    """Result of job lock operation."""
    success: bool
    message: str
    error: Optional[str] = None
    job_id: Optional[str] = None
    deadline: Optional[datetime] = None
    deadline_hours: Optional[int] = None
    current_locked: Optional[int] = None
    max_allowed: Optional[int] = None
    
    def to_dict(self) -> dict:
        return {
            "success": self.success,
            "message": self.message,
            "error": self.error,
            "job_id": str(self.job_id) if self.job_id else None,
            "deadline": self.deadline.isoformat() if self.deadline else None,
            "deadline_hours": self.deadline_hours,
            "current_locked": self.current_locked,
            "max_allowed": self.max_allowed,
        }


@dataclass
class JobSubmitResult:
    """Result of job submission operation."""
    success: bool
    message: str
    error: Optional[str] = None
    submission_id: Optional[str] = None
    
    def to_dict(self) -> dict:
        return {
            "success": self.success,
            "message": self.message,
            "error": self.error,
            "submission_id": str(self.submission_id) if self.submission_id else None,
        }


class JobService:
    """
    Service layer for job operations.
    
    Interacts with Supabase database functions for atomic operations.
    """
    
    def __init__(self, supabase_client):
        """
        Initialize job service.
        
        Args:
            supabase_client: Configured Supabase client instance.
        """
        self.client = supabase_client
    
    async def lock_job(self, job_id: str) -> JobLockResult:
        """
        Lock a job for the current authenticated user.
        
        This calls the database function `lock_job()` which handles:
        - Checking concurrent job limits
        - Verifying job availability
        - Atomic locking with race condition protection
        - Setting deadline
        
        Args:
            job_id: UUID of the job to lock.
        
        Returns:
            JobLockResult with success status and details.
        
        Raises:
            Exception: If database operation fails.
        """
        try:
            # Call the database function via RPC
            response = await self.client.rpc('lock_job', {'p_job_id': job_id}).execute()
            
            result = response.data
            
            if result.get('success'):
                return JobLockResult(
                    success=True,
                    message=result.get('message', 'Job locked successfully'),
                    job_id=result.get('job_id'),
                    deadline=datetime.fromisoformat(result['deadline']) if result.get('deadline') else None,
                    deadline_hours=result.get('deadline_hours'),
                )
            else:
                return JobLockResult(
                    success=False,
                    message=result.get('message', 'Failed to lock job'),
                    error=result.get('error'),
                    current_locked=result.get('current_locked'),
                    max_allowed=result.get('max_allowed'),
                )
                
        except Exception as e:
            return JobLockResult(
                success=False,
                message=f"System error: {str(e)}",
                error="SYSTEM_ERROR",
            )
    
    async def release_job(self, job_id: str) -> JobLockResult:
        """
        Voluntarily release a locked job.
        
        Args:
            job_id: UUID of the job to release.
        
        Returns:
            JobLockResult with success status.
        """
        try:
            response = await self.client.rpc('release_job', {'p_job_id': job_id}).execute()
            result = response.data
            
            if result.get('success'):
                return JobLockResult(
                    success=True,
                    message=result.get('message', 'Job released successfully'),
                    job_id=job_id,
                )
            else:
                return JobLockResult(
                    success=False,
                    message=result.get('message', 'Failed to release job'),
                    error=result.get('error'),
                )
                
        except Exception as e:
            return JobLockResult(
                success=False,
                message=f"System error: {str(e)}",
                error="SYSTEM_ERROR",
            )
    
    async def submit_job(
        self,
        job_id: str,
        translated_text: Optional[str] = None,
        video_url: Optional[str] = None,
        notes: Optional[str] = None
    ) -> JobSubmitResult:
        """
        Submit work for a locked job.
        
        Args:
            job_id: UUID of the job to submit.
            translated_text: Translated content text.
            video_url: URL to the re-recorded video.
            notes: Additional notes for the reviewer.
        
        Returns:
            JobSubmitResult with success status and submission ID.
        """
        try:
            response = await self.client.rpc('submit_job', {
                'p_job_id': job_id,
                'p_translated_text': translated_text,
                'p_video_url': video_url,
                'p_notes': notes,
            }).execute()
            
            result = response.data
            
            if result.get('success'):
                return JobSubmitResult(
                    success=True,
                    message=result.get('message', 'Job submitted successfully'),
                    submission_id=result.get('submission_id'),
                )
            else:
                return JobSubmitResult(
                    success=False,
                    message=result.get('message', 'Failed to submit job'),
                    error=result.get('error'),
                )
                
        except Exception as e:
            return JobSubmitResult(
                success=False,
                message=f"System error: {str(e)}",
                error="SYSTEM_ERROR",
            )
    
    async def get_available_jobs(
        self,
        limit: int = 20,
        offset: int = 0,
        complexity: Optional[str] = None
    ) -> List[dict]:
        """
        Get list of available jobs for CTVs.
        
        Args:
            limit: Maximum number of jobs to return.
            offset: Offset for pagination.
            complexity: Optional filter by complexity level.
        
        Returns:
            List of available job dictionaries.
        """
        query = self.client.table('jobs').select('*').eq('status', 'available')
        
        if complexity:
            query = query.eq('complexity', complexity)
        
        response = await query.range(offset, offset + limit - 1).execute()
        return response.data
    
    async def get_my_jobs(self, user_id: str) -> List[dict]:
        """
        Get jobs locked by the current user.
        
        Args:
            user_id: UUID of the user.
        
        Returns:
            List of user's locked job dictionaries.
        """
        response = await self.client.table('jobs').select('*').eq('locked_by', user_id).execute()
        return response.data
    
    async def get_user_stats(self, user_id: str) -> dict:
        """
        Get job statistics for a user.
        
        Args:
            user_id: UUID of the user.
        
        Returns:
            Dictionary with user job statistics.
        """
        # Get profile info
        profile_response = await self.client.table('profiles').select('*').eq('id', user_id).single().execute()
        profile = profile_response.data
        
        # Get job counts
        locked_response = await self.client.table('jobs').select('id', count='exact').eq('locked_by', user_id).eq('status', 'locked').execute()
        completed_response = await self.client.table('jobs').select('id', count='exact').eq('locked_by', user_id).eq('status', 'completed').execute()
        
        # Get rank limits
        rank_response = await self.client.table('rank_limits').select('*').eq('rank', profile['rank']).single().execute()
        rank_limits = rank_response.data
        
        return {
            "profile": profile,
            "current_locked_count": locked_response.count,
            "completed_count": completed_response.count,
            "max_concurrent_jobs": rank_limits['max_concurrent_jobs'],
            "can_take_more_jobs": locked_response.count < rank_limits['max_concurrent_jobs'],
        }


# FastAPI route examples (for reference)
"""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

router = APIRouter(prefix="/api/jobs", tags=["jobs"])

class LockJobRequest(BaseModel):
    job_id: str

class SubmitJobRequest(BaseModel):
    job_id: str
    translated_text: Optional[str] = None
    video_url: Optional[str] = None
    notes: Optional[str] = None

@router.post("/lock")
async def lock_job(request: LockJobRequest, job_service: JobService = Depends(get_job_service)):
    result = await job_service.lock_job(request.job_id)
    if not result.success:
        raise HTTPException(status_code=400, detail=result.to_dict())
    return result.to_dict()

@router.post("/submit")
async def submit_job(request: SubmitJobRequest, job_service: JobService = Depends(get_job_service)):
    result = await job_service.submit_job(
        job_id=request.job_id,
        translated_text=request.translated_text,
        video_url=request.video_url,
        notes=request.notes,
    )
    if not result.success:
        raise HTTPException(status_code=400, detail=result.to_dict())
    return result.to_dict()

@router.post("/release/{job_id}")
async def release_job(job_id: str, job_service: JobService = Depends(get_job_service)):
    result = await job_service.release_job(job_id)
    if not result.success:
        raise HTTPException(status_code=400, detail=result.to_dict())
    return result.to_dict()

@router.get("/available")
async def get_available_jobs(
    limit: int = 20,
    offset: int = 0,
    complexity: Optional[str] = None,
    job_service: JobService = Depends(get_job_service)
):
    jobs = await job_service.get_available_jobs(limit, offset, complexity)
    return {"jobs": jobs, "count": len(jobs)}

@router.get("/my-jobs")
async def get_my_jobs(
    user_id: str = Depends(get_current_user_id),
    job_service: JobService = Depends(get_job_service)
):
    jobs = await job_service.get_my_jobs(user_id)
    return {"jobs": jobs, "count": len(jobs)}
"""
