'use server'

import { redirect } from 'next/navigation'
import { getSupabaseServer } from '@/lib/supabase/server'

function createSlug(name: string) {
    return name
        .toLowerCase()
        .trim()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
}

export async function completeOnboarding(formData: FormData) {
    const supabase = await getSupabaseServer()

    const fullName = String(formData.get('full_name')).trim()
    const organizationName = String(formData.get('organization_name')).trim()
    const slug = createSlug(organizationName)

    if (!fullName || !organizationName) {
        redirect('/onboarding?error=Faltan datos obligatorios')
    }

    const {
        data: { user },
        error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
        redirect('/login')
    }

    const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle()

    if (existingProfile) {
        redirect('/dashboard')
    }

    let organizationId: string

    const { data: existingOrganization } = await supabase
        .from('organizations')
        .select('id')
        .eq('slug', slug)
        .maybeSingle()

    if (existingOrganization) {
        organizationId = existingOrganization.id
    } else {
        const { data: newOrganization, error: organizationError } = await supabase
            .from('organizations')
            .insert({
                name: organizationName,
                slug,
            })
            .select('id')
            .single()

        if (organizationError) {
            console.error('ORGANIZATION ERROR:', organizationError)

            redirect(
                `/onboarding?error=${encodeURIComponent(
                    organizationError.message
                )}`
            )
        }

        organizationId = newOrganization.id
    }

    const { error: profileError } = await supabase
        .from('profiles')
        .insert({
            id: user.id,
            user_id: user.id,
            organization_id: organizationId,
            full_name: fullName,
            email: user.email ?? '',
            role: 'owner',
        })

    if (profileError) {
        console.error('PROFILE ERROR:', profileError)

        redirect(
            `/onboarding?error=${encodeURIComponent(profileError.message)}`
        )
    }

    redirect('/dashboard')
}