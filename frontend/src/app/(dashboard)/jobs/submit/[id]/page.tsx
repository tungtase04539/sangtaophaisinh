'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
    ArrowLeft,
    Upload,
    Link as LinkIcon,
    FileVideo,
    CheckCircle2,
    AlertTriangle,
    Clock,
    Loader2
} from 'lucide-react'
import Link from 'next/link'
import { formatCurrency } from '@/lib/utils'

export default function SubmitJobPage() {
    const router = useRouter()
    const params = useParams()
    const jobId = params.id as string

    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [success, setSuccess] = useState(false)
    const [job, setJob] = useState<any>(null)
    const [error, setError] = useState('')

    const supabase = createClient()

    // Form state
    const [formData, setFormData] = useState({
        video_url: '',
        drive_link: '',
        notes: '',
        confirm_derivative: false,
        confirm_no_copyright: false,
    })

    // Load job data
    useEffect(() => {
        async function loadJob() {
            const { data, error } = await supabase
                .from('jobs')
                .select('*')
                .eq('id', jobId)
                .single()

            if (error || !data) {
                setError('Không tìm thấy công việc')
                setLoading(false)
                return
            }

            // Check if user owns this job
            const { data: { user } } = await supabase.auth.getUser()
            if (data.locked_by !== user?.id) {
                setError('Bạn không có quyền nộp công việc này')
                setLoading(false)
                return
            }

            if (data.status !== 'locked' && data.status !== 'rejected') {
                setError('Công việc này không thể nộp')
                setLoading(false)
                return
            }

            setJob(data)
            setLoading(false)
        }

        loadJob()
    }, [jobId, supabase])

    const updateField = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }))
    }

    const canSubmit = formData.video_url && formData.confirm_derivative && formData.confirm_no_copyright

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!canSubmit || !job) return

        setSubmitting(true)

        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                router.push('/login')
                return
            }

            // Get current revision number
            const { count } = await supabase
                .from('submissions')
                .select('*', { count: 'exact', head: true })
                .eq('job_id', jobId)

            const revisionNumber = (count || 0) + 1

            // Create submission
            const { error: subError } = await supabase
                .from('submissions')
                .insert({
                    job_id: jobId,
                    submitted_by: user.id,
                    video_url: formData.video_url,
                    drive_link: formData.drive_link || null,
                    notes: formData.notes || null,
                    revision_number: revisionNumber,
                    is_reviewed: false,
                })

            if (subError) throw subError

            // Update job status
            const { error: jobError } = await supabase
                .from('jobs')
                .update({ status: 'submitted' })
                .eq('id', jobId)

            if (jobError) throw jobError

            setSuccess(true)
            setTimeout(() => {
                router.push('/jobs/my-jobs')
                router.refresh()
            }, 2000)
        } catch (error) {
            console.error('Submit error:', error)
            alert('Có lỗi xảy ra khi nộp bài')
        } finally {
            setSubmitting(false)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
            </div>
        )
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Card className="max-w-md">
                    <CardContent className="p-6 text-center">
                        <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                        <p className="text-gray-700 mb-4">{error}</p>
                        <Link href="/jobs/my-jobs">
                            <Button variant="outline">Quay lại</Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>
        )
    }

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Nộp bài thành công!</h2>
                    <p className="text-gray-500">Bài nộp đang chờ Manager duyệt</p>
                </div>
            </div>
        )
    }

    return (
        <div className="p-8 max-w-3xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <Link href="/jobs/my-jobs" className="p-2 hover:bg-gray-100 rounded-lg">
                    <ArrowLeft className="h-5 w-5" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Nộp bài</h1>
                    <p className="text-gray-500">{job?.title}</p>
                </div>
            </div>

            {/* Job Summary */}
            <Card className="mb-6 bg-purple-50 border-purple-200">
                <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Clock className="h-5 w-5 text-purple-600" />
                            <span className="text-sm text-gray-600">
                                Deadline: {job?.deadline ? new Date(job.deadline).toLocaleString('vi-VN') : 'N/A'}
                            </span>
                        </div>
                        <span className="font-semibold text-purple-600">
                            {formatCurrency(job?.pricing_data?.final_price || 0)}
                        </span>
                    </div>
                </CardContent>
            </Card>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Video URL */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FileVideo className="h-5 w-5 text-blue-500" />
                            Link video đã hoàn thành
                        </CardTitle>
                        <CardDescription>
                            Nhập link video (YouTube, Google Drive, v.v.)
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <input
                            type="url"
                            value={formData.video_url}
                            onChange={(e) => updateField('video_url', e.target.value)}
                            required
                            className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500"
                            placeholder="https://youtube.com/watch?v=..."
                        />
                    </CardContent>
                </Card>

                {/* Drive Link */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <LinkIcon className="h-5 w-5 text-emerald-500" />
                            Link file gốc (tùy chọn)
                        </CardTitle>
                        <CardDescription>
                            Link Google Drive chứa file project, file phụ đề, v.v.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <input
                            type="url"
                            value={formData.drive_link}
                            onChange={(e) => updateField('drive_link', e.target.value)}
                            className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500"
                            placeholder="https://drive.google.com/..."
                        />
                    </CardContent>
                </Card>

                {/* Notes */}
                <Card>
                    <CardHeader>
                        <CardTitle>Ghi chú</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <textarea
                            value={formData.notes}
                            onChange={(e) => updateField('notes', e.target.value)}
                            rows={3}
                            className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500"
                            placeholder="Ghi chú về bài nộp (nếu có)..."
                        />
                    </CardContent>
                </Card>

                {/* Confirmations */}
                <Card className="border-amber-200 bg-amber-50">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-amber-800">
                            <AlertTriangle className="h-5 w-5" />
                            Xác nhận trước khi nộp
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <label className="flex items-start gap-3 cursor-pointer p-3 bg-white rounded-lg border">
                            <input
                                type="checkbox"
                                checked={formData.confirm_derivative}
                                onChange={(e) => updateField('confirm_derivative', e.target.checked)}
                                className="mt-1 h-5 w-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                            />
                            <div>
                                <p className="font-medium text-gray-900">Đây là tác phẩm phái sinh</p>
                                <p className="text-sm text-gray-500">
                                    Tôi đã TẠO LẠI nội dung (quay màn hình mới) chứ KHÔNG chỉ thêm phụ đề vào video gốc.
                                </p>
                            </div>
                        </label>

                        <label className="flex items-start gap-3 cursor-pointer p-3 bg-white rounded-lg border">
                            <input
                                type="checkbox"
                                checked={formData.confirm_no_copyright}
                                onChange={(e) => updateField('confirm_no_copyright', e.target.checked)}
                                className="mt-1 h-5 w-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                            />
                            <div>
                                <p className="font-medium text-gray-900">Không vi phạm bản quyền</p>
                                <p className="text-sm text-gray-500">
                                    Nội dung không chứa tài liệu vi phạm bản quyền hoặc nội dung nhạy cảm.
                                </p>
                            </div>
                        </label>
                    </CardContent>
                </Card>

                {/* Submit */}
                <div className="flex items-center justify-end gap-4">
                    <Link href="/jobs/my-jobs">
                        <Button variant="outline" type="button">Hủy</Button>
                    </Link>
                    <Button
                        type="submit"
                        disabled={!canSubmit || submitting}
                        loading={submitting}
                    >
                        <Upload className="h-4 w-4 mr-2" />
                        {submitting ? 'Đang nộp...' : 'Nộp bài'}
                    </Button>
                </div>
            </form>
        </div>
    )
}
