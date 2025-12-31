'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
    ArrowLeft,
    FileText,
    Video,
    Zap,
    DollarSign,
    Clock,
    Cpu,
    AlertCircle,
    CheckCircle2
} from 'lucide-react'
import Link from 'next/link'

type ComplexityLevel = 'easy' | 'medium' | 'hard' | 'expert'

interface PricingPreview {
    word_price: number
    video_price: number
    complexity_bonus: number
    re_record_bonus: number
    final_price: number
    deadline_hours: number
}

export default function CreateJobPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)
    const supabase = createClient()

    // Form state
    const [formData, setFormData] = useState({
        title: '',
        source_url: '',
        word_count: 0,
        video_duration_minutes: 0,
        complexity: 'medium' as ComplexityLevel,
        is_re_record_required: true,
        ai_tools_used: [] as string[],
        notes: '',
    })

    // Pricing preview
    const [pricing, setPricing] = useState<PricingPreview | null>(null)

    // Pricing rates (should match backend/services/pricing.py)
    const RATES = {
        base_rate_per_word: 50,
        base_rate_per_minute: 5000,
        complexity_multipliers: {
            easy: 1.0,
            medium: 1.2,
            hard: 1.5,
            expert: 2.0,
        },
        re_record_bonus_percent: 20,
        base_deadline_hours: 6,
    }

    // Calculate pricing preview
    useEffect(() => {
        if (formData.word_count > 0 || formData.video_duration_minutes > 0) {
            const multiplier = RATES.complexity_multipliers[formData.complexity]
            const word_price = formData.word_count * RATES.base_rate_per_word * multiplier
            const video_price = formData.video_duration_minutes * RATES.base_rate_per_minute * multiplier
            const base_price = word_price + video_price
            const complexity_bonus = base_price * (multiplier - 1)
            const re_record_bonus = formData.is_re_record_required ? base_price * (RATES.re_record_bonus_percent / 100) : 0
            const final_price = word_price + video_price + re_record_bonus

            const deadline_hours = RATES.base_deadline_hours +
                Math.ceil(formData.word_count / 1000) +
                Math.ceil(formData.video_duration_minutes / 60)

            setPricing({
                word_price,
                video_price,
                complexity_bonus,
                re_record_bonus,
                final_price,
                deadline_hours,
            })
        } else {
            setPricing(null)
        }
    }, [formData])

    const updateField = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }))
    }

    const handleAIToolToggle = (tool: string) => {
        setFormData(prev => ({
            ...prev,
            ai_tools_used: prev.ai_tools_used.includes(tool)
                ? prev.ai_tools_used.filter(t => t !== tool)
                : [...prev.ai_tools_used, tool]
        }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!pricing) return

        setLoading(true)

        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                router.push('/login')
                return
            }

            const { error } = await supabase
                .from('jobs')
                .insert({
                    title: formData.title,
                    source_url: formData.source_url || null,
                    word_count: formData.word_count,
                    video_duration_seconds: formData.video_duration_minutes * 60,
                    complexity: formData.complexity,
                    is_re_record_required: formData.is_re_record_required,
                    ai_metadata: {
                        ai_tools_used: formData.ai_tools_used,
                        notes: formData.notes,
                    },
                    pricing_data: {
                        word_price: pricing.word_price,
                        video_price: pricing.video_price,
                        complexity_bonus: pricing.complexity_bonus,
                        re_record_bonus: pricing.re_record_bonus,
                        final_price: pricing.final_price,
                    },
                    status: 'available',
                    created_by: user.id,
                })

            if (error) throw error

            setSuccess(true)
            setTimeout(() => {
                router.push('/manager')
                router.refresh()
            }, 2000)
        } catch (error) {
            console.error('Error creating job:', error)
            alert('Có lỗi xảy ra khi tạo công việc')
        } finally {
            setLoading(false)
        }
    }

    const AI_TOOLS = [
        'ChatGPT', 'Claude', 'Midjourney', 'Stable Diffusion',
        'ComfyUI', 'Runway', 'Pika', 'Suno', 'ElevenLabs'
    ]

    const formatCurrency = (amount: number) =>
        new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Tạo việc thành công!</h2>
                    <p className="text-gray-500">Đang chuyển hướng...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="p-8 max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <Link href="/manager" className="p-2 hover:bg-gray-100 rounded-lg">
                    <ArrowLeft className="h-5 w-5" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Tạo việc mới</h1>
                    <p className="text-gray-500">Đăng công việc cho CTV</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Form */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Basic Info */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Thông tin cơ bản</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Tiêu đề công việc <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.title}
                                        onChange={(e) => updateField('title', e.target.value)}
                                        required
                                        className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500"
                                        placeholder="VD: Hướng dẫn sử dụng ComfyUI cơ bản"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        URL nguồn (Video gốc)
                                    </label>
                                    <input
                                        type="url"
                                        value={formData.source_url}
                                        onChange={(e) => updateField('source_url', e.target.value)}
                                        className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500"
                                        placeholder="https://..."
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        {/* Content Details */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Chi tiết nội dung</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            <FileText className="inline h-4 w-4 mr-1" />
                                            Số từ cần dịch <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="number"
                                            value={formData.word_count || ''}
                                            onChange={(e) => updateField('word_count', parseInt(e.target.value) || 0)}
                                            required
                                            min="0"
                                            className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500"
                                            placeholder="VD: 2000"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            <Video className="inline h-4 w-4 mr-1" />
                                            Thời lượng video (phút) <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="number"
                                            value={formData.video_duration_minutes || ''}
                                            onChange={(e) => updateField('video_duration_minutes', parseInt(e.target.value) || 0)}
                                            required
                                            min="0"
                                            className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500"
                                            placeholder="VD: 15"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Độ phức tạp
                                    </label>
                                    <div className="grid grid-cols-4 gap-2">
                                        {(['easy', 'medium', 'hard', 'expert'] as const).map((level) => (
                                            <button
                                                key={level}
                                                type="button"
                                                onClick={() => updateField('complexity', level)}
                                                className={`py-2 px-4 rounded-lg border text-center transition-all ${formData.complexity === level
                                                    ? 'bg-purple-600 text-white border-purple-600'
                                                    : 'bg-white hover:border-purple-300'
                                                    }`}
                                            >
                                                {level === 'easy' && 'Dễ'}
                                                {level === 'medium' && 'TB'}
                                                {level === 'hard' && 'Khó'}
                                                {level === 'expert' && 'Pro'}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={formData.is_re_record_required}
                                            onChange={(e) => updateField('is_re_record_required', e.target.checked)}
                                            className="h-5 w-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                                        />
                                        <span className="text-sm font-medium text-gray-700">
                                            <Zap className="inline h-4 w-4 text-amber-500 mr-1" />
                                            Yêu cầu quay lại màn hình (+20% thù lao)
                                        </span>
                                    </label>
                                </div>
                            </CardContent>
                        </Card>

                        {/* AI Tools */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Cpu className="h-5 w-5 text-emerald-500" />
                                    Công cụ AI trong video
                                </CardTitle>
                                <CardDescription>Chọn các công cụ AI được sử dụng/giới thiệu trong video</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex flex-wrap gap-2">
                                    {AI_TOOLS.map((tool) => (
                                        <button
                                            key={tool}
                                            type="button"
                                            onClick={() => handleAIToolToggle(tool)}
                                            className={`px-3 py-1.5 rounded-full text-sm transition-all ${formData.ai_tools_used.includes(tool)
                                                ? 'bg-emerald-100 text-emerald-800 border-emerald-300 border'
                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                }`}
                                        >
                                            {tool}
                                        </button>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Notes */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Ghi chú cho CTV</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <textarea
                                    value={formData.notes}
                                    onChange={(e) => updateField('notes', e.target.value)}
                                    rows={3}
                                    className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500"
                                    placeholder="Hướng dẫn hoặc yêu cầu đặc biệt..."
                                />
                            </CardContent>
                        </Card>
                    </div>

                    {/* Pricing Preview Sidebar */}
                    <div className="lg:col-span-1">
                        <div className="sticky top-8">
                            <Card className="bg-gradient-to-br from-purple-50 to-blue-50 border-purple-200">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <DollarSign className="h-5 w-5 text-purple-600" />
                                        Xem trước giá
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {pricing ? (
                                        <>
                                            <div className="space-y-2 text-sm">
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Dịch văn bản</span>
                                                    <span>{formatCurrency(pricing.word_price)}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Video</span>
                                                    <span>{formatCurrency(pricing.video_price)}</span>
                                                </div>
                                                {pricing.re_record_bonus > 0 && (
                                                    <div className="flex justify-between text-amber-600">
                                                        <span>Quay lại (+20%)</span>
                                                        <span>+{formatCurrency(pricing.re_record_bonus)}</span>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="pt-3 border-t border-purple-200">
                                                <div className="flex justify-between items-baseline">
                                                    <span className="font-medium">Tổng thù lao</span>
                                                    <span className="text-2xl font-bold text-purple-600">
                                                        {formatCurrency(pricing.final_price)}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2 text-sm text-gray-600 bg-white p-3 rounded-lg">
                                                <Clock className="h-4 w-4" />
                                                <span>Deadline: ~{pricing.deadline_hours} giờ</span>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="text-center text-gray-500 py-4">
                                            <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                            <p className="text-sm">Nhập số từ và thời lượng video để xem giá</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            <Button
                                type="submit"
                                className="w-full mt-4"
                                disabled={loading || !pricing || !formData.title}
                                loading={loading}
                            >
                                {loading ? 'Đang tạo...' : 'Tạo công việc'}
                            </Button>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    )
}
