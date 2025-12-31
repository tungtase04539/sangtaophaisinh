import { createClient } from '@/lib/supabase/server'
import { JobsGrid } from './jobs-grid'

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
                canTakeMore={(lockedCount || 0) < (rankLimit?.max_concurrent_jobs || 1)}
            />
        </div>
    )
}
