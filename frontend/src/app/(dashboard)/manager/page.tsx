import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Briefcase, FileCheck, Clock, CheckCircle2, AlertCircle } from 'lucide-react'

export default async function ManagerDashboard() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Check role
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    if (profile?.role !== 'manager' && profile?.role !== 'admin') {
        redirect('/jobs')
    }

    // Get stats
    const { count: totalJobs } = await supabase
        .from('jobs')
        .select('*', { count: 'exact', head: true })
        .eq('created_by', user.id)

    const { count: pendingReview } = await supabase
        .from('jobs')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'submitted')

    const { count: activeJobs } = await supabase
        .from('jobs')
        .select('*', { count: 'exact', head: true })
        .eq('created_by', user.id)
        .in('status', ['available', 'locked'])

    const { count: completedJobs } = await supabase
        .from('jobs')
        .select('*', { count: 'exact', head: true })
        .eq('created_by', user.id)
        .eq('status', 'completed')

    return (
        <div className="p-8">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Manager Dashboard</h1>
                <p className="text-gray-500 mt-1">Quản lý công việc và duyệt bài nộp</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white rounded-xl p-6 shadow-sm border">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-purple-100 rounded-lg">
                            <Briefcase className="h-6 w-6 text-purple-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Tổng công việc</p>
                            <p className="text-2xl font-bold">{totalJobs || 0}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm border">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-yellow-100 rounded-lg">
                            <FileCheck className="h-6 w-6 text-yellow-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Chờ duyệt</p>
                            <p className="text-2xl font-bold text-yellow-600">{pendingReview || 0}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm border">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-100 rounded-lg">
                            <Clock className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Đang thực hiện</p>
                            <p className="text-2xl font-bold">{activeJobs || 0}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm border">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-green-100 rounded-lg">
                            <CheckCircle2 className="h-6 w-6 text-green-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Hoàn thành</p>
                            <p className="text-2xl font-bold text-green-600">{completedJobs || 0}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Link
                    href="/manager/create"
                    className="bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl p-6 hover:shadow-lg transition-all"
                >
                    <Briefcase className="h-8 w-8 mb-4" />
                    <h3 className="text-xl font-semibold mb-2">Tạo việc mới</h3>
                    <p className="text-purple-100">Đăng công việc mới cho CTV</p>
                </Link>

                <Link
                    href="/manager/review"
                    className="bg-white border-2 border-yellow-400 rounded-xl p-6 hover:shadow-lg transition-all"
                >
                    <div className="flex items-start justify-between">
                        <FileCheck className="h-8 w-8 text-yellow-600 mb-4" />
                        {(pendingReview || 0) > 0 && (
                            <span className="flex items-center gap-1 bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-sm">
                                <AlertCircle className="h-4 w-4" />
                                {pendingReview} mới
                            </span>
                        )}
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Duyệt bài nộp</h3>
                    <p className="text-gray-500">Xem và duyệt bài nộp từ CTV</p>
                </Link>
            </div>
        </div>
    )
}
