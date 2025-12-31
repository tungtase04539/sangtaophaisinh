'use client'

import { useState } from 'react'
import { Clock, FileText, Video, Cpu, Zap } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatDeadline, getComplexityColor } from '@/lib/utils'
import type { Job, LockJobResult } from '@/types/database'

interface JobCardProps {
    job: Job
    onLock?: (result: LockJobResult) => void
    showClaimButton?: boolean
}

export function JobCard({ job, onLock, showClaimButton = true }: JobCardProps) {
    const [loading, setLoading] = useState(false)
    const supabase = createClient()

    const handleClaimJob = async () => {
        setLoading(true)
        try {
            const { data, error } = await supabase.rpc('lock_job', { p_job_id: job.id })

            if (error) {
                onLock?.({ success: false, message: error.message, error: 'SYSTEM_ERROR' })
                return
            }

            onLock?.(data as LockJobResult)
        } catch (err) {
            onLock?.({ success: false, message: 'Có lỗi xảy ra', error: 'SYSTEM_ERROR' })
        } finally {
            setLoading(false)
        }
    }

    const videoMinutes = Math.round(job.video_duration_seconds / 60)

    return (
        <Card gradient className="group hover:border-purple-300 hover:shadow-lg transition-all duration-300">
            <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                    <CardTitle className="text-lg line-clamp-2 group-hover:text-purple-700 transition-colors">
                        {job.title}
                    </CardTitle>
                    <Badge className={getComplexityColor(job.complexity)}>
                        {job.complexity === 'easy' && 'Dễ'}
                        {job.complexity === 'medium' && 'TB'}
                        {job.complexity === 'hard' && 'Khó'}
                        {job.complexity === 'expert' && 'Chuyên gia'}
                    </Badge>
                </div>
            </CardHeader>

            <CardContent className="space-y-4">
                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                        <FileText className="h-4 w-4 text-purple-500" />
                        <span>{job.word_count.toLocaleString()} từ</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                        <Video className="h-4 w-4 text-blue-500" />
                        <span>{videoMinutes} phút</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                        <Clock className="h-4 w-4 text-orange-500" />
                        <span>~{Math.ceil(6 + job.word_count / 1000 + videoMinutes / 60)}h deadline</span>
                    </div>
                    {job.is_re_record_required && (
                        <div className="flex items-center gap-2 text-amber-600">
                            <Zap className="h-4 w-4" />
                            <span>Cần quay lại</span>
                        </div>
                    )}
                </div>

                {/* AI Metadata Preview */}
                {job.ai_metadata?.ai_tools_used?.length > 0 && (
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Cpu className="h-4 w-4 text-emerald-500" />
                        <span className="truncate">{job.ai_metadata.ai_tools_used.join(', ')}</span>
                    </div>
                )}

                {/* Price Display */}
                <div className="pt-2 border-t border-gray-100">
                    <div className="flex items-baseline justify-between">
                        <span className="text-sm text-gray-500">Thù lao</span>
                        <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                            {formatCurrency(job.pricing_data.final_price)}
                        </span>
                    </div>
                </div>
            </CardContent>

            {showClaimButton && (
                <CardFooter>
                    <Button
                        className="w-full"
                        onClick={handleClaimJob}
                        loading={loading}
                        disabled={loading}
                    >
                        {loading ? 'Đang xử lý...' : 'Nhận việc'}
                    </Button>
                </CardFooter>
            )}
        </Card>
    )
}
