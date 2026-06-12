// ═══════════════════════════════════════════════════════════════
// DROPLEAD CRM — Database Types
// Auto-reflect the Supabase schema. Keep in sync with migrations.
// ═══════════════════════════════════════════════════════════════

import type {
    MetaAdAccount,
    MetaCampaign,
    MetaAdSet,
    MetaAd,
    MetaAdMetric,
} from '@/types/marketing-intelligence'

// ── Shared ──────────────────────────────────────────────────────

export type Plan = 'trial' | 'starter' | 'pro' | 'agency'
export type Role = 'owner' | 'admin' | 'member'
export type QuoteStatus =
    | 'draft' | 'sent' | 'viewed'
    | 'accepted' | 'rejected' | 'expired'
export type Template = 'classic' | 'modern' | 'minimal'

export type QuoteEventType =
    | 'created' | 'updated' | 'sent'
    | 'viewed' | 'accepted' | 'rejected'
    | 'expired' | 'version_created' | 'discount_applied'
    | 'discount_approved'

// ── Branding ─────────────────────────────────────────────────────

export interface OrgBranding {
    logo_url: string | null
    primary_color: string
    accent_color: string
    font: 'inter' | 'playfair' | 'lato' | 'raleway'
    template: Template
}

// ── Settings ─────────────────────────────────────────────────────

export interface OrgSettings {
    tax_rate: number        // default 16
    currency: string        // default 'MXN'
    quote_prefix: string        // default 'DRP'
    payment_terms_default: string | null
    require_discount_approval: boolean
}

// ── Organization ─────────────────────────────────────────────────

export interface Organization {
    id: string
    name: string
    slug: string
    branding: OrgBranding
    plan: Plan
    trial_ends_at: string | null
    settings: OrgSettings
    created_at: string
    updated_at: string
}

// ── Profile ──────────────────────────────────────────────────────

export interface Profile {
    id: string
    organization_id: string
    full_name: string
    email: string
    phone: string | null
    role: Role
    avatar_url: string | null
    is_active: boolean
    created_at: string
    updated_at: string
}

// ── Client ───────────────────────────────────────────────────────

export interface Client {
    id: string
    organization_id: string
    name: string
    company: string | null
    email: string | null
    phone: string | null
    address: string | null
    city: string | null
    notes: string | null
    tags: string[]
    source: string | null
    source_ad_id: string | null
    is_active: boolean
    created_at: string
    updated_at: string
}

// ── Product ──────────────────────────────────────────────────────

export interface Product {
    id: string
    organization_id: string
    name: string
    description: string | null
    category: string | null
    unit: string
    unit_price: number
    tax_included: boolean
    is_favorite: boolean
    is_active: boolean
    sort_order: number
    created_at: string
    updated_at: string
}

// ── Quote ────────────────────────────────────────────────────────

export interface Quote {
    id: string
    organization_id: string
    client_id: string | null
    created_by: string | null

    quote_number: string
    version: number
    parent_quote_id: string | null

    status: QuoteStatus

    project_name: string | null
    project_address: string | null
    project_type: string | null
    client_vision: string | null

    // Financials
    subtotal: number
    discount_global: number
    discount_amount: number
    taxable_amount: number
    tax_rate: number
    tax_amount: number
    total: number

    template: Template

    start_date: string | null
    duration_weeks: number | null

    executive_name: string | null
    executive_phone: string | null
    executive_email: string | null

    guarantee: string | null
    payment_terms: string | null
    notes: string | null

    valid_until: string | null
    share_token: string | null
    view_count: number

    sent_at: string | null
    first_viewed_at: string | null
    last_viewed_at: string | null
    accepted_at: string | null
    rejected_at: string | null
    created_at: string
    updated_at: string
}

// ── Quote Item ───────────────────────────────────────────────────

export interface QuoteItem {
    id: string
    quote_id: string
    product_id: string | null
    name: string
    description: string | null
    quantity: number
    unit: string
    unit_price: number
    discount_pct: number
    discount_amount: number
    subtotal: number
    sort_order: number
    created_at: string
}

// ── Quote Event ──────────────────────────────────────────────────

export interface QuoteEvent {
    id: string
    quote_id: string
    created_by: string | null
    event_type: QuoteEventType
    metadata: Record<string, unknown>
    created_at: string
}

// ═══════════════════════════════════════════════════════════════
// JOINED / ENRICHED TYPES
// Used in queries that join multiple tables
// ═══════════════════════════════════════════════════════════════

export interface QuoteWithItems extends Quote {
    items: QuoteItem[]
    client: Client | null
}

export interface QuoteWithDetails extends QuoteWithItems {
    events: QuoteEvent[]
    created_by_profile: Profile | null
}

// ═══════════════════════════════════════════════════════════════
// FORM / INPUT TYPES
// Used when creating or updating records
// ═══════════════════════════════════════════════════════════════

export type CreateQuoteInput = Pick<
    Quote,
    | 'client_id' | 'project_name' | 'project_address' | 'project_type'
    | 'client_vision' | 'template' | 'start_date' | 'duration_weeks'
    | 'executive_name' | 'executive_phone' | 'executive_email'
    | 'guarantee' | 'payment_terms' | 'notes' | 'valid_until'
    | 'discount_global' | 'tax_rate'
>

export type CreateQuoteItemInput = Pick<
    QuoteItem,
    | 'product_id' | 'name' | 'description' | 'quantity'
    | 'unit' | 'unit_price' | 'discount_pct' | 'sort_order'
>

export type CreateClientInput = Pick<
    Client,
    | 'name' | 'company' | 'email' | 'phone'
    | 'address' | 'city' | 'notes' | 'tags' | 'source'
>

export type CreateProductInput = Pick<
    Product,
    | 'name' | 'description' | 'category' | 'unit'
    | 'unit_price' | 'tax_included' | 'is_favorite'
>

// ═══════════════════════════════════════════════════════════════
// DASHBOARD TYPES
// ═══════════════════════════════════════════════════════════════

export interface DashboardMetrics {
    // Volume
    total_quotes: number
    quotes_this_period: number

    // Conversion
    accepted: number
    rejected: number
    pending: number
    conversion_rate: number  // %

    // Financials
    total_revenue: number  // sum of accepted quote totals
    avg_ticket: number
    avg_discount_pct: number
    avg_discount_amount: number
    revenue_lost: number  // sum of rejected quote totals

    // Performance
    avg_close_days: number  // sent_at → accepted_at
    quotes_needing_version: number  // required renegotiation

    // Product insights
    top_products: Array<{
        product_name: string
        times_quoted: number
        total_revenue: number
    }>

    // By executive (if team)
    by_executive: Array<{
        executive_name: string
        quotes_sent: number
        conversion_rate: number
        total_revenue: number
    }>
}

export type DateRange = '7d' | '30d' | '90d' | 'ytd' | 'all'

// ═══════════════════════════════════════════════════════════════
// SUPABASE DATABASE TYPE (for typed client)
// ═══════════════════════════════════════════════════════════════

export type Database = {
    public: {
        Tables: {
            organizations: {
                Row: Organization
                Insert: Omit<Organization, 'id' | 'created_at' | 'updated_at'>
                Update: Partial<Omit<Organization, 'id' | 'created_at'>>
            }
            profiles: {
                Row: Profile
                Insert: Omit<Profile, 'created_at' | 'updated_at'>
                Update: Partial<Omit<Profile, 'id' | 'created_at'>>
            }
            clients: {
                Row: Client
                Insert: Omit<Client, 'id' | 'created_at' | 'updated_at'>
                Update: Partial<Omit<Client, 'id' | 'organization_id' | 'created_at'>>
            }
            products: {
                Row: Product
                Insert: Omit<Product, 'id' | 'created_at' | 'updated_at'>
                Update: Partial<Omit<Product, 'id' | 'organization_id' | 'created_at'>>
            }
            quotes: {
                Row: Quote
                Insert: Omit<Quote, 'id' | 'quote_number' | 'share_token' | 'view_count' | 'created_at' | 'updated_at'>
                Update: Partial<Omit<Quote, 'id' | 'organization_id' | 'created_at'>>
            }
            quote_items: {
                Row: QuoteItem
                Insert: Omit<QuoteItem, 'id' | 'created_at'>
                Update: Partial<Omit<QuoteItem, 'id' | 'quote_id' | 'created_at'>>
            }
            quote_events: {
                Row: QuoteEvent
                Insert: Omit<QuoteEvent, 'id' | 'created_at'>
                Update: never  // events are immutable
            }
            meta_ad_accounts: {
                Row: MetaAdAccount
                Insert: Omit<MetaAdAccount, 'id' | 'created_at'>
                Update: Partial<Omit<MetaAdAccount, 'id' | 'organization_id' | 'created_at'>>
            }
            meta_campaigns: {
                Row: MetaCampaign
                Insert: Omit<MetaCampaign, 'id' | 'created_at'>
                Update: Partial<Omit<MetaCampaign, 'id' | 'organization_id' | 'created_at'>>
            }
            meta_ad_sets: {
                Row: MetaAdSet
                Insert: Omit<MetaAdSet, 'id' | 'created_at'>
                Update: Partial<Omit<MetaAdSet, 'id' | 'organization_id' | 'created_at'>>
            }
            meta_ads: {
                Row: MetaAd
                Insert: Omit<MetaAd, 'id' | 'created_at'>
                Update: Partial<Omit<MetaAd, 'id' | 'organization_id' | 'created_at'>>
            }
            meta_ad_metrics: {
                Row: MetaAdMetric
                Insert: Omit<MetaAdMetric, 'id' | 'created_at'>
                Update: Partial<Omit<MetaAdMetric, 'id' | 'organization_id' | 'created_at'>>
            }
        }
        Functions: {
            get_my_org_id: { Args: Record<never, never>; Returns: string }
            is_org_admin: { Args: Record<never, never>; Returns: boolean }
            generate_quote_number: { Args: { org_id: string }; Returns: string }
        }
    }
}
