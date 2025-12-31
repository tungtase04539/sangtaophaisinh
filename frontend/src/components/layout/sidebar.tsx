'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
    Briefcase,
    FolderKanban,
    User,
    Settings,
    LogOut,
    LayoutDashboard,
    FileCheck,
    Users,
    Cog
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { NotificationBell } from './notification-bell'

interface SidebarProps {
    role: 'admin' | 'manager' | 'ctv'
    userName?: string
    userId?: string
}

export function Sidebar({ role, userName, userId }: SidebarProps) {
    const pathname = usePathname()
    const supabase = createClient()

    const handleLogout = async () => {
        await supabase.auth.signOut()
        window.location.href = '/login'
    }

    const ctvLinks = [
        { href: '/jobs', label: 'Việc làm', icon: Briefcase },
        { href: '/jobs/my-jobs', label: 'Việc của tôi', icon: FolderKanban },
        { href: '/profile', label: 'Hồ sơ', icon: User },
    ]

    const managerLinks = [
        { href: '/manager', label: 'Dashboard', icon: LayoutDashboard },
        { href: '/manager/create', label: 'Tạo việc mới', icon: Briefcase },
        { href: '/manager/review', label: 'Duyệt bài', icon: FileCheck },
        { href: '/profile', label: 'Hồ sơ', icon: User },
    ]

    const adminLinks = [
        { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
        { href: '/admin/users', label: 'Người dùng', icon: Users },
        { href: '/admin/config', label: 'Cấu hình', icon: Cog },
        { href: '/manager/review', label: 'Duyệt bài', icon: FileCheck },
    ]

    const links = role === 'admin' ? adminLinks : role === 'manager' ? managerLinks : ctvLinks

    return (
        <aside className="w-64 min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white flex flex-col">
            {/* Logo */}
            <div className="p-6 border-b border-gray-700">
                <h1 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                    Sáng Tạo Phái Sinh
                </h1>
                <p className="text-xs text-gray-400 mt-1">Content Localization</p>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-1">
                {links.map((link) => {
                    const isActive = pathname === link.href || pathname.startsWith(link.href + '/')
                    return (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={cn(
                                'flex items-center gap-3 px-4 py-3 rounded-lg transition-all',
                                isActive
                                    ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg'
                                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                            )}
                        >
                            <link.icon className="h-5 w-5" />
                            <span className="font-medium">{link.label}</span>
                        </Link>
                    )
                })}
            </nav>

            {/* User Section */}
            <div className="p-4 border-t border-gray-700">
                <div className="flex items-center gap-3 mb-4 px-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold">
                        {userName?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{userName || 'User'}</p>
                        <p className="text-xs text-gray-400 capitalize">{role}</p>
                    </div>
                    {userId && (
                        <NotificationBell userId={userId} userRole={role} />
                    )}
                </div>
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-2 text-gray-400 hover:text-red-400 hover:bg-gray-700 rounded-lg transition-all"
                >
                    <LogOut className="h-5 w-5" />
                    <span>Đăng xuất</span>
                </button>
            </div>
        </aside>
    )
}
