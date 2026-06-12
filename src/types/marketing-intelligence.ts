// ═══════════════════════════════════════════════════════════════
// DROPLEAD CRM — Marketing Intelligence Types (Sprint 6)
// Meta Ads integration: ad accounts, campaigns, ad sets, ads, metrics
// Keep in sync with supabase/migrations/20260612120000_sprint6_marketing_intelligence.sql
// ═══════════════════════════════════════════════════════════════

// ── Meta Ad Account ──────────────────────────────────────────────

export interface MetaAdAccount {
    id: string
    organization_id: string
    meta_account_id: string
    account_name: string | null
    access_token_encrypted: string | null
    is_active: boolean
    last_synced_at: string | null
    created_at: string
}

// ── Meta Campaign ─────────────────────────────────────────────────

export interface MetaCampaign {
    id: string
    organization_id: string
    meta_ad_account_id: string | null
    meta_campaign_id: string
    name: string | null
    status: string | null
    objective: string | null
    daily_budget: number | null
    lifetime_budget: number | null
    total_spend: number
    synced_at: string | null
    created_at: string
}

// ── Meta Ad Set ───────────────────────────────────────────────────

export interface MetaAdSet {
    id: string
    organization_id: string
    campaign_id: string | null
    meta_adset_id: string
    name: string | null
    status: string | null
    targeting_summary: string | null
    created_at: string
}

// ── Meta Ad ───────────────────────────────────────────────────────

export interface MetaAd {
    id: string
    organization_id: string
    ad_set_id: string | null
    meta_ad_id: string
    name: string | null
    status: string | null
    headline: string | null
    body: string | null
    image_url: string | null
    video_url: string | null
    cta_type: string | null
    permalink_url: string | null
    created_at: string
}

// ── Meta Ad Metric ────────────────────────────────────────────────

export interface MetaAdMetric {
    id: string
    ad_id: string | null
    organization_id: string
    date: string
    impressions: number
    reach: number
    clicks: number
    ctr: number
    cpm: number
    cpc: number
    spend: number
    leads: number
    created_at: string
}

// ═══════════════════════════════════════════════════════════════
// SYNC INPUT TYPES
// Used when upserting data fetched from the Meta Graph API
// ═══════════════════════════════════════════════════════════════

export type UpsertMetaCampaignInput = Omit<MetaCampaign, 'id' | 'created_at'>
export type UpsertMetaAdSetInput = Omit<MetaAdSet, 'id' | 'created_at'>
export type UpsertMetaAdInput = Omit<MetaAd, 'id' | 'created_at'>
export type UpsertMetaAdMetricInput = Omit<MetaAdMetric, 'id' | 'created_at'>
