import { createClient } from '@/lib/supabase/server'
import { MyJobCard } from '@/components/jobs/my-job-card'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function MyJobsPage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Get user's jobs
    const { data: jobs } = await supabase
        .from('jobs')
        .select('*')
        .eq('locked_by', user.id)
        .in('status', ['locked', 'submitted', 'rejected', 'approved'])
        .order('locked_at', { ascending: false })

    // Get submissions for these jobs
    const jobIds = jobs?.map(j => j.id) || []
    const { data: submissions } = await supabase
        .from('submissions')
        .select('*')
        .in('job_id', jobIds)
        .order('created_at', { ascending: false })

    // Group submissions by job
    const submissionsByJob = submissions?.reduce((acc, sub) => {
        if (!acc[sub.job_id]) acc[sub.job_id] = []
        acc[sub.job_id].push(sub)
        return acc
    }, {} as Record<string, typeof submissions>) || {}

    const lockedJobs = jobs?.filter(j => j.status === 'locked') || []
    const submittedJobs = jobs?.filter(j => j.status === 'submitted') || []
    const rejectedJobs = jobs?.filter(j => j.status === 'rejected') || []
    const approvedJobs = jobs?.filter(j => j.status === 'approved') || []

    return (
        <div className="p-8">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <Link href="/jobs" className="p-2 hover:bg-gray-100 rounded-lg">
                    <ArrowLeft className="h-5 w-5" />
                </Link>
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Việc của tôi</h1>
                    <p className="text-gray-500 mt-1">Quản lý các công việc bạn đang thực hiện</p>
                </div>
            </div>

            {/* Locked Jobs (Urgent) */}
            {lockedJobs.length > 0 && (
                <section className="mb-8">
                    <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                        <span className="w-3 h-3 bg-purple-500 rounded-full animate-pulse"></span>
                        Đang thực hiện ({lockedJobs.length})
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {lockedJobs.map((job) => (
                            <MyJobCard
                                key={job.id}
                                job={job}
                                submission={submissionsByJob[job.id]?.[0]}
                            />
                        ))}
                    </div>
                </section>
            )}

            {/* Submitted Jobs */}
            {submittedJobs.length > 0 && (
                <section className="mb-8">
                    <h2 className="text-xl font-semibold mb-4 text-yellow-700">
                        Đang chờ duyệt ({submittedJobs.length})
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {submittedJobs.map((job) => (
                            <MyJobCard
                                key={job.id}
                                job={job}
                                submission={submissionsByJob[job.id]?.[0]}
                            />
                        ))}
                    </div>
                </section>
            )}

            {/* Rejected Jobs */}
            {rejectedJobs.length > 0 && (
                <section className="mb-8">
                    <h2 className="text-xl font-semibold mb-4 text-red-700">
                        Cần sửa lại ({rejectedJobs.length})
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {rejectedJobs.map((job) => (
                            <MyJobCard
                                key={job.id}
                                job={job}
                                submission={submissionsByJob[job.id]?.[0]}
                            />
                        ))}
                    </div>
                </section>
            )}

            {/* Approved Jobs */}
            {approvedJobs.length > 0 && (
                <section className="mb-8">
                    <h2 className="text-xl font-semibold mb-4 text-green-700">
                        Đã hoàn thành ({approvedJobs.length})
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {approvedJobs.map((job) => (
                            <MyJobCard
                                key={job.id}
                                job={job}
                                submission={submissionsByJob[job.id]?.[0]}
                            />
                        ))}
                    </div>
                </section>
            )}

            {/* Empty State */}
            {(!jobs || jobs.length === 0) && (
                <div className="text-center py-12">
                    <p className="text-gray-500 mb-4">Bạn chưa nhận việc nào</p>
                    <Link
                        href="/jobs"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                    >
                        Xem việc làm có sẵn
                    </Link>
                </div>
            )}
        </div>
    )
}
