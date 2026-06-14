import { NextResponse } from 'next/server'
import { getSupabaseServer } from '@/lib/supabase/server'

const META_API_VERSION = process.env.META_API_VERSION || 'v21.0'
const META_GRAPH_BASE = `https://graph.facebook.com/${META_API_VERSION}`
const METRICS_DATE_PRESET = 'last_30d'

type SupabaseServerClient = Awaited<ReturnType<typeof getSupabaseServer>>

type SyncSummary = {
    accounts_synced: number
    campaigns: number
    ad_sets: number
    ads: number
    metrics_rows: number
    errors: string[]
}

type GraphCampaign = {
    id: string
    name?: string
    status?: string
    objective?: string
    daily_budget?: string
    lifetime_budget?: string
}

type GraphAdSet = {
    id: string
    name?: string
    status?: string
    targeting?: unknown
}

type GraphAdCreative = {
    title?: string
    body?: string
    image_url?: string
    video_id?: string
    call_to_action_type?: string
    permalink_url?: string
}

type GraphAd = {
    id: string
    name?: string
    status?: string
    permalink_url?: string
    creative?: GraphAdCreative
}

type GraphAction = {
    action_type: string
    value: string
}

type GraphInsight = {
    date_start: string
    impressions?: string
    reach?: string
    clicks?: string
    ctr?: string
    cpm?: string
    cpc?: string
    spend?: string
    actions?: GraphAction[]
}

type GraphListResponse<T> = {
    data?: T[]
}

async function metaGraphGet<T>(
    path: string,
    accessToken: string,
    params: Record<string, string> = {}
): Promise<GraphListResponse<T>> {
    const url = new URL(`${META_GRAPH_BASE}${path}`)
    url.searchParams.set('access_token', accessToken)

    Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value))

    const response = await fetch(url.toString())
    const json = await response.json()

    if (!response.ok) {
        throw new Error(json?.error?.message || `Meta Graph API respondió con error ${response.status}`)
    }

    return json as GraphListResponse<T>
}

function leadsFromActions(actions?: GraphAction[]): number {
    if (!actions) return 0

    return actions
        .filter((action) => action.action_type.toLowerCase().includes('lead'))
        .reduce((sum, action) => sum + Number(action.value || 0), 0)
}

async function getVideoSourceUrl(videoId: string, accessToken: string): Promise<string | null> {
    try {
        const url = new URL(`${META_GRAPH_BASE}/${videoId}`)
        url.searchParams.set('fields', 'source')
        url.searchParams.set('access_token', accessToken)

        const response = await fetch(url.toString())
        const json = await response.json()

        return response.ok ? json?.source ?? null : null
    } catch {
        return null
    }
}

async function getCampaignSpend(campaignId: string, accessToken: string): Promise<number> {
    try {
        const response = await metaGraphGet<{ spend?: string }>(
            `/${campaignId}/insights`,
            accessToken,
            { fields: 'spend', date_preset: METRICS_DATE_PRESET }
        )

        return Number(response.data?.[0]?.spend || 0)
    } catch {
        return 0
    }
}

async function syncAdMetrics({
    supabase,
    organizationId,
    adId,
    metaAdId,
    accessToken,
    summary,
}: {
    supabase: SupabaseServerClient
    organizationId: string
    adId: string
    metaAdId: string
    accessToken: string
    summary: SyncSummary
}) {
    const insightsResponse = await metaGraphGet<GraphInsight>(
        `/${metaAdId}/insights`,
        accessToken,
        {
            fields: 'impressions,reach,clicks,ctr,cpm,cpc,spend,actions,date_start',
            date_preset: METRICS_DATE_PRESET,
            time_increment: '1',
            limit: '30',
        }
    )

    for (const insight of insightsResponse.data ?? []) {
        const { error: metricError } = await supabase
            .from('meta_ad_metrics')
            .upsert(
                {
                    ad_id: adId,
                    organization_id: organizationId,
                    date: insight.date_start,
                    impressions: Number(insight.impressions || 0),
                    reach: Number(insight.reach || 0),
                    clicks: Number(insight.clicks || 0),
                    ctr: Number(insight.ctr || 0),
                    cpm: Number(insight.cpm || 0),
                    cpc: Number(insight.cpc || 0),
                    spend: Number(insight.spend || 0),
                    leads: leadsFromActions(insight.actions),
                },
                { onConflict: 'ad_id,date' }
            )

        if (metricError) {
            summary.errors.push(`Métricas ${metaAdId} (${insight.date_start}): ${metricError.message}`)
            continue
        }

        summary.metrics_rows += 1
    }
}

async function syncAds({
    supabase,
    organizationId,
    adSetId,
    metaAdSetId,
    accessToken,
    summary,
}: {
    supabase: SupabaseServerClient
    organizationId: string
    adSetId: string
    metaAdSetId: string
    accessToken: string
    summary: SyncSummary
}) {
    const adsResponse = await metaGraphGet<GraphAd>(
        `/${metaAdSetId}/ads`,
        accessToken,
        {
            fields: 'id,name,status,permalink_url,creative{title,body,image_url,video_id,call_to_action_type,permalink_url}',
            limit: '100',
        }
    )

    for (const ad of adsResponse.data ?? []) {
        const videoUrl = ad.creative?.video_id
            ? await getVideoSourceUrl(ad.creative.video_id, accessToken)
            : null

        const { data: adRow, error: adError } = await supabase
            .from('meta_ads')
            .upsert(
                {
                    organization_id: organizationId,
                    ad_set_id: adSetId,
                    meta_ad_id: ad.id,
                    name: ad.name ?? null,
                    status: ad.status ?? null,
                    headline: ad.creative?.title ?? null,
                    body: ad.creative?.body ?? null,
                    image_url: ad.creative?.image_url ?? null,
                    video_url: videoUrl,
                    cta_type: ad.creative?.call_to_action_type ?? null,
                    permalink_url: ad.creative?.permalink_url ?? ad.permalink_url ?? null,
                },
                { onConflict: 'meta_ad_id' }
            )
            .select('id')
            .single()

        if (adError || !adRow) {
            summary.errors.push(`Ad ${ad.id}: ${adError?.message ?? 'error al guardar'}`)
            continue
        }

        summary.ads += 1

        await syncAdMetrics({
            supabase,
            organizationId,
            adId: adRow.id,
            metaAdId: ad.id,
            accessToken,
            summary,
        })
    }
}

async function syncAdSets({
    supabase,
    organizationId,
    campaignId,
    metaCampaignId,
    accessToken,
    summary,
}: {
    supabase: SupabaseServerClient
    organizationId: string
    campaignId: string
    metaCampaignId: string
    accessToken: string
    summary: SyncSummary
}) {
    const adSetsResponse = await metaGraphGet<GraphAdSet>(
        `/${metaCampaignId}/adsets`,
        accessToken,
        { fields: 'id,name,status,targeting', limit: '100' }
    )

    for (const adSet of adSetsResponse.data ?? []) {
        const { data: adSetRow, error: adSetError } = await supabase
            .from('meta_ad_sets')
            .upsert(
                {
                    organization_id: organizationId,
                    campaign_id: campaignId,
                    meta_adset_id: adSet.id,
                    name: adSet.name ?? null,
                    status: adSet.status ?? null,
                    targeting_summary: adSet.targeting ? JSON.stringify(adSet.targeting) : null,
                },
                { onConflict: 'meta_adset_id' }
            )
            .select('id')
            .single()

        if (adSetError || !adSetRow) {
            summary.errors.push(`Ad set ${adSet.id}: ${adSetError?.message ?? 'error al guardar'}`)
            continue
        }

        summary.ad_sets += 1

        await syncAds({
            supabase,
            organizationId,
            adSetId: adSetRow.id,
            metaAdSetId: adSet.id,
            accessToken,
            summary,
        })
    }
}

async function syncAdAccount({
    supabase,
    organizationId,
    adAccountId,
    metaAccountId,
    accessToken,
    summary,
}: {
    supabase: SupabaseServerClient
    organizationId: string
    adAccountId: string
    metaAccountId: string
    accessToken: string
    summary: SyncSummary
}) {
    const campaignsResponse = await metaGraphGet<GraphCampaign>(
        `/${metaAccountId}/campaigns`,
        accessToken,
        {
            fields: 'id,name,status,objective,daily_budget,lifetime_budget',
            limit: '100',
        }
    )



    for (const campaign of campaignsResponse.data ?? []) {
        const totalSpend = await getCampaignSpend(campaign.id, accessToken)

        const { data: campaignRow, error: campaignError } = await supabase
            .from('meta_campaigns')
            .upsert(
                {
                    organization_id: organizationId,
                    meta_ad_account_id: adAccountId,
                    meta_campaign_id: campaign.id,
                    name: campaign.name ?? null,
                    status: campaign.status ?? null,
                    objective: campaign.objective ?? null,
                    daily_budget: campaign.daily_budget ? Number(campaign.daily_budget) : null,
                    lifetime_budget: campaign.lifetime_budget ? Number(campaign.lifetime_budget) : null,
                    total_spend: totalSpend,
                    synced_at: new Date().toISOString(),
                },
                { onConflict: 'meta_campaign_id' }
            )
            .select('id')
            .single()

        if (campaignError || !campaignRow) {
            summary.errors.push(`Campaña ${campaign.id}: ${campaignError?.message ?? 'error al guardar'}`)
            continue
        }

        summary.campaigns += 1

        await syncAdSets({
            supabase,
            organizationId,
            campaignId: campaignRow.id,
            metaCampaignId: campaign.id,
            accessToken,
            summary,
        })
    }
}

export async function POST() {
    const supabase = await getSupabaseServer()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('user_id', user.id)
        .maybeSingle()

    if (!profile) {
        return NextResponse.json({ error: 'Organización no encontrada' }, { status: 404 })
    }

    const { data: adAccounts, error: adAccountsError } = await supabase
        .from('meta_ad_accounts')
        .select('id, meta_account_id, access_token_encrypted')
        .eq('organization_id', profile.organization_id)
        .eq('is_active', true)

    if (adAccountsError) {
        return NextResponse.json({ error: adAccountsError.message }, { status: 500 })
    }

    if (!adAccounts || adAccounts.length === 0) {
        return NextResponse.json({ error: 'No hay cuentas de Meta Ads activas' }, { status: 404 })
    }

    const summary: SyncSummary = {
        accounts_synced: 0,
        campaigns: 0,
        ad_sets: 0,
        ads: 0,
        metrics_rows: 0,
        errors: [],
    }

    for (const account of adAccounts) {

        // TEMP: usar token del .env.local para debugging
        const accessToken =
            process.env.META_ACCESS_TOKEN ||
            account.access_token_encrypted

        if (!accessToken) {
            summary.errors.push(`Cuenta ${account.meta_account_id}: sin access token configurado`)
            continue
        }

        try {


            await syncAdAccount({
                supabase,
                organizationId: profile.organization_id,
                adAccountId: account.id,
                metaAccountId: `act_${process.env.META_AD_ACCOUNT_ID}`,
                accessToken,
                summary,
            })

            await supabase
                .from('meta_ad_accounts')
                .update({ last_synced_at: new Date().toISOString() })
                .eq('id', account.id)

            summary.accounts_synced += 1
        } catch (error) {
            summary.errors.push(
                `Cuenta act_${process.env.META_AD_ACCOUNT_ID}: ${error instanceof Error
                    ? error.message
                    : "Error desconocido"
                }`
            )
        }
    }

    return NextResponse.json({ success: true, ...summary })
}