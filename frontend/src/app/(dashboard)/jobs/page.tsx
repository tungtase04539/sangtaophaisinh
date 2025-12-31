import { createClient } from '@/lib/supabase/server'
import { JobsGrid } from './jobs-grid'
import Link from 'next/link'
import { AlertTriangle, MessageCircle, User } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function JobsPage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    // Get available jobs
    const { data: jobs, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('status', 'available')
        .order('created_at', { ascending: false })

    // Get user profile for stats
    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single()

    // Check if CTV is verified
    const isVerified = (profile as any)?.is_verified

    // Get user's locked jobs count
    const { count: lockedCount } = await supabase
        .from('jobs')
        .select('*', { count: 'exact', head: true })
        .eq('locked_by', user?.id)
        .eq('status', 'locked')

    // Get rank limits
    const { data: rankLimit } = await supabase
        .from('rank_limits')
        .select('*')
        .eq('rank', profile?.rank || 'newbie')
        .single()

    return (
        <div className="p-8">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Việc làm có sẵn</h1>
                <p className="text-gray-500 mt-1">Chọn và nhận việc phù hợp với bạn</p>
            </div>

            {/* Verification Warning */}
            {profile?.role === 'ctv' && !isVerified && (
                <div className="mb-8 bg-amber-50 border-2 border-amber-300 rounded-xl p-6">
                    <div className="flex items-start gap-4">
                        <AlertTriangle className="h-8 w-8 text-amber-500 flex-shrink-0" />
                        <div className="flex-1">
                            <h3 className="font-bold text-amber-800 text-lg mb-2">
                                Tài khoản chưa được xác minh
                            </h3>
                            <p className="text-amber-700 mb-4">
                                Để bắt đầu nhận việc, bạn cần liên hệ với Quản lý để được xác minh tài khoản.
                                Vui lòng cập nhật thông tin liên hệ và liên hệ qua Zalo.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4">
                                <div className="flex items-center gap-2 text-amber-800 bg-amber-100 px-4 py-2 rounded-lg">
                                    <MessageCircle className="h-5 w-5" />
                                    <span className="font-medium">Zalo Quản lý: 0123.456.789</span>
                                </div>
                                <Link
                                    href="/profile"
                                    className="flex items-center gap-2 text-white bg-amber-600 hover:bg-amber-700 px-4 py-2 rounded-lg transition-colors"
                                >
                                    <User className="h-5 w-5" />
                                    <span>Cập nhật hồ sơ</span>
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Stats Bar */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="bg-white rounded-xl p-4 shadow-sm border">
                    <p className="text-sm text-gray-500">Việc đang giữ</p>
                    <p className="text-2xl font-bold text-purple-600">
                        {lockedCount || 0} / {rankLimit?.max_concurrent_jobs || 1}
                    </p>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-sm border">
                    <p className="text-sm text-gray-500">Điểm uy tín</p>
                    <p className="text-2xl font-bold text-blue-600">{profile?.credit_score || 100}</p>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-sm border">
                    <p className="text-sm text-gray-500">Số dư</p>
                    <p className="text-2xl font-bold text-emerald-600">
                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(profile?.balance || 0)}
                    </p>
                </div>
            </div>

            {/* Jobs Grid */}
            <JobsGrid
                initialJobs={jobs || []}
                canTakeMore={(lockedCount || 0) < (rankLimit?.max_concurrent_jobs || 1) && isVerified}
            />

            {/* Message for unverified */}
            {profile?.role === 'ctv' && !isVerified && (
                <div className="text-center py-8 text-gray-500">
                    <p>Bạn cần được xác minh để nhận việc</p>
                </div>
            )}
        </div>
    )
}

