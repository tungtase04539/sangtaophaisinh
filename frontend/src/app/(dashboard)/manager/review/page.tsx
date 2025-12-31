import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Clock, User, FileText } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatDate, getComplexityColor } from '@/lib/utils'

export default async function ReviewQueuePage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Get submitted jobs with submitter info
    const { data: submittedJobs } = await supabase
        .from('jobs')
        .select(`
      *,
      locked_by_profile:profiles!jobs_locked_by_fkey(full_name, rank, credit_score)
    `)
        .eq('status', 'submitted')
        .order('updated_at', { ascending: true })

    return (
        <div className="p-8">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <Link href="/manager" className="p-2 hover:bg-gray-100 rounded-lg">
                    <ArrowLeft className="h-5 w-5" />
                </Link>
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Duyệt bài nộp</h1>
                    <p className="text-gray-500 mt-1">{submittedJobs?.length || 0} bài đang chờ duyệt</p>
                </div>
            </div>

            {/* Submissions List */}
            {submittedJobs && submittedJobs.length > 0 ? (
                <div className="space-y-4">
                    {submittedJobs.map((job) => (
                        <Link
                            key={job.id}
                            href={`/manager/review/${job.id}`}
                            className="block bg-white border rounded-xl p-6 hover:shadow-md hover:border-purple-300 transition-all"
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex-1">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-1">{job.title}</h3>
                                    <div className="flex items-center gap-4 text-sm text-gray-500">
                                        <span className="flex items-center gap-1">
                                            <User className="h-4 w-4" />
                                            {job.locked_by_profile?.full_name || 'CTV'}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Clock className="h-4 w-4" />
                                            {formatDate(job.updated_at)}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Badge className={getComplexityColor(job.complexity)}>
                                        {job.complexity}
                                    </Badge>
                                    <span className="font-semibold text-purple-600">
                                        {formatCurrency(job.pricing_data.final_price)}
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 text-sm">
                                <span className="flex items-center gap-1 text-gray-600">
                                    <FileText className="h-4 w-4" />
                                    {job.word_count.toLocaleString()} từ
                                </span>
                                <span className="text-gray-400">•</span>
                                <span className="text-gray-600">
                                    {Math.round(job.video_duration_seconds / 60)} phút video
                                </span>
                            </div>
                        </Link>
                    ))}
                </div>
            ) : (
                <div className="text-center py-12 bg-gray-50 rounded-xl">
                    <p className="text-gray-500">Không có bài nộp nào cần duyệt</p>
                </div>
            )}
        </div>
    )
}
