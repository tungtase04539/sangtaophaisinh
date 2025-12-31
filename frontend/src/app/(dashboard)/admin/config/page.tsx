'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
    ArrowLeft,
    DollarSign,
    Clock,
    Star,
    Save,
    AlertCircle,
    CheckCircle2,
    Loader2
} from 'lucide-react'
import Link from 'next/link'

export default function ConfigPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [saved, setSaved] = useState(false)
    const supabase = createClient()

    // Config state
    const [pricingConfig, setPricingConfig] = useState({
        base_rate_per_word: 50,
        base_rate_per_minute: 5000,
        re_record_bonus_percent: 20,
        base_deadline_hours: 6,
    })

    const [rankLimits, setRankLimits] = useState([
        { rank: 'newbie', max_concurrent_jobs: 1, min_credit_score: 0 },
        { rank: 'regular', max_concurrent_jobs: 2, min_credit_score: 60 },
        { rank: 'trusted', max_concurrent_jobs: 3, min_credit_score: 80 },
        { rank: 'expert', max_concurrent_jobs: 5, min_credit_score: 95 },
    ])

    // Load config
    useEffect(() => {
        async function loadConfig() {
            // Load pricing config
            const { data: pricing } = await supabase
                .from('pricing_config')
                .select('*')
                .single()

            if (pricing) {
                setPricingConfig({
                    base_rate_per_word: pricing.base_rate_per_word,
                    base_rate_per_minute: pricing.base_rate_per_minute,
                    re_record_bonus_percent: pricing.re_record_bonus_percent,
                    base_deadline_hours: pricing.base_deadline_hours,
                })
            }

            // Load rank limits
            const { data: ranks } = await supabase
                .from('rank_limits')
                .select('*')
                .order('min_credit_score', { ascending: true })

            if (ranks && ranks.length > 0) {
                setRankLimits(ranks)
            }

            setLoading(false)
        }

        loadConfig()
    }, [supabase])

    const handleSave = async () => {
        setSaving(true)

        try {
            // Update pricing config
            const { error: pricingError } = await supabase
                .from('pricing_config')
                .upsert({
                    id: 1, // Single config row
                    ...pricingConfig,
                    updated_at: new Date().toISOString(),
                })

            if (pricingError) throw pricingError

            // Update rank limits
            for (const rank of rankLimits) {
                const { error: rankError } = await supabase
                    .from('rank_limits')
                    .upsert({
                        rank: rank.rank,
                        max_concurrent_jobs: rank.max_concurrent_jobs,
                        min_credit_score: rank.min_credit_score,
                    })

                if (rankError) throw rankError
            }

            setSaved(true)
            setTimeout(() => setSaved(false), 3000)
        } catch (error) {
            console.error('Save error:', error)
            alert('Có lỗi xảy ra khi lưu cấu hình')
        } finally {
            setSaving(false)
        }
    }

    const updatePricing = (field: string, value: number) => {
        setPricingConfig(prev => ({ ...prev, [field]: value }))
    }

    const updateRankLimit = (index: number, field: string, value: number) => {
        setRankLimits(prev => {
            const updated = [...prev]
            updated[index] = { ...updated[index], [field]: value }
            return updated
        })
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
            </div>
        )
    }

    return (
        <div className="p-8 max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <Link href="/admin" className="p-2 hover:bg-gray-100 rounded-lg">
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Cấu hình hệ thống</h1>
                        <p className="text-gray-500">Cài đặt giá và giới hạn rank</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {saved && (
                        <span className="flex items-center gap-1 text-green-600">
                            <CheckCircle2 className="h-5 w-5" />
                            Đã lưu
                        </span>
                    )}
                    <Button onClick={handleSave} loading={saving} disabled={saving}>
                        <Save className="h-4 w-4 mr-2" />
                        {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
                    </Button>
                </div>
            </div>

            <div className="space-y-6">
                {/* Pricing Config */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <DollarSign className="h-5 w-5 text-emerald-500" />
                            Cấu hình giá
                        </CardTitle>
                        <CardDescription>
                            Thiết lập mức giá cơ bản cho công việc
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Giá/từ (VND)
                                </label>
                                <input
                                    type="number"
                                    value={pricingConfig.base_rate_per_word}
                                    onChange={(e) => updatePricing('base_rate_per_word', parseInt(e.target.value) || 0)}
                                    className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Giá/phút video (VND)
                                </label>
                                <input
                                    type="number"
                                    value={pricingConfig.base_rate_per_minute}
                                    onChange={(e) => updatePricing('base_rate_per_minute', parseInt(e.target.value) || 0)}
                                    className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Thưởng quay lại (%)
                                </label>
                                <input
                                    type="number"
                                    value={pricingConfig.re_record_bonus_percent}
                                    onChange={(e) => updatePricing('re_record_bonus_percent', parseInt(e.target.value) || 0)}
                                    className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Deadline cơ bản (giờ)
                                </label>
                                <input
                                    type="number"
                                    value={pricingConfig.base_deadline_hours}
                                    onChange={(e) => updatePricing('base_deadline_hours', parseInt(e.target.value) || 0)}
                                    className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500"
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Rank Limits */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Star className="h-5 w-5 text-amber-500" />
                            Giới hạn theo Rank
                        </CardTitle>
                        <CardDescription>
                            Số công việc tối đa CTV có thể giữ đồng thời theo rank
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {rankLimits.map((rank, index) => (
                                <div key={rank.rank} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                                    <div className="w-24">
                                        <span className="font-medium capitalize">{rank.rank}</span>
                                    </div>
                                    <div className="flex-1 grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs text-gray-500 mb-1">
                                                Công việc tối đa
                                            </label>
                                            <input
                                                type="number"
                                                value={rank.max_concurrent_jobs}
                                                onChange={(e) => updateRankLimit(index, 'max_concurrent_jobs', parseInt(e.target.value) || 1)}
                                                min="1"
                                                className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-gray-500 mb-1">
                                                Điểm uy tín tối thiểu
                                            </label>
                                            <input
                                                type="number"
                                                value={rank.min_credit_score}
                                                onChange={(e) => updateRankLimit(index, 'min_credit_score', parseInt(e.target.value) || 0)}
                                                min="0"
                                                max="100"
                                                className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500"
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Warning */}
                <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                    <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-amber-800">
                        <p className="font-medium">Lưu ý quan trọng</p>
                        <p>Thay đổi cấu hình sẽ ảnh hưởng đến tất cả công việc mới. Công việc đã tạo sẽ không bị ảnh hưởng.</p>
                    </div>
                </div>
            </div>
        </div>
    )
}
