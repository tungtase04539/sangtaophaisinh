import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
    }).format(amount)
}

export function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    })
}

export function formatDeadline(deadlineString: string): string {
    const deadline = new Date(deadlineString)
    const now = new Date()
    const diff = deadline.getTime() - now.getTime()

    if (diff <= 0) return 'Quá hạn'

    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

    if (hours > 24) {
        const days = Math.floor(hours / 24)
        return `${days} ngày ${hours % 24}h`
    }

    return `${hours}h ${minutes}m`
}

export function getComplexityColor(complexity: string): string {
    switch (complexity) {
        case 'easy': return 'bg-green-100 text-green-800'
        case 'medium': return 'bg-yellow-100 text-yellow-800'
        case 'hard': return 'bg-orange-100 text-orange-800'
        case 'expert': return 'bg-red-100 text-red-800'
        default: return 'bg-gray-100 text-gray-800'
    }
}

export function getStatusColor(status: string): string {
    switch (status) {
        case 'available': return 'bg-blue-100 text-blue-800'
        case 'locked': return 'bg-purple-100 text-purple-800'
        case 'submitted': return 'bg-yellow-100 text-yellow-800'
        case 'approved': return 'bg-green-100 text-green-800'
        case 'rejected': return 'bg-red-100 text-red-800'
        case 'disputed': return 'bg-orange-100 text-orange-800'
        case 'completed': return 'bg-emerald-100 text-emerald-800'
        case 'cancelled': return 'bg-gray-100 text-gray-800'
        default: return 'bg-gray-100 text-gray-800'
    }
}

export function getRankBadge(rank: string): { label: string; color: string } {
    switch (rank) {
        case 'newbie': return { label: 'Tân binh', color: 'bg-gray-100 text-gray-800' }
        case 'bronze': return { label: 'Đồng', color: 'bg-amber-100 text-amber-800' }
        case 'silver': return { label: 'Bạc', color: 'bg-slate-200 text-slate-800' }
        case 'gold': return { label: 'Vàng', color: 'bg-yellow-100 text-yellow-800' }
        case 'platinum': return { label: 'Bạch kim', color: 'bg-purple-100 text-purple-800' }
        default: return { label: rank, color: 'bg-gray-100 text-gray-800' }
    }
}

export function getRankColor(rank: string): string {
    switch (rank) {
        case 'newbie': return 'bg-gray-100 text-gray-800'
        case 'regular': return 'bg-blue-100 text-blue-800'
        case 'trusted': return 'bg-emerald-100 text-emerald-800'
        case 'expert': return 'bg-purple-100 text-purple-800'
        default: return 'bg-gray-100 text-gray-800'
    }
}
