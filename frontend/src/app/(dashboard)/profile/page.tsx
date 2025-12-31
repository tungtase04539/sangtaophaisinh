'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
    User,
    Phone,
    Mail,
    Star,
    Shield,
    AlertTriangle,
    CheckCircle2,
    Save,
    MessageCircle
} from 'lucide-react'
import { getRankBadge } from '@/lib/utils'
import type { Profile } from '@/types/database'

export default function ProfilePage() {
    const router = useRouter()
    const supabase = createClient()
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [profile, setProfile] = useState<Profile | null>(null)
    const [userEmail, setUserEmail] = useState('')
    const [formData, setFormData] = useState({
        full_name: '',
        phone: '',
        zalo: '',
    })

    useEffect(() => {
        loadProfile()
    }, [])

    const loadProfile = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                router.push('/login')
                return
            }

            setUserEmail(user.email || '')

            const { data } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single()

            if (data) {
                setProfile(data)
                setFormData({
                    full_name: data.full_name || '',
                    phone: data.phone || '',
                    zalo: (data as any).zalo || '',
                })
            }
        } catch (error) {
            console.error('Error loading profile:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleSave = async () => {
        if (!profile) return

        setSaving(true)
        try {
            const { error } = await supabase
                .from('profiles')
                .update({
                    full_name: formData.full_name,
                    phone: formData.phone,
                    zalo: formData.zalo,
                })
                .eq('id', profile.id)

            if (error) throw error

            alert('Đã lưu thông tin!')
            router.refresh()
        } catch (error) {
            console.error('Error saving:', error)
            alert('Có lỗi xảy ra')
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            </div>
        )
    }

    if (!profile) return null

    const rankInfo = getRankBadge(profile.rank)
    const isVerified = (profile as any).is_verified

    return (
        <div className="p-8 max-w-2xl mx-auto">
            <h1 className="text-2xl font-bold text-gray-900 mb-8">Hồ sơ của tôi</h1>

            {/* Verification Warning */}
            {profile.role === 'ctv' && !isVerified && (
                <Card className="mb-6 border-amber-300 bg-amber-50">
                    <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                            <AlertTriangle className="h-8 w-8 text-amber-500 flex-shrink-0" />
                            <div>
                                <h3 className="font-semibold text-amber-800 mb-2">
                                    Tài khoản chưa được xác minh
                                </h3>
                                <p className="text-amber-700 text-sm mb-4">
                                    Để bắt đầu nhận việc, bạn cần liên hệ với Quản lý để được xác minh tài khoản.
                                    Vui lòng cập nhật thông tin liên hệ bên dưới và liên hệ qua Zalo.
                                </p>
                                <div className="flex items-center gap-2 text-amber-800">
                                    <MessageCircle className="h-5 w-5" />
                                    <span className="font-medium">Zalo Quản lý: 0123.456.789</span>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Verified Badge */}
            {profile.role === 'ctv' && isVerified && (
                <Card className="mb-6 border-green-300 bg-green-50">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <CheckCircle2 className="h-6 w-6 text-green-600" />
                            <span className="text-green-800 font-medium">
                                Tài khoản đã được xác minh - Bạn có thể nhận việc!
                            </span>
                        </div>
                    </CardContent>
                </Card>
            )}

            <div className="space-y-6">
                {/* Stats Cards */}
                <div className="grid grid-cols-3 gap-4">
                    <Card>
                        <CardContent className="p-4 text-center">
                            <Star className="h-6 w-6 text-amber-500 mx-auto mb-2" />
                            <p className="text-2xl font-bold text-gray-900">{profile.credit_score}</p>
                            <p className="text-sm text-gray-500">Điểm uy tín</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4 text-center">
                            <Badge className={`${rankInfo.color} mb-2`}>{rankInfo.label}</Badge>
                            <p className="text-sm text-gray-500 mt-2">Cấp bậc</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4 text-center">
                            <p className="text-2xl font-bold text-green-600">
                                {new Intl.NumberFormat('vi-VN').format(profile.balance)}đ
                            </p>
                            <p className="text-sm text-gray-500">Số dư</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Profile Form */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <User className="h-5 w-5 text-purple-600" />
                            Thông tin cá nhân
                        </CardTitle>
                        <CardDescription>
                            Cập nhật thông tin liên hệ để Quản lý có thể xác minh
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                <User className="inline h-4 w-4 mr-1" />
                                Họ và tên
                            </label>
                            <input
                                type="text"
                                value={formData.full_name}
                                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500"
                                placeholder="Nguyễn Văn A"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                <Phone className="inline h-4 w-4 mr-1" />
                                Số điện thoại
                            </label>
                            <input
                                type="tel"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500"
                                placeholder="0901234567"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                <MessageCircle className="inline h-4 w-4 mr-1" />
                                Zalo
                            </label>
                            <input
                                type="text"
                                value={formData.zalo}
                                onChange={(e) => setFormData({ ...formData, zalo: e.target.value })}
                                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500"
                                placeholder="Số Zalo hoặc link Zalo"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Nhập số điện thoại Zalo để Quản lý liên hệ
                            </p>
                        </div>

                        <Button
                            onClick={handleSave}
                            disabled={saving}
                            className="w-full"
                        >
                            {saving ? (
                                'Đang lưu...'
                            ) : (
                                <>
                                    <Save className="h-4 w-4 mr-2" />
                                    Lưu thông tin
                                </>
                            )}
                        </Button>
                    </CardContent>
                </Card>

                {/* Account Info */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Shield className="h-5 w-5 text-blue-600" />
                            Thông tin tài khoản
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                        <div className="flex justify-between">
                            <span className="text-gray-500">Email</span>
                            <span className="font-medium">{userEmail}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">Vai trò</span>
                            <Badge>{profile.role.toUpperCase()}</Badge>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">Đã ký thỏa thuận</span>
                            <span>{profile.agreed_to_terms ? '✅ Có' : '❌ Chưa'}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">Ngày tham gia</span>
                            <span>{new Date(profile.created_at).toLocaleDateString('vi-VN')}</span>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
