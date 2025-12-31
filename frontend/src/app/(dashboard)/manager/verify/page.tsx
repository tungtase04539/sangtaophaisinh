'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
    Users,
    CheckCircle2,
    XCircle,
    Phone,
    MessageCircle,
    ArrowLeft,
    Search,
    Shield
} from 'lucide-react'
import Link from 'next/link'
import { getRankBadge } from '@/lib/utils'

interface CTVProfile {
    id: string
    full_name: string | null
    phone: string | null
    zalo: string | null
    rank: string
    credit_score: number
    is_verified: boolean
    verified_at: string | null
    created_at: string
}

export default function VerifyCTVPage() {
    const supabase = createClient()
    const [loading, setLoading] = useState(true)
    const [ctvs, setCtvs] = useState<CTVProfile[]>([])
    const [filter, setFilter] = useState<'all' | 'pending' | 'verified'>('pending')
    const [verifying, setVerifying] = useState<string | null>(null)

    useEffect(() => {
        loadCTVs()
    }, [])

    const loadCTVs = async () => {
        try {
            const { data } = await supabase
                .from('profiles')
                .select('*')
                .eq('role', 'ctv')
                .order('created_at', { ascending: false })

            setCtvs(data || [])
        } catch (error) {
            console.error('Error loading CTVs:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleVerify = async (ctvId: string) => {
        if (!confirm('Xác nhận CTV này đã liên hệ và được phép nhận việc?')) return

        setVerifying(ctvId)
        try {
            const { data, error } = await supabase.rpc('verify_ctv', {
                p_ctv_id: ctvId,
                p_notes: 'Verified by manager'
            })

            if (error) throw error

            if (data?.success) {
                alert('Đã xác minh CTV!')
                loadCTVs()
            } else {
                alert(data?.message || 'Có lỗi xảy ra')
            }
        } catch (error) {
            console.error('Error verifying:', error)
            alert('Có lỗi xảy ra')
        } finally {
            setVerifying(null)
        }
    }

    const filteredCTVs = ctvs.filter(ctv => {
        if (filter === 'pending') return !ctv.is_verified
        if (filter === 'verified') return ctv.is_verified
        return true
    })

    const pendingCount = ctvs.filter(c => !c.is_verified).length

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            </div>
        )
    }

    return (
        <div className="p-8">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <Link href="/manager" className="p-2 hover:bg-gray-100 rounded-lg">
                    <ArrowLeft className="h-5 w-5" />
                </Link>
                <div className="flex-1">
                    <h1 className="text-2xl font-bold text-gray-900">Xác minh CTV</h1>
                    <p className="text-gray-500">Xác minh CTV mới đã liên hệ để cho phép nhận việc</p>
                </div>
                {pendingCount > 0 && (
                    <Badge className="bg-amber-100 text-amber-800 text-lg px-4 py-2">
                        {pendingCount} đang chờ
                    </Badge>
                )}
            </div>

            {/* Filters */}
            <div className="flex gap-2 mb-6">
                {(['pending', 'verified', 'all'] as const).map((f) => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`px-4 py-2 rounded-lg font-medium transition-all ${filter === f
                            ? 'bg-purple-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                    >
                        {f === 'pending' && 'Chờ xác minh'}
                        {f === 'verified' && 'Đã xác minh'}
                        {f === 'all' && 'Tất cả'}
                    </button>
                ))}
            </div>

            {/* CTV List */}
            <div className="space-y-4">
                {filteredCTVs.length === 0 ? (
                    <Card>
                        <CardContent className="p-8 text-center text-gray-500">
                            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>Không có CTV nào</p>
                        </CardContent>
                    </Card>
                ) : (
                    filteredCTVs.map((ctv) => {
                        const rankInfo = getRankBadge(ctv.rank)
                        return (
                            <Card key={ctv.id} className={ctv.is_verified ? 'border-green-200' : 'border-amber-200'}>
                                <CardContent className="p-6">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <h3 className="text-lg font-semibold">
                                                    {ctv.full_name || 'Chưa có tên'}
                                                </h3>
                                                {ctv.is_verified ? (
                                                    <Badge className="bg-green-100 text-green-800">
                                                        <CheckCircle2 className="h-3 w-3 mr-1" />
                                                        Đã xác minh
                                                    </Badge>
                                                ) : (
                                                    <Badge className="bg-amber-100 text-amber-800">
                                                        <XCircle className="h-3 w-3 mr-1" />
                                                        Chờ xác minh
                                                    </Badge>
                                                )}
                                                <Badge className={rankInfo.color}>{rankInfo.label}</Badge>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mt-4">
                                                <div className="flex items-center gap-2">
                                                    <Phone className="h-4 w-4 text-blue-500" />
                                                    <span>{ctv.phone || 'Chưa có SĐT'}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <MessageCircle className="h-4 w-4 text-blue-500" />
                                                    <span>{ctv.zalo || 'Chưa có Zalo'}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Shield className="h-4 w-4 text-purple-500" />
                                                    <span>Điểm: {ctv.credit_score}</span>
                                                </div>
                                                <div className="text-gray-400">
                                                    Tham gia: {new Date(ctv.created_at).toLocaleDateString('vi-VN')}
                                                </div>
                                            </div>

                                            {ctv.is_verified && ctv.verified_at && (
                                                <p className="text-xs text-green-600 mt-2">
                                                    Xác minh lúc: {new Date(ctv.verified_at).toLocaleString('vi-VN')}
                                                </p>
                                            )}
                                        </div>

                                        {!ctv.is_verified && (
                                            <Button
                                                onClick={() => handleVerify(ctv.id)}
                                                disabled={verifying === ctv.id}
                                                className="ml-4"
                                            >
                                                {verifying === ctv.id ? (
                                                    'Đang xử lý...'
                                                ) : (
                                                    <>
                                                        <CheckCircle2 className="h-4 w-4 mr-2" />
                                                        Xác minh
                                                    </>
                                                )}
                                            </Button>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        )
                    })
                )}
            </div>
        </div>
    )
}
