import { cn } from '@/lib/utils'

interface BadgeProps {
    children: React.ReactNode
    className?: string
    variant?: 'default' | 'secondary' | 'success' | 'warning' | 'destructive'
}

export function Badge({ children, className, variant = 'default' }: BadgeProps) {
    const variants = {
        default: 'bg-purple-100 text-purple-800',
        secondary: 'bg-gray-100 text-gray-800',
        success: 'bg-green-100 text-green-800',
        warning: 'bg-yellow-100 text-yellow-800',
        destructive: 'bg-red-100 text-red-800',
    }

    return (
        <span className={cn(
            'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
            variants[variant],
            className
        )}>
            {children}
        </span>
    )
}
