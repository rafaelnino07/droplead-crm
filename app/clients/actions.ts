'use server'

import { redirect } from 'next/navigation'
import { getSupabaseServer } from '@/lib/supabase/server'

export async function createClient(formData: FormData) {
    const supabase = await getSupabaseServer()

    const name = String(formData.get('name')).trim()
    const email = String(formData.get('email')).trim()
    const phone = String(formData.get('phone')).trim()
    const company = String(formData.get('company')).trim()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) redirect('/login')

    const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('user_id', user.id)
        .maybeSingle()

    if (!profile) redirect('/onboarding')

    const { data: client, error } = await supabase
        .from('clients')
        .insert({
            organization_id: profile.organization_id,
            name,
            email: email || null,
            phone: phone || null,
            company: company || null,
        })
        .select('id, name')
        .single()

    if (error) {
        redirect(`/clients/new?error=${encodeURIComponent(error.message)}`)
    }

    const { error: activityError } = await supabase
        .from('client_activities')
        .insert({
            organization_id: profile.organization_id,
            client_id: client.id,
            created_by: user.id,
            type: 'client_created',
            title: 'Cliente creado',
            description: `Se creó el cliente ${client.name}.`,
            metadata: {
                source: 'manual',
            },
        })

    if (activityError) {
        console.error('CLIENT ACTIVITY ERROR:', activityError)
    }

    redirect('/clients')
}