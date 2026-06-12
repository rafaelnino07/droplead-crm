'use server'

import { redirect } from 'next/navigation'
import { getSupabaseServer } from '@/lib/supabase/server'

export async function updateQuote(
    quoteId: string,
    formData: FormData
) {
    const supabase = await getSupabaseServer()

    const projectName = String(formData.get('project_name')).trim()
    const projectType = String(formData.get('project_type')).trim()
    const projectAddress = String(formData.get('project_address')).trim()
    const clientVision = String(formData.get('client_vision')).trim()
    const total = Number(formData.get('total') || 0)
    const notes = String(formData.get('notes')).trim()

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

    const { data: existingQuote } = await supabase
        .from('quotes')
        .select('id, status')
        .eq('id', quoteId)
        .eq('organization_id', profile.organization_id)
        .maybeSingle()

    if (!existingQuote) redirect('/clients')

    if (existingQuote.status !== 'draft') {
        redirect(`/quotes/${quoteId}?error=Solo puedes editar cotizaciones en borrador`)
    }

    const { error } = await supabase
        .from('quotes')
        .update({
            project_name: projectName,
            project_type: projectType || null,
            project_address: projectAddress || null,
            client_vision: clientVision || null,
            subtotal: total,
            taxable_amount: total,
            total,
            notes: notes || null,
            updated_at: new Date().toISOString(),
        })
        .eq('id', quoteId)
        .eq('organization_id', profile.organization_id)

    if (error) {
        redirect(`/quotes/${quoteId}/edit?error=${encodeURIComponent(error.message)}`)
    }

    redirect(`/quotes/${quoteId}`)
}