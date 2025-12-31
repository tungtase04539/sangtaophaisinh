'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
    AlertTriangle,
    Shield,
    CheckCircle2,
    XCircle,
    RotateCcw,
    MapPin,
    Flag,
    Film
} from 'lucide-react'

interface ReviewFormProps {
    job: any
    submission: any
}

export function ReviewForm({ job, submission }: ReviewFormProps) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const supabase = createClient()

    // Form state
    const [formData, setFormData] = useState({
        is_political_safe: false,
        is_map_safe: false,
        is_derivative_work: false,
        no_copyright_violation: false,
        safety_notes: '',
        translation_accuracy: 3,
        video_quality: 3,
        overall_rating: 3,
        action: 'approve' as 'approve' | 'reject' | 'request_revision',
        feedback: '',
        bonus_amount: 0,
        deduction_amount: 0,
    })

    const allSafetyChecked = formData.is_political_safe && formData.is_map_safe &&
        formData.is_derivative_work && formData.no_copyright_violation

    const updateField = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            // Update submission
            const { error: submissionError } = await supabase
                .from('submissions')
                .update({
                    is_reviewed: true,
                    reviewed_at: new Date().toISOString(),
                    review_decision: formData.action === 'approve' ? 'approved' : formData.action === 'reject' ? 'rejected' : 'revision_requested',
                    review_notes: formData.feedback,
                    review_rating: formData.overall_rating,
                })
                .eq('id', submission.id)

            if (submissionError) throw submissionError

            // Update job status and safety flags
            let newStatus = job.status
            if (formData.action === 'approve') {
                newStatus = 'approved'
            } else if (formData.action === 'reject') {
                newStatus = 'rejected'
            } else {
                newStatus = 'rejected' // revision_requested
            }

            const { error: jobError } = await supabase
                .from('jobs')
                .update({
                    status: newStatus,
                    is_political_safe: formData.is_political_safe,
                    is_map_safe: formData.is_map_safe,
                    safety_reviewed_at: new Date().toISOString(),
                })
                .eq('id', job.id)

            if (jobError) throw jobError

            // If approved, update CTV balance
            if (formData.action === 'approve' && job.locked_by) {
                const finalAmount = job.pricing_data.final_price + (formData.bonus_amount || 0) - (formData.deduction_amount || 0)

                // Get current balance
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('balance')
                    .eq('id', job.locked_by)
                    .single()

                if (profile) {
                    await supabase
                        .from('profiles')
                        .update({
                            balance: profile.balance + finalAmount,
                            total_earned: profile.balance + finalAmount,
                        })
                        .eq('id', job.locked_by)
                }
            }

            router.push('/manager/review')
            router.refresh()
        } catch (error) {
            console.error('Review error:', error)
            alert('Có lỗi xảy ra khi gửi đánh giá')
        } finally {
            setLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* SAFETY VERIFICATION SECTION - CRITICAL */}
            <Card className="border-2 border-red-300 bg-red-50">
                <CardHeader className="pb-2">
                    <div className="flex items-center gap-2 text-red-700">
                        <Shield className="h-5 w-5" />
                        <CardTitle className="text-lg">⚠️ XÁC MINH AN TOÀN BẮT BUỘC</CardTitle>
                    </div>
                    <CardDescription className="text-red-600">
                        Bạn PHẢI xác minh TẤT CẢ các mục dưới đây trước khi phê duyệt. Không thể bỏ qua.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Political Safety */}
                    <label className="flex items-start gap-3 p-3 bg-white rounded-lg border cursor-pointer hover:border-purple-300">
                        <input
                            type="checkbox"
                            checked={formData.is_political_safe}
                            onChange={(e) => updateField('is_political_safe', e.target.checked)}
                            className="mt-1 h-5 w-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                        />
                        <div className="flex-1">
                            <div className="flex items-center gap-2 font-medium text-gray-900">
                                <Flag className="h-4 w-4 text-red-500" />
                                Không có nội dung chính trị nhạy cảm
                            </div>
                            <p className="text-sm text-gray-500 mt-1">
                                Tôi xác nhận nội dung KHÔNG chứa bất kỳ thông tin chính trị nhạy cảm nào có thể gây ra vấn đề pháp lý.
                            </p>
                        </div>
                    </label>

                    {/* Map Safety */}
                    <label className="flex items-start gap-3 p-3 bg-white rounded-lg border cursor-pointer hover:border-purple-300">
                        <input
                            type="checkbox"
                            checked={formData.is_map_safe}
                            onChange={(e) => updateField('is_map_safe', e.target.checked)}
                            className="mt-1 h-5 w-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                        />
                        <div className="flex-1">
                            <div className="flex items-center gap-2 font-medium text-gray-900">
                                <MapPin className="h-4 w-4 text-orange-500" />
                                Bản đồ tuân thủ pháp luật Việt Nam
                            </div>
                            <p className="text-sm text-gray-500 mt-1">
                                Tôi xác nhận tất cả bản đồ được hiển thị với đường biên giới chính xác theo quy định của Việt Nam.
                            </p>
                        </div>
                    </label>

                    {/* Derivative Work */}
                    <label className="flex items-start gap-3 p-3 bg-white rounded-lg border cursor-pointer hover:border-purple-300">
                        <input
                            type="checkbox"
                            checked={formData.is_derivative_work}
                            onChange={(e) => updateField('is_derivative_work', e.target.checked)}
                            className="mt-1 h-5 w-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                        />
                        <div className="flex-1">
                            <div className="flex items-center gap-2 font-medium text-gray-900">
                                <Film className="h-4 w-4 text-blue-500" />
                                Đây là tác phẩm phái sinh (quay lại màn hình)
                            </div>
                            <p className="text-sm text-gray-500 mt-1">
                                Tôi xác nhận CTV đã TẠO LẠI nội dung chứ KHÔNG phải chỉ thêm phụ đề vào video gốc.
                            </p>
                        </div>
                    </label>

                    {/* Copyright */}
                    <label className="flex items-start gap-3 p-3 bg-white rounded-lg border cursor-pointer hover:border-purple-300">
                        <input
                            type="checkbox"
                            checked={formData.no_copyright_violation}
                            onChange={(e) => updateField('no_copyright_violation', e.target.checked)}
                            className="mt-1 h-5 w-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                        />
                        <div className="flex-1">
                            <div className="flex items-center gap-2 font-medium text-gray-900">
                                <Shield className="h-4 w-4 text-green-500" />
                                Không vi phạm bản quyền
                            </div>
                            <p className="text-sm text-gray-500 mt-1">
                                Tôi xác nhận không phát hiện vi phạm bản quyền rõ ràng nào trong nội dung nộp.
                            </p>
                        </div>
                    </label>

                    {/* Safety Notes */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Ghi chú về an toàn (tùy chọn)
                        </label>
                        <textarea
                            value={formData.safety_notes}
                            onChange={(e) => updateField('safety_notes', e.target.value)}
                            rows={2}
                            className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500"
                            placeholder="Ghi chú nếu có vấn đề cần lưu ý..."
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Quality Rating */}
            <Card>
                <CardHeader>
                    <CardTitle>Đánh giá chất lượng</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Translation Accuracy */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Độ chính xác dịch thuật
                        </label>
                        <div className="flex gap-2">
                            {[1, 2, 3, 4, 5].map((value) => (
                                <button
                                    key={value}
                                    type="button"
                                    onClick={() => updateField('translation_accuracy', value)}
                                    className={`flex-1 text-center py-2 px-4 rounded-lg border cursor-pointer transition-all ${formData.translation_accuracy === value
                                            ? 'bg-purple-600 text-white border-purple-600'
                                            : 'bg-white hover:border-purple-300'
                                        }`}
                                >
                                    {value}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Video Quality */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Chất lượng video/audio
                        </label>
                        <div className="flex gap-2">
                            {[1, 2, 3, 4, 5].map((value) => (
                                <button
                                    key={value}
                                    type="button"
                                    onClick={() => updateField('video_quality', value)}
                                    className={`flex-1 text-center py-2 px-4 rounded-lg border cursor-pointer transition-all ${formData.video_quality === value
                                            ? 'bg-purple-600 text-white border-purple-600'
                                            : 'bg-white hover:border-purple-300'
                                        }`}
                                >
                                    {value}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Overall Rating */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Đánh giá tổng thể
                        </label>
                        <div className="flex gap-2">
                            {[1, 2, 3, 4, 5].map((value) => (
                                <button
                                    key={value}
                                    type="button"
                                    onClick={() => updateField('overall_rating', value)}
                                    className={`flex-1 text-center py-2 px-4 rounded-lg border cursor-pointer transition-all ${formData.overall_rating === value
                                            ? 'bg-purple-600 text-white border-purple-600'
                                            : 'bg-white hover:border-purple-300'
                                        }`}
                                >
                                    {value}
                                </button>
                            ))}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Decision */}
            <Card>
                <CardHeader>
                    <CardTitle>Quyết định</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                        <button
                            type="button"
                            onClick={() => updateField('action', 'approve')}
                            className={`p-4 rounded-lg border-2 cursor-pointer text-center transition-all ${formData.action === 'approve'
                                    ? 'border-green-500 bg-green-50'
                                    : 'border-gray-200 hover:border-green-300'
                                }`}
                        >
                            <CheckCircle2 className={`h-8 w-8 mx-auto mb-2 ${formData.action === 'approve' ? 'text-green-600' : 'text-gray-400'}`} />
                            <span className={`font-medium ${formData.action === 'approve' ? 'text-green-700' : 'text-gray-700'}`}>
                                Phê duyệt
                            </span>
                        </button>

                        <button
                            type="button"
                            onClick={() => updateField('action', 'request_revision')}
                            className={`p-4 rounded-lg border-2 cursor-pointer text-center transition-all ${formData.action === 'request_revision'
                                    ? 'border-yellow-500 bg-yellow-50'
                                    : 'border-gray-200 hover:border-yellow-300'
                                }`}
                        >
                            <RotateCcw className={`h-8 w-8 mx-auto mb-2 ${formData.action === 'request_revision' ? 'text-yellow-600' : 'text-gray-400'}`} />
                            <span className={`font-medium ${formData.action === 'request_revision' ? 'text-yellow-700' : 'text-gray-700'}`}>
                                Yêu cầu sửa
                            </span>
                        </button>

                        <button
                            type="button"
                            onClick={() => updateField('action', 'reject')}
                            className={`p-4 rounded-lg border-2 cursor-pointer text-center transition-all ${formData.action === 'reject'
                                    ? 'border-red-500 bg-red-50'
                                    : 'border-gray-200 hover:border-red-300'
                                }`}
                        >
                            <XCircle className={`h-8 w-8 mx-auto mb-2 ${formData.action === 'reject' ? 'text-red-600' : 'text-gray-400'}`} />
                            <span className={`font-medium ${formData.action === 'reject' ? 'text-red-700' : 'text-gray-700'}`}>
                                Từ chối
                            </span>
                        </button>
                    </div>

                    {/* Feedback */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Phản hồi cho CTV {formData.action !== 'approve' && <span className="text-red-500">*</span>}
                        </label>
                        <textarea
                            value={formData.feedback}
                            onChange={(e) => updateField('feedback', e.target.value)}
                            rows={3}
                            required={formData.action !== 'approve'}
                            className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500"
                            placeholder={formData.action === 'approve' ? 'Phản hồi tích cực (tùy chọn)...' : 'Giải thích lý do...'}
                        />
                    </div>

                    {/* Payout Adjustments (only for approve) */}
                    {formData.action === 'approve' && (
                        <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Thưởng thêm (VND)
                                </label>
                                <input
                                    type="number"
                                    value={formData.bonus_amount}
                                    onChange={(e) => updateField('bonus_amount', parseInt(e.target.value) || 0)}
                                    className="w-full border rounded-lg px-3 py-2"
                                    min="0"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Trừ tiền (VND)
                                </label>
                                <input
                                    type="number"
                                    value={formData.deduction_amount}
                                    onChange={(e) => updateField('deduction_amount', parseInt(e.target.value) || 0)}
                                    className="w-full border rounded-lg px-3 py-2"
                                    min="0"
                                />
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Submit Button */}
            <div className="flex items-center justify-between">
                {!allSafetyChecked && formData.action === 'approve' && (
                    <div className="flex items-center gap-2 text-red-600">
                        <AlertTriangle className="h-5 w-5" />
                        <span>Phải xác minh tất cả mục an toàn để phê duyệt</span>
                    </div>
                )}
                <div className="flex-1"></div>
                <Button
                    type="submit"
                    loading={loading}
                    disabled={loading || (formData.action === 'approve' && !allSafetyChecked)}
                    className="min-w-[150px]"
                >
                    {loading ? 'Đang xử lý...' : 'Gửi đánh giá'}
                </Button>
            </div>
        </form>
    )
}
