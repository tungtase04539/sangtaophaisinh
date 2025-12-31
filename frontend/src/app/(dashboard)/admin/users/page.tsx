import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Shield, Star, AlertTriangle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { getRankColor } from '@/lib/utils'

export default async function UsersPage() {
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

    // Get all users
    const { data: users } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })

    const getRoleBadge = (role: string) => {
        switch (role) {
            case 'admin':
                return <Badge className="bg-red-100 text-red-800">Admin</Badge>
            case 'manager':
                return <Badge className="bg-purple-100 text-purple-800">Manager</Badge>
            case 'ctv':
                return <Badge className="bg-blue-100 text-blue-800">CTV</Badge>
            default:
                return <Badge>{role}</Badge>
        }
    }

    return (
        <div className="p-8">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <Link href="/admin" className="p-2 hover:bg-gray-100 rounded-lg">
                    <ArrowLeft className="h-5 w-5" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Quản lý người dùng</h1>
                    <p className="text-gray-500">{users?.length || 0} người dùng</p>
                </div>
            </div>

            {/* Users Table */}
            <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Người dùng</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vai trò</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rank</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Điểm uy tín</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Số dư</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {users?.map((u) => (
                            <tr key={u.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold">
                                            {u.full_name?.[0]?.toUpperCase() || 'U'}
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900">{u.full_name || 'N/A'}</p>
                                            <p className="text-sm text-gray-500">{u.id.slice(0, 8)}...</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    {getRoleBadge(u.role)}
                                </td>
                                <td className="px-6 py-4">
                                    {u.role === 'ctv' && (
                                        <Badge className={getRankColor(u.rank)}>
                                            <Star className="h-3 w-3 mr-1" />
                                            {u.rank}
                                        </Badge>
                                    )}
                                </td>
                                <td className="px-6 py-4">
                                    {u.role === 'ctv' && (
                                        <span className={`font-medium ${u.credit_score < 50 ? 'text-red-600' : u.credit_score < 80 ? 'text-amber-600' : 'text-green-600'}`}>
                                            {u.credit_score}
                                        </span>
                                    )}
                                </td>
                                <td className="px-6 py-4">
                                    <span className="font-medium">
                                        {new Intl.NumberFormat('vi-VN', {
                                            style: 'currency',
                                            currency: 'VND',
                                            maximumFractionDigits: 0
                                        }).format(u.balance || 0)}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        {u.agreed_to_terms ? (
                                            <Shield className="h-4 w-4 text-green-500" />
                                        ) : (
                                            <AlertTriangle className="h-4 w-4 text-amber-500" />
                                        )}
                                        <span className="text-xs text-gray-500">
                                            {u.agreed_to_terms ? 'Đã ký' : 'Chưa ký'}
                                        </span>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
