import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
    Users,
    Briefcase,
    DollarSign,
    TrendingUp,
    Settings,
    UserCheck,
    Clock,
    CheckCircle2
} from 'lucide-react'

export default async function AdminDashboard() {
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

    if (profile?.role !== 'admin') {
        redirect('/jobs')
    }

    // Get stats
    const { count: totalUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })

    const { count: totalCTVs } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'ctv')

    const { count: totalJobs } = await supabase
        .from('jobs')
        .select('*', { count: 'exact', head: true })

    const { count: completedJobs } = await supabase
        .from('jobs')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'completed')

    const { count: pendingJobs } = await supabase
        .from('jobs')
        .select('*', { count: 'exact', head: true })
        .in('status', ['available', 'locked', 'submitted'])

    // Get total payouts (sum of approved jobs)
    const { data: approvedJobs } = await supabase
        .from('jobs')
        .select('pricing_data')
        .eq('status', 'approved')

    const totalPayouts = approvedJobs?.reduce((sum, job) =>
        sum + (job.pricing_data?.final_price || 0), 0
    ) || 0

    return (
        <div className="p-8">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
                <p className="text-gray-500 mt-1">Quản lý hệ thống</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white rounded-xl p-6 shadow-sm border">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-purple-100 rounded-lg">
                            <Users className="h-6 w-6 text-purple-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Tổng người dùng</p>
                            <p className="text-2xl font-bold">{totalUsers || 0}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm border">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-100 rounded-lg">
                            <UserCheck className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Số CTV</p>
                            <p className="text-2xl font-bold">{totalCTVs || 0}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm border">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-emerald-100 rounded-lg">
                            <Briefcase className="h-6 w-6 text-emerald-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Tổng công việc</p>
                            <p className="text-2xl font-bold">{totalJobs || 0}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm border">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-amber-100 rounded-lg">
                            <DollarSign className="h-6 w-6 text-amber-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Tổng chi trả</p>
                            <p className="text-xl font-bold text-amber-600">
                                {new Intl.NumberFormat('vi-VN', {
                                    style: 'currency',
                                    currency: 'VND',
                                    maximumFractionDigits: 0
                                }).format(totalPayouts)}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Secondary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl p-6 border border-purple-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Đang xử lý</p>
                            <p className="text-3xl font-bold text-purple-600">{pendingJobs || 0}</p>
                        </div>
                        <Clock className="h-10 w-10 text-purple-400" />
                    </div>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Hoàn thành</p>
                            <p className="text-3xl font-bold text-green-600">{completedJobs || 0}</p>
                        </div>
                        <CheckCircle2 className="h-10 w-10 text-green-400" />
                    </div>
                </div>

                <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-xl p-6 border border-amber-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Tỷ lệ hoàn thành</p>
                            <p className="text-3xl font-bold text-amber-600">
                                {totalJobs ? Math.round(((completedJobs || 0) / totalJobs) * 100) : 0}%
                            </p>
                        </div>
                        <TrendingUp className="h-10 w-10 text-amber-400" />
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Link
                    href="/admin/users"
                    className="bg-white border-2 border-gray-200 rounded-xl p-6 hover:border-purple-400 hover:shadow-lg transition-all"
                >
                    <Users className="h-8 w-8 text-purple-600 mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Quản lý người dùng</h3>
                    <p className="text-gray-500">Xem, chỉnh sửa vai trò và quản lý người dùng</p>
                </Link>

                <Link
                    href="/admin/config"
                    className="bg-white border-2 border-gray-200 rounded-xl p-6 hover:border-blue-400 hover:shadow-lg transition-all"
                >
                    <Settings className="h-8 w-8 text-blue-600 mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Cấu hình hệ thống</h3>
                    <p className="text-gray-500">Cài đặt giá, rank limits và cấu hình khác</p>
                </Link>
            </div>
        </div>
    )
}
