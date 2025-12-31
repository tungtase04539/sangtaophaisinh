'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { JobCard } from '@/components/jobs/job-card'
import { AlertCircle, CheckCircle2, Search, Filter } from 'lucide-react'
import type { Job, LockJobResult } from '@/types/database'

interface JobsGridProps {
    initialJobs: Job[]
    canTakeMore: boolean
}

export function JobsGrid({ initialJobs, canTakeMore }: JobsGridProps) {
    const [jobs, setJobs] = useState<Job[]>(initialJobs)
    const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
    const [filter, setFilter] = useState<string>('all')
    const [search, setSearch] = useState('')

    const supabase = createClient()

    // Realtime subscription for job updates
    useEffect(() => {
        const channel = supabase
            .channel('jobs-realtime')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'jobs' },
                (payload) => {
                    if (payload.eventType === 'UPDATE') {
                        const updatedJob = payload.new as Job

                        if (updatedJob.status === 'available') {
                            // Job became available - add it
                            setJobs(prev => {
                                if (prev.find(j => j.id === updatedJob.id)) {
                                    return prev.map(j => j.id === updatedJob.id ? updatedJob : j)
                                }
                                return [updatedJob, ...prev]
                            })
                        } else {
                            // Job no longer available - remove it
                            setJobs(prev => prev.filter(j => j.id !== updatedJob.id))
                        }
                    } else if (payload.eventType === 'INSERT') {
                        const newJob = payload.new as Job
                        if (newJob.status === 'available') {
                            setJobs(prev => [newJob, ...prev])
                        }
                    }
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [supabase])

    const handleLockResult = (result: LockJobResult) => {
        if (result.success) {
            setToast({ type: 'success', message: result.message })
            // Remove the job from the list
            if (result.job_id) {
                setJobs(prev => prev.filter(j => j.id !== result.job_id))
            }
            // Refresh after 2 seconds
            setTimeout(() => window.location.reload(), 2000)
        } else {
            setToast({ type: 'error', message: result.message })
        }

        // Clear toast after 5 seconds
        setTimeout(() => setToast(null), 5000)
    }

    // Filter jobs
    const filteredJobs = jobs.filter(job => {
        const matchesSearch = job.title.toLowerCase().includes(search.toLowerCase())
        const matchesFilter = filter === 'all' || job.complexity === filter
        return matchesSearch && matchesFilter
    })

    return (
        <div>
            {/* Toast Notification */}
            {toast && (
                <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg ${toast.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
                    }`}>
                    {toast.type === 'success' ? <CheckCircle2 className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
                    {toast.message}
                </div>
            )}

            {/* Filters */}
            <div className="flex flex-wrap gap-4 mb-6">
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Tìm kiếm..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <Filter className="h-5 w-5 text-gray-400" />
                    <select
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500"
                    >
                        <option value="all">Tất cả</option>
                        <option value="easy">Dễ</option>
                        <option value="medium">Trung bình</option>
                        <option value="hard">Khó</option>
                        <option value="expert">Chuyên gia</option>
                    </select>
                </div>
            </div>

            {/* Warning if can't take more */}
            {!canTakeMore && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6 flex items-center gap-3">
                    <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0" />
                    <p className="text-amber-800">
                        Bạn đã đạt giới hạn số việc có thể nhận. Hoàn thành hoặc trả việc hiện tại để nhận thêm.
                    </p>
                </div>
            )}

            {/* Jobs Grid */}
            {filteredJobs.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredJobs.map((job) => (
                        <JobCard
                            key={job.id}
                            job={job}
                            onLock={handleLockResult}
                            showClaimButton={canTakeMore}
                        />
                    ))}
                </div>
            ) : (
                <div className="text-center py-12">
                    <p className="text-gray-500">Không có việc làm nào phù hợp</p>
                </div>
            )}
        </div>
    )
}
