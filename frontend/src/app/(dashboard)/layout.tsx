import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/layout/sidebar'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Get user profile
    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

    // Check if CTV needs to sign agreement
    if (profile?.role === 'ctv' && (!profile.agreed_to_terms || !profile.liability_waiver_signed)) {
        redirect('/agreement')
    }

    return (
        <div className="flex min-h-screen bg-gray-50">
            <Sidebar
                role={profile?.role || 'ctv'}
                userName={profile?.full_name || user.email}
                userId={user.id}
            />
            <main className="flex-1 overflow-auto">
                {children}
            </main>
        </div>
    )
}
