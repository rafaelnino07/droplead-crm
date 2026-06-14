import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '../types/database'

export async function getSupabaseServer() {
    const cookieStore = cookies()

    return createServerClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll: () => cookieStore.getAll(),
                setAll: (cookiesToSet) => {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        )
                    } catch {
                        // Safe to ignore in Server Components
                    }
                },
            },
        }
    )
}

export async function getActiveOrganizationId(
    supabase: Awaited<ReturnType<typeof getSupabaseServer>>,
    userId: string
): Promise<string> {
    const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('user_id', userId)
        .maybeSingle()

    const cookieStore = cookies()
    const impersonatedOrgId = cookieStore.get('impersonated_org_id')?.value

    if (impersonatedOrgId) {
        const { data: superAdmin } = await supabase
            .from('super_admins')
            .select('id')
            .eq('user_id', userId)
            .maybeSingle()

        if (superAdmin) return impersonatedOrgId
    }

    return profile?.organization_id ?? ''
}