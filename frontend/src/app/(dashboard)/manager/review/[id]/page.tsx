import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, User, Clock, FileText, Video, ExternalLink } from 'lucide-react'
import { ReviewForm } from '@/components/forms/review-form'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency, formatDate, getComplexityColor } from '@/lib/utils'

interface ReviewJobPageProps {
    params: Promise<{ id: string }>
}

export default async function ReviewJobPage({ params }: ReviewJobPageProps) {
    const { id } = await params
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Get job with related data
    const { data: job, error } = await supabase
        .from('jobs')
        .select(`
      *,
      ctv:profiles!jobs_locked_by_fkey(id, full_name, rank, credit_score, avatar_url)
    `)
        .eq('id', id)
        .single()

    if (error || !job) {
        notFound()
    }

    // Get latest submission
    const { data: submission } = await supabase
        .from('submissions')
        .select('*')
        .eq('job_id', id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

    if (!submission) {
        notFound()
    }

    return (
        <div className="p-8 max-w-5xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <Link href="/manager/review" className="p-2 hover:bg-gray-100 rounded-lg">
                    <ArrowLeft className="h-5 w-5" />
                </Link>
                <div className="flex-1">
                    <h1 className="text-2xl font-bold text-gray-900">{job.title}</h1>
                    <p className="text-gray-500">Đánh giá bài nộp</p>
                </div>
                <Badge className={getComplexityColor(job.complexity)}>
                    {job.complexity}
                </Badge>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Job Info & Submission */}
                <div className="lg:col-span-1 space-y-6">
                    {/* CTV Info */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Người thực hiện</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold text-lg">
                                    {job.ctv?.full_name?.[0]?.toUpperCase() || 'C'}
                                </div>
                                <div>
                                    <p className="font-medium">{job.ctv?.full_name || 'CTV'}</p>
                                    <p className="text-sm text-gray-500 capitalize">
                                        {job.ctv?.rank} • Điểm: {job.ctv?.credit_score}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Job Details */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Chi tiết công việc</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-500">Thù lao</span>
                                <span className="font-semibold text-purple-600">
                                    {formatCurrency(job.pricing_data.final_price)}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Số từ</span>
                                <span>{job.word_count.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Video</span>
                                <span>{Math.round(job.video_duration_seconds / 60)} phút</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Yêu cầu quay lại</span>
                                <span>{job.is_re_record_required ? 'Có' : 'Không'}</span>
                            </div>
                            {job.source_url && (
                                <a
                                    href={job.source_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 text-blue-600 hover:underline"
                                >
                                    <ExternalLink className="h-4 w-4" />
                                    Xem nguồn gốc
                                </a>
                            )}
                        </CardContent>
                    </Card>

                    {/* Submission Info */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Bài nộp</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-500">Lần nộp</span>
                                <span>#{submission.revision_number}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Thời gian</span>
                                <span>{formatDate(submission.created_at)}</span>
                            </div>
                            {submission.video_url && (
                                <a
                                    href={submission.video_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 text-blue-600 hover:underline"
                                >
                                    <Video className="h-4 w-4" />
                                    Xem video nộp
                                </a>
                            )}
                            {submission.notes && (
                                <div className="pt-2 border-t">
                                    <p className="text-gray-500 mb-1">Ghi chú:</p>
                                    <p className="text-gray-700 bg-gray-50 p-2 rounded">
                                        {submission.notes}
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Review Form */}
                <div className="lg:col-span-2">
                    <ReviewForm job={job} submission={submission} />
                </div>
            </div>
        </div>
    )
}
