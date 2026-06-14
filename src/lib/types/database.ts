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
import type { FileCategory } from '@/lib/files/categories'

// ── Shared ──────────────────────────────────────────────────────

export type Plan = 'trial' | 'starter' | 'pro' | 'agency'
export type Role = 'owner' | 'admin' | 'member'
export type ClientType = 'persona' | 'empresa'
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

// ── Branch ───────────────────────────────────────────────────────

export interface Branch {
    id: string
    organization_id: string
    name: string
    city: string | null
    address: string | null
    phone: string | null
    is_active: boolean
    created_at: string
    updated_at: string
}

// ── Profile ──────────────────────────────────────────────────────

export interface Profile {
    id: string
    user_id: string
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
    branch_id: string | null
    name: string
    client_type: ClientType
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
    utm_source: string | null
    utm_campaign: string | null
    utm_content: string | null
    utm_term: string | null
    utm_medium: string | null
    attributed_revenue: number
    attributed_at: string | null
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
    times_used: number
    last_used_at: string | null
    is_archived: boolean
    created_at: string
    updated_at: string
}

// ── Quote ────────────────────────────────────────────────────────

export interface Quote {
    id: string
    organization_id: string
    branch_id: string | null
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
    currency: string
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

// ── Client Activity ──────────────────────────────────────────────
// Timeline Comercial — eventos del cliente (inmutable)

export interface ClientActivity {
    id: string
    organization_id: string
    client_id: string
    created_by: string | null
    type: string
    title: string
    description: string | null
    metadata: Record<string, unknown>
    created_at: string
}

// ── Commercial Memory ────────────────────────────────────────────
// Memoria Comercial — clients 1:1 commercial_memory

export interface CommercialMemory {
    id: string
    organization_id: string
    client_id: string

    // Perfil
    estimated_budget: number | null
    urgency: string | null
    closing_probability: number | null
    temperature: string | null
    project_type: string | null
    lead_source: string | null

    // Conocimiento
    executive_summary: string | null
    pain_points: string | null
    desires: string | null
    objections: string | null
    competitors: string | null

    // Acción
    next_step: string | null
    next_step_date: string | null

    created_at: string
    updated_at: string
}

// ── Client File ──────────────────────────────────────────────────
// Expediente visual — metadata de archivos en Supabase Storage

export interface ClientFile {
    id: string
    organization_id: string
    client_id: string
    uploaded_by: string | null
    file_name: string
    file_path: string
    file_type: string | null
    file_size: number
    category: FileCategory | null
    created_at: string
}

// ── Task ─────────────────────────────────────────────────────────

export interface Task {
    id: string
    organization_id: string
    branch_id: string | null
    client_id: string | null
    created_by: string | null
    title: string
    description: string | null
    type: string
    priority: 'Alta' | 'Media' | 'Baja'
    status: 'pending' | 'done' | 'cancelled'
    due_date: string | null
    completed_at: string | null
    created_at: string
    updated_at: string
}

// ── Morning Brief ────────────────────────────────────────────────
// CEO Morning Brief — resumen ejecutivo diario generado por IA

export interface MorningBrief {
    id: string
    organization_id: string
    brief_text: string
    generated_at: string
}

// ── Deal Coach Cache ─────────────────────────────────────────────
// Deal Coach — consejo comercial por cliente generado por IA

export interface DealCoachCache {
    id: string
    organization_id: string
    client_id: string
    advice_text: string
    generated_at: string
}

// ── Super Admin ──────────────────────────────────────────────────
// Acceso global de plataforma (fuera del scope de organizations)

export interface SuperAdmin {
    id: string
    user_id: string
    created_at: string
}

// ── Notification ─────────────────────────────────────────────────
// Alertas y notificaciones generadas para el CRM

export interface Notification {
    id: string
    organization_id: string
    client_id: string | null
    type: string
    title: string
    description: string
    priority: 'Alta' | 'Media' | 'Baja'
    is_read: boolean
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

// postgrest-js GenericTable requires Row to satisfy Record<string, unknown>;
// plain interfaces have no index signature, so intersect to satisfy it.
type WithIndex<T> = T & Record<string, unknown>

export type Database = {
    public: {
        Tables: {
            organizations: {
                Row: WithIndex<Organization>
                Insert: Omit<Organization, 'id' | 'created_at' | 'updated_at'>
                Update: Partial<Omit<Organization, 'id' | 'created_at'>>
                Relationships: []
            }
            profiles: {
                Row: WithIndex<Profile>
                Insert: Omit<Profile, 'created_at' | 'updated_at'>
                Update: Partial<Omit<Profile, 'id' | 'created_at'>>
                Relationships: [
                    {
                        foreignKeyName: 'profiles_organization_id_fkey'
                        columns: ['organization_id']
                        isOneToOne: true
                        referencedRelation: 'organizations'
                        referencedColumns: ['id']
                    }
                ]
            }
            clients: {
                Row: WithIndex<Client>
                Insert: Omit<Client, 'id' | 'created_at' | 'updated_at' | 'branch_id'> & {
                    branch_id?: string | null
                }
                Update: Partial<Omit<Client, 'id' | 'organization_id' | 'created_at'>>
                Relationships: []
            }
            branches: {
                Row: WithIndex<Branch>
                Insert: Omit<Branch, 'id' | 'created_at' | 'updated_at'>
                Update: Partial<Omit<Branch, 'id' | 'organization_id' | 'created_at'>>
                Relationships: []
            }
            products: {
                Row: WithIndex<Product>
                Insert: Omit<Product, 'id' | 'created_at' | 'updated_at' | 'times_used' | 'last_used_at' | 'is_archived'> & {
                    times_used?: number
                    last_used_at?: string | null
                    is_archived?: boolean
                }
                Update: Partial<Omit<Product, 'id' | 'organization_id' | 'created_at'>>
                Relationships: []
            }
            quotes: {
                Row: WithIndex<Quote>
                Insert: Omit<Quote, 'id' | 'quote_number' | 'share_token' | 'view_count' | 'created_at' | 'updated_at' | 'branch_id'> & {
                    branch_id?: string | null
                }
                Update: Partial<Omit<Quote, 'id' | 'organization_id' | 'created_at'>>
                Relationships: [
                    {
                        foreignKeyName: 'quotes_client_id_fkey'
                        columns: ['client_id']
                        isOneToOne: true
                        referencedRelation: 'clients'
                        referencedColumns: ['id']
                    }
                ]
            }
            quote_items: {
                Row: WithIndex<QuoteItem>
                Insert: Omit<QuoteItem, 'id' | 'created_at'>
                Update: Partial<Omit<QuoteItem, 'id' | 'quote_id' | 'created_at'>>
                Relationships: []
            }
            quote_events: {
                Row: WithIndex<QuoteEvent>
                Insert: Omit<QuoteEvent, 'id' | 'created_at'>
                Update: never  // events are immutable
                Relationships: []
            }
            client_activities: {
                Row: WithIndex<ClientActivity>
                Insert: Omit<ClientActivity, 'id' | 'created_at'>
                Update: never  // activities are immutable
                Relationships: []
            }
            commercial_memory: {
                Row: WithIndex<CommercialMemory>
                Insert: Omit<CommercialMemory, 'id' | 'created_at' | 'updated_at'>
                Update: Partial<Omit<CommercialMemory, 'id' | 'organization_id' | 'client_id' | 'created_at'>>
                Relationships: []
            }
            client_files: {
                Row: WithIndex<ClientFile>
                Insert: Omit<ClientFile, 'id' | 'created_at'>
                Update: Partial<Omit<ClientFile, 'id' | 'organization_id' | 'client_id' | 'created_at'>>
                Relationships: []
            }
            tasks: {
                Row: WithIndex<Task>
                Insert: Omit<Task, 'id' | 'created_at' | 'updated_at' | 'branch_id'> & {
                    branch_id?: string | null
                }
                Update: Partial<Omit<Task, 'id' | 'organization_id' | 'created_at'>>
                Relationships: []
            }
            meta_ad_accounts: {
                Row: WithIndex<MetaAdAccount>
                Insert: Omit<MetaAdAccount, 'id' | 'created_at'>
                Update: Partial<Omit<MetaAdAccount, 'id' | 'organization_id' | 'created_at'>>
                Relationships: []
            }
            meta_campaigns: {
                Row: WithIndex<MetaCampaign>
                Insert: Omit<MetaCampaign, 'id' | 'created_at'>
                Update: Partial<Omit<MetaCampaign, 'id' | 'organization_id' | 'created_at'>>
                Relationships: []
            }
            meta_ad_sets: {
                Row: WithIndex<MetaAdSet>
                Insert: Omit<MetaAdSet, 'id' | 'created_at'>
                Update: Partial<Omit<MetaAdSet, 'id' | 'organization_id' | 'created_at'>>
                Relationships: []
            }
            meta_ads: {
                Row: WithIndex<MetaAd>
                Insert: Omit<MetaAd, 'id' | 'created_at'>
                Update: Partial<Omit<MetaAd, 'id' | 'organization_id' | 'created_at'>>
                Relationships: []
            }
            meta_ad_metrics: {
                Row: WithIndex<MetaAdMetric>
                Insert: Omit<MetaAdMetric, 'id' | 'created_at'>
                Update: Partial<Omit<MetaAdMetric, 'id' | 'organization_id' | 'created_at'>>
                Relationships: []
            }
            morning_briefs: {
                Row: WithIndex<MorningBrief>
                Insert: Omit<MorningBrief, 'id' | 'generated_at'> & { generated_at?: string }
                Update: Partial<Omit<MorningBrief, 'id' | 'organization_id'>>
                Relationships: []
            }
            deal_coach_cache: {
                Row: WithIndex<DealCoachCache>
                Insert: Omit<DealCoachCache, 'id' | 'generated_at'> & { generated_at?: string }
                Update: Partial<Omit<DealCoachCache, 'id' | 'organization_id' | 'client_id'>>
                Relationships: [
                    {
                        foreignKeyName: 'deal_coach_cache_client_id_fkey'
                        columns: ['client_id']
                        isOneToOne: true
                        referencedRelation: 'clients'
                        referencedColumns: ['id']
                    }
                ]
            }
            super_admins: {
                Row: WithIndex<SuperAdmin>
                Insert: Omit<SuperAdmin, 'id' | 'created_at'>
                Update: never
                Relationships: []
            }
            notifications: {
                Row: WithIndex<Notification>
                Insert: Omit<Notification, 'id' | 'created_at' | 'is_read' | 'priority' | 'metadata'> & {
                    is_read?: boolean
                    priority?: Notification['priority']
                    metadata?: Record<string, unknown>
                    created_at?: string
                }
                Update: Partial<Omit<Notification, 'id' | 'organization_id' | 'created_at'>>
                Relationships: [
                    {
                        foreignKeyName: 'notifications_client_id_fkey'
                        columns: ['client_id']
                        isOneToOne: false
                        referencedRelation: 'clients'
                        referencedColumns: ['id']
                    }
                ]
            }
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            get_my_org_id: { Args: Record<never, never>; Returns: string }
            is_org_admin: { Args: Record<never, never>; Returns: boolean }
            generate_quote_number: { Args: { org_id: string }; Returns: string }
        }
    }
}
