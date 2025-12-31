'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
    Shield,
    FileText,
    Film,
    AlertTriangle,
    CheckCircle2,
    ScrollText,
    Loader2
} from 'lucide-react'

export default function AgreementPage() {
    const router = useRouter()
    const [mounted, setMounted] = useState(false)
    const [agreements, setAgreements] = useState({
        terms_of_service: false,
        liability_waiver: false,
        derivative_work_requirement: false,
        content_guidelines: false,
        payment_terms: false,
    })
    const [loading, setLoading] = useState(false)

    const supabase = createClient()

    // Fix hydration issues
    useEffect(() => {
        setMounted(true)
    }, [])

    const allAgreed = Object.values(agreements).every(Boolean)

    const handleSubmit = async () => {
        if (!allAgreed) return

        setLoading(true)

        try {
            const { data: { user } } = await supabase.auth.getUser()

            if (!user) {
                router.push('/login')
                return
            }

            const { error } = await supabase
                .from('profiles')
                .update({
                    agreed_to_terms: true,
                    terms_agreed_at: new Date().toISOString(),
                    liability_waiver_signed: true,
                    waiver_signed_at: new Date().toISOString(),
                })
                .eq('id', user.id)

            if (error) {
                console.error('Error updating profile:', error)
                alert('Có lỗi xảy ra. Vui lòng thử lại.')
                return
            }

            router.push('/jobs')
            router.refresh()
        } catch (err) {
            console.error(err)
            alert('Có lỗi xảy ra')
        } finally {
            setLoading(false)
        }
    }

    const toggleAgreement = (key: keyof typeof agreements) => {
        setAgreements(prev => ({ ...prev, [key]: !prev[key] }))
    }

    if (!mounted) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-gray-900 flex items-center justify-center">
                <Loader2 className="h-8 w-8 text-purple-400 animate-spin" />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-gray-900 py-12 px-4">
            <div className="max-w-3xl mx-auto">
                {/* Header */}
                <div className="text-center mb-8">
                    <ScrollText className="h-16 w-16 mx-auto text-purple-400 mb-4" />
                    <h1 className="text-3xl font-bold text-white mb-2">
                        Thỏa thuận Cộng tác viên
                    </h1>
                    <p className="text-gray-400">
                        Vui lòng đọc và đồng ý với tất cả các điều khoản trước khi bắt đầu
                    </p>
                </div>

                {/* Agreement Cards */}
                <div className="space-y-4 mb-8">
                    {/* Terms of Service */}
                    <Card
                        className={`cursor-pointer transition-all ${agreements.terms_of_service ? 'border-green-500 bg-green-50' : 'bg-white'}`}
                        onClick={() => toggleAgreement('terms_of_service')}
                    >
                        <CardContent className="p-6">
                            <div className="flex items-start gap-4">
                                <div className={`p-2 rounded-lg ${agreements.terms_of_service ? 'bg-green-100' : 'bg-gray-100'}`}>
                                    {agreements.terms_of_service ? (
                                        <CheckCircle2 className="h-6 w-6 text-green-600" />
                                    ) : (
                                        <FileText className="h-6 w-6 text-gray-600" />
                                    )}
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-semibold text-gray-900">Điều khoản dịch vụ</h3>
                                    <p className="text-sm text-gray-600 mt-1">
                                        Tôi đồng ý với Điều khoản dịch vụ và Chính sách bảo mật của nền tảng.
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Liability Waiver */}
                    <Card
                        className={`cursor-pointer transition-all ${agreements.liability_waiver ? 'border-green-500 bg-green-50' : 'bg-white'}`}
                        onClick={() => toggleAgreement('liability_waiver')}
                    >
                        <CardContent className="p-6">
                            <div className="flex items-start gap-4">
                                <div className={`p-2 rounded-lg ${agreements.liability_waiver ? 'bg-green-100' : 'bg-red-100'}`}>
                                    {agreements.liability_waiver ? (
                                        <CheckCircle2 className="h-6 w-6 text-green-600" />
                                    ) : (
                                        <AlertTriangle className="h-6 w-6 text-red-600" />
                                    )}
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-semibold text-gray-900">Miễn trừ trách nhiệm pháp lý</h3>
                                    <p className="text-sm text-gray-600 mt-1">
                                        Tôi hiểu rằng tôi hoàn toàn chịu trách nhiệm về nội dung mình nộp. Nền tảng không chịu trách nhiệm về các vấn đề pháp lý phát sinh.
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Derivative Work Requirement */}
                    <Card
                        className={`cursor-pointer transition-all ${agreements.derivative_work_requirement ? 'border-green-500 bg-green-50' : 'bg-white'}`}
                        onClick={() => toggleAgreement('derivative_work_requirement')}
                    >
                        <CardContent className="p-6">
                            <div className="flex items-start gap-4">
                                <div className={`p-2 rounded-lg ${agreements.derivative_work_requirement ? 'bg-green-100' : 'bg-orange-100'}`}>
                                    {agreements.derivative_work_requirement ? (
                                        <CheckCircle2 className="h-6 w-6 text-green-600" />
                                    ) : (
                                        <Film className="h-6 w-6 text-orange-600" />
                                    )}
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-semibold text-gray-900">Yêu cầu tác phẩm phái sinh</h3>
                                    <p className="text-sm text-gray-600 mt-1">
                                        Tôi PHẢI tạo tác phẩm phái sinh (quay lại màn hình) và KHÔNG được chỉ thêm phụ đề vào video gốc.
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Content Guidelines */}
                    <Card
                        className={`cursor-pointer transition-all ${agreements.content_guidelines ? 'border-green-500 bg-green-50' : 'bg-white'}`}
                        onClick={() => toggleAgreement('content_guidelines')}
                    >
                        <CardContent className="p-6">
                            <div className="flex items-start gap-4">
                                <div className={`p-2 rounded-lg ${agreements.content_guidelines ? 'bg-green-100' : 'bg-blue-100'}`}>
                                    {agreements.content_guidelines ? (
                                        <CheckCircle2 className="h-6 w-6 text-green-600" />
                                    ) : (
                                        <Shield className="h-6 w-6 text-blue-600" />
                                    )}
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-semibold text-gray-900">Hướng dẫn nội dung</h3>
                                    <p className="text-sm text-gray-600 mt-1">
                                        Nội dung sẽ được xem xét về độ nhạy cảm chính trị và độ chính xác bản đồ.
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Payment Terms */}
                    <Card
                        className={`cursor-pointer transition-all ${agreements.payment_terms ? 'border-green-500 bg-green-50' : 'bg-white'}`}
                        onClick={() => toggleAgreement('payment_terms')}
                    >
                        <CardContent className="p-6">
                            <div className="flex items-start gap-4">
                                <div className={`p-2 rounded-lg ${agreements.payment_terms ? 'bg-green-100' : 'bg-purple-100'}`}>
                                    {agreements.payment_terms ? (
                                        <CheckCircle2 className="h-6 w-6 text-green-600" />
                                    ) : (
                                        <FileText className="h-6 w-6 text-purple-600" />
                                    )}
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-semibold text-gray-900">Điều khoản thanh toán</h3>
                                    <p className="text-sm text-gray-600 mt-1">
                                        Thanh toán được thực hiện sau khi Manager phê duyệt.
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Submit Button */}
                <div className="text-center">
                    <Button
                        onClick={handleSubmit}
                        disabled={!allAgreed || loading}
                        loading={loading}
                        className="px-12 py-4 text-lg"
                    >
                        {loading ? 'Đang xử lý...' : 'Tôi đồng ý và chấp nhận'}
                    </Button>

                    {!allAgreed && (
                        <p className="text-gray-400 mt-4 text-sm">
                            Vui lòng đồng ý với tất cả các điều khoản để tiếp tục
                        </p>
                    )}
                </div>
            </div>
        </div>
    )
}
