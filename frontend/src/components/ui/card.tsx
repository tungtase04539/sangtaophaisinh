import { cn } from '@/lib/utils'

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    gradient?: boolean
}

export function Card({ className, gradient, children, ...props }: CardProps) {
    return (
        <div
            className={cn(
                'rounded-2xl border border-gray-200 bg-white shadow-sm transition-all hover:shadow-md',
                gradient && 'bg-gradient-to-br from-white to-gray-50',
                className
            )}
            {...props}
        >
            {children}
        </div>
    )
}

export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div className={cn('flex flex-col space-y-1.5 p-6', className)} {...props} />
    )
}

export function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
    return (
        <h3 className={cn('text-xl font-semibold leading-none tracking-tight', className)} {...props} />
    )
}

export function CardDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
    return (
        <p className={cn('text-sm text-gray-500', className)} {...props} />
    )
}

export function CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
    return <div className={cn('p-6 pt-0', className)} {...props} />
}

export function CardFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div className={cn('flex items-center p-6 pt-0', className)} {...props} />
    )
}
