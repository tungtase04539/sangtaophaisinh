'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Clock, AlertTriangle, CheckCircle2, XCircle, Send, FileText, Video, Cpu, Zap, ExternalLink } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, getStatusColor } from '@/lib/utils'
import type { Job, Submission } from '@/types/database'

interface MyJobCardProps {
    job: Job
    submission?: Submission
}

export function MyJobCard({ job, submission }: MyJobCardProps) {
    const router = useRouter()
    const [timeLeft, setTimeLeft] = useState('')
    const [isOverdue, setIsOverdue] = useState(false)
    const [releasing, setReleasing] = useState(false)
    const supabase = createClient()

    useEffect(() => {
        if (!job.deadline || job.status !== 'locked') return

        const updateTimer = () => {
            const deadline = new Date(job.deadline!)
            const now = new Date()
            const diff = deadline.getTime() - now.getTime()

            if (diff <= 0) {
                setTimeLeft('Quá hạn!')
                setIsOverdue(true)
                return
            }

            const hours = Math.floor(diff / (1000 * 60 * 60))
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
            const seconds = Math.floor((diff % (1000 * 60)) / 1000)

            setTimeLeft(`${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`)
            setIsOverdue(hours < 1)
        }

        updateTimer()
        const interval = setInterval(updateTimer, 1000)
        return () => clearInterval(interval)
    }, [job.deadline, job.status])

    const handleRelease = async () => {
        if (!confirm('Bạn có chắc muốn trả việc này? Điểm uy tín sẽ bị trừ.')) return

        setReleasing(true)
        try {
            const { error } = await supabase.rpc('release_job', { p_job_id: job.id })
            if (error) throw error
            router.refresh()
        } catch (error) {
            console.error('Release error:', error)
            alert('Có lỗi xảy ra')
        } finally {
            setReleasing(false)
        }
    }

    const getStatusIcon = () => {
        switch (job.status) {
            case 'locked': return <Clock className="h-5 w-5 text-purple-500" />
            case 'submitted': return <Send className="h-5 w-5 text-yellow-500" />
            case 'approved': return <CheckCircle2 className="h-5 w-5 text-green-500" />
            case 'rejected': return <XCircle className="h-5 w-5 text-red-500" />
            default: return null
        }
    }

    const getStatusText = () => {
        switch (job.status) {
            case 'locked': return 'Đang thực hiện'
            case 'submitted': return 'Đang chờ duyệt'
            case 'approved': return 'Đã duyệt'
            case 'rejected': return 'Cần sửa lại'
            default: return job.status
        }
    }

    return (
        <Card className={`transition-all ${isOverdue ? 'border-red-300 bg-red-50' : ''}`}>
            <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <CardTitle className="text-lg line-clamp-1">{job.title}</CardTitle>
                        <CardDescription className="mt-1">
                            {formatCurrency(job.pricing_data.final_price)}
                        </CardDescription>
                    </div>
                    <Badge className={getStatusColor(job.status)}>
                        {getStatusIcon()}
                        <span className="ml-1">{getStatusText()}</span>
                    </Badge>
                </div>
            </CardHeader>

            <CardContent className="space-y-4">
                {/* Job Details */}
                <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                        <FileText className="h-4 w-4 text-purple-500" />
                        <span>{job.word_count.toLocaleString()} từ</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                        <Video className="h-4 w-4 text-blue-500" />
                        <span>{Math.round(job.video_duration_seconds / 60)} phút</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                        <Cpu className="h-4 w-4 text-emerald-500" />
                        <span>
                            {job.complexity === 'easy' && 'Dễ'}
                            {job.complexity === 'medium' && 'Trung bình'}
                            {job.complexity === 'hard' && 'Khó'}
                            {job.complexity === 'expert' && 'Chuyên gia'}
                        </span>
                    </div>
                    {job.is_re_record_required && (
                        <div className="flex items-center gap-2 text-amber-600">
                            <Zap className="h-4 w-4" />
                            <span>Cần quay lại</span>
                        </div>
                    )}
                </div>

                {/* Source URL */}
                {job.source_url && (
                    <a
                        href={job.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 hover:underline"
                    >
                        <ExternalLink className="h-4 w-4" />
                        <span>Xem tài liệu gốc</span>
                    </a>
                )}

                {/* AI Tools */}
                {job.ai_metadata?.ai_tools_used?.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                        {job.ai_metadata.ai_tools_used.map((tool: string) => (
                            <span key={tool} className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-xs rounded-full">
                                {tool}
                            </span>
                        ))}
                    </div>
                )}

                {/* Notes from Manager */}
                {job.ai_metadata?.notes && (
                    <div className="text-sm bg-amber-50 border border-amber-200 p-2 rounded-lg">
                        <p className="text-amber-800">
                            <strong>Ghi chú:</strong> {job.ai_metadata.notes}
                        </p>
                    </div>
                )}

                {/* Deadline Timer */}
                {job.status === 'locked' && job.deadline && (
                    <div className={`flex items-center justify-center gap-2 p-3 rounded-lg ${isOverdue ? 'bg-red-100 text-red-700' : 'bg-purple-50 text-purple-700'
                        }`}>
                        {isOverdue && <AlertTriangle className="h-5 w-5" />}
                        <Clock className="h-5 w-5" />
                        <span className="font-mono text-lg font-semibold">{timeLeft}</span>
                        <span className="text-sm">còn lại</span>
                    </div>
                )}

                {/* Submission Status */}
                {submission && (
                    <div className="text-sm space-y-1">
                        <p className="text-gray-600">
                            Nộp bài lần {submission.revision_number} - {new Date(submission.created_at).toLocaleDateString('vi-VN')}
                        </p>
                        {submission.review_notes && (
                            <p className="text-gray-500 bg-gray-50 p-2 rounded">
                                {submission.review_notes}
                            </p>
                        )}
                    </div>
                )}

                {/* Actions */}
                <div className="flex gap-2">
                    {job.status === 'locked' && (
                        <>
                            <Link href={`/jobs/submit/${job.id}`} className="flex-1">
                                <Button className="w-full">
                                    <Send className="h-4 w-4 mr-2" />
                                    Nộp bài
                                </Button>
                            </Link>
                            <Button
                                variant="outline"
                                onClick={handleRelease}
                                disabled={releasing}
                            >
                                {releasing ? '...' : 'Trả việc'}
                            </Button>
                        </>
                    )}
                    {job.status === 'rejected' && (
                        <Link href={`/jobs/submit/${job.id}`} className="flex-1">
                            <Button className="w-full">
                                <Send className="h-4 w-4 mr-2" />
                                Nộp lại
                            </Button>
                        </Link>
                    )}
                    {job.status === 'approved' && (
                        <div className="flex-1 text-center py-2 text-green-600 font-medium">
                            <CheckCircle2 className="h-5 w-5 inline mr-2" />
                            Hoàn thành
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
