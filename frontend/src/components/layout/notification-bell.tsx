'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Bell, X, CheckCircle2, AlertTriangle, Clock, DollarSign } from 'lucide-react'

interface Notification {
    id: string
    type: 'job_approved' | 'job_rejected' | 'new_submission' | 'job_timeout' | 'payment'
    title: string
    message: string
    timestamp: Date
    read: boolean
}

export function NotificationBell({ userId, userRole }: { userId: string; userRole: string }) {
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [isOpen, setIsOpen] = useState(false)
    const supabase = createClient()

    const unreadCount = notifications.filter(n => !n.read).length

    useEffect(() => {
        // Subscribe to job status changes (for CTVs)
        if (userRole === 'ctv') {
            const jobChannel = supabase
                .channel('ctv-job-updates')
                .on(
                    'postgres_changes',
                    {
                        event: 'UPDATE',
                        schema: 'public',
                        table: 'jobs',
                        filter: `locked_by=eq.${userId}`,
                    },
                    (payload) => {
                        const newStatus = payload.new.status
                        const oldStatus = payload.old.status

                        if (newStatus !== oldStatus) {
                            let notification: Notification | null = null

                            if (newStatus === 'approved') {
                                notification = {
                                    id: crypto.randomUUID(),
                                    type: 'job_approved',
                                    title: '🎉 Bài nộp được duyệt!',
                                    message: `"${payload.new.title}" đã được phê duyệt. Tiền thưởng đã được cộng vào tài khoản.`,
                                    timestamp: new Date(),
                                    read: false,
                                }
                            } else if (newStatus === 'rejected') {
                                notification = {
                                    id: crypto.randomUUID(),
                                    type: 'job_rejected',
                                    title: '⚠️ Cần sửa lại',
                                    message: `"${payload.new.title}" cần được chỉnh sửa theo yêu cầu của Manager.`,
                                    timestamp: new Date(),
                                    read: false,
                                }
                            }

                            if (notification) {
                                setNotifications(prev => [notification!, ...prev].slice(0, 20))
                            }
                        }
                    }
                )
                .subscribe()

            return () => {
                supabase.removeChannel(jobChannel)
            }
        }

        // Subscribe to new submissions (for Managers)
        if (userRole === 'manager' || userRole === 'admin') {
            const submissionChannel = supabase
                .channel('manager-submissions')
                .on(
                    'postgres_changes',
                    {
                        event: 'INSERT',
                        schema: 'public',
                        table: 'submissions',
                    },
                    async (payload) => {
                        // Get job details
                        const { data: job } = await supabase
                            .from('jobs')
                            .select('title')
                            .eq('id', payload.new.job_id)
                            .single()

                        const notification: Notification = {
                            id: crypto.randomUUID(),
                            type: 'new_submission',
                            title: '📥 Bài nộp mới',
                            message: `Đã nhận bài nộp cho "${job?.title || 'Công việc'}"`,
                            timestamp: new Date(),
                            read: false,
                        }

                        setNotifications(prev => [notification, ...prev].slice(0, 20))
                    }
                )
                .subscribe()

            return () => {
                supabase.removeChannel(submissionChannel)
            }
        }
    }, [userId, userRole, supabase])

    const markAsRead = (id: string) => {
        setNotifications(prev =>
            prev.map(n => n.id === id ? { ...n, read: true } : n)
        )
    }

    const markAllAsRead = () => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    }

    const getIcon = (type: Notification['type']) => {
        switch (type) {
            case 'job_approved': return <CheckCircle2 className="h-5 w-5 text-green-500" />
            case 'job_rejected': return <AlertTriangle className="h-5 w-5 text-red-500" />
            case 'new_submission': return <Clock className="h-5 w-5 text-blue-500" />
            case 'payment': return <DollarSign className="h-5 w-5 text-emerald-500" />
            default: return <Bell className="h-5 w-5 text-gray-500" />
        }
    }

    return (
        <div className="relative">
            {/* Bell Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
                <Bell className="h-5 w-5 text-gray-600" />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown */}
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsOpen(false)}
                    />

                    {/* Panel */}
                    <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border z-50 overflow-hidden">
                        {/* Header */}
                        <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50">
                            <h3 className="font-semibold text-gray-900">Thông báo</h3>
                            {unreadCount > 0 && (
                                <button
                                    onClick={markAllAsRead}
                                    className="text-sm text-purple-600 hover:underline"
                                >
                                    Đánh dấu tất cả đã đọc
                                </button>
                            )}
                        </div>

                        {/* List */}
                        <div className="max-h-96 overflow-y-auto">
                            {notifications.length === 0 ? (
                                <div className="p-8 text-center text-gray-500">
                                    <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                    <p>Chưa có thông báo</p>
                                </div>
                            ) : (
                                notifications.map((notification) => (
                                    <div
                                        key={notification.id}
                                        onClick={() => markAsRead(notification.id)}
                                        className={`px-4 py-3 border-b cursor-pointer hover:bg-gray-50 transition-colors ${!notification.read ? 'bg-purple-50' : ''
                                            }`}
                                    >
                                        <div className="flex gap-3">
                                            <div className="flex-shrink-0 mt-0.5">
                                                {getIcon(notification.type)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-gray-900 text-sm">
                                                    {notification.title}
                                                </p>
                                                <p className="text-gray-600 text-sm line-clamp-2">
                                                    {notification.message}
                                                </p>
                                                <p className="text-gray-400 text-xs mt-1">
                                                    {notification.timestamp.toLocaleTimeString('vi-VN')}
                                                </p>
                                            </div>
                                            {!notification.read && (
                                                <div className="w-2 h-2 bg-purple-500 rounded-full flex-shrink-0" />
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    )
}
