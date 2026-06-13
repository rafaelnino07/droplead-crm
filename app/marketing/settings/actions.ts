'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { getSupabaseServer } from '@/lib/supabase/server'

export async function saveMetaAdAccount(formData: FormData) {
    const supabase = await getSupabaseServer()

    const metaAccountId = String(formData.get('meta_account_id') ?? '').trim()
    const accessToken = String(formData.get('access_token') ?? '').trim()

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

    const { data: existing } = await supabase
        .from('meta_ad_accounts')
        .select('id')
        .eq('organization_id', profile.organization_id)
        .maybeSingle()

    const { error } = existing
        ? await supabase
              .from('meta_ad_accounts')
              .update({
                  meta_account_id: metaAccountId,
                  access_token_encrypted: accessToken,
                  is_active: true,
              })
              .eq('id', existing.id)
        : await supabase.from('meta_ad_accounts').insert({
              organization_id: profile.organization_id,
              meta_account_id: metaAccountId,
              access_token_encrypted: accessToken,
              account_name: null,
              last_synced_at: null,
              is_active: true,
          })

    if (error) {
        console.error('SAVE META AD ACCOUNT ERROR:', error)
        redirect(`/marketing/settings?error=${encodeURIComponent(error.message)}`)
    }

    revalidatePath('/marketing/settings')
    redirect('/marketing/settings')
}
