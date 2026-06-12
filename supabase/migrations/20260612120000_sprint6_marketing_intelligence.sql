-- ═══════════════════════════════════════════════════════════════
-- Sprint 6 — Marketing Intelligence (Meta Ads)
-- ═══════════════════════════════════════════════════════════════

-- ── meta_ad_accounts ────────────────────────────────────────────

create table meta_ad_accounts (
    id uuid primary key default gen_random_uuid(),
    organization_id uuid not null references organizations(id) on delete cascade,
    meta_account_id text not null,
    account_name text,
    access_token_encrypted text,
    is_active boolean not null default true,
    last_synced_at timestamptz,
    created_at timestamptz not null default now()
);

create index meta_ad_accounts_organization_id_idx on meta_ad_accounts(organization_id);

alter table meta_ad_accounts enable row level security;

create policy "meta_ad_accounts_select" on meta_ad_accounts
    for select using (organization_id = get_my_org_id());

create policy "meta_ad_accounts_insert" on meta_ad_accounts
    for insert with check (organization_id = get_my_org_id());

create policy "meta_ad_accounts_update" on meta_ad_accounts
    for update using (organization_id = get_my_org_id())
    with check (organization_id = get_my_org_id());

-- ── meta_campaigns ──────────────────────────────────────────────

create table meta_campaigns (
    id uuid primary key default gen_random_uuid(),
    organization_id uuid not null references organizations(id) on delete cascade,
    meta_ad_account_id uuid references meta_ad_accounts(id) on delete cascade,
    meta_campaign_id text unique not null,
    name text,
    status text,
    objective text,
    daily_budget numeric,
    lifetime_budget numeric,
    total_spend numeric not null default 0,
    synced_at timestamptz,
    created_at timestamptz not null default now()
);

create index meta_campaigns_organization_id_idx on meta_campaigns(organization_id);
create index meta_campaigns_meta_ad_account_id_idx on meta_campaigns(meta_ad_account_id);

alter table meta_campaigns enable row level security;

create policy "meta_campaigns_select" on meta_campaigns
    for select using (organization_id = get_my_org_id());

create policy "meta_campaigns_insert" on meta_campaigns
    for insert with check (organization_id = get_my_org_id());

create policy "meta_campaigns_update" on meta_campaigns
    for update using (organization_id = get_my_org_id())
    with check (organization_id = get_my_org_id());

-- ── meta_ad_sets ────────────────────────────────────────────────

create table meta_ad_sets (
    id uuid primary key default gen_random_uuid(),
    organization_id uuid not null references organizations(id) on delete cascade,
    campaign_id uuid references meta_campaigns(id) on delete cascade,
    meta_adset_id text unique not null,
    name text,
    status text,
    targeting_summary text,
    created_at timestamptz not null default now()
);

create index meta_ad_sets_organization_id_idx on meta_ad_sets(organization_id);
create index meta_ad_sets_campaign_id_idx on meta_ad_sets(campaign_id);

alter table meta_ad_sets enable row level security;

create policy "meta_ad_sets_select" on meta_ad_sets
    for select using (organization_id = get_my_org_id());

create policy "meta_ad_sets_insert" on meta_ad_sets
    for insert with check (organization_id = get_my_org_id());

create policy "meta_ad_sets_update" on meta_ad_sets
    for update using (organization_id = get_my_org_id())
    with check (organization_id = get_my_org_id());

-- ── meta_ads ────────────────────────────────────────────────────

create table meta_ads (
    id uuid primary key default gen_random_uuid(),
    organization_id uuid not null references organizations(id) on delete cascade,
    ad_set_id uuid references meta_ad_sets(id) on delete cascade,
    meta_ad_id text unique not null,
    name text,
    status text,
    headline text,
    body text,
    image_url text,
    video_url text,
    cta_type text,
    permalink_url text,
    created_at timestamptz not null default now()
);

create index meta_ads_organization_id_idx on meta_ads(organization_id);
create index meta_ads_ad_set_id_idx on meta_ads(ad_set_id);

alter table meta_ads enable row level security;

create policy "meta_ads_select" on meta_ads
    for select using (organization_id = get_my_org_id());

create policy "meta_ads_insert" on meta_ads
    for insert with check (organization_id = get_my_org_id());

create policy "meta_ads_update" on meta_ads
    for update using (organization_id = get_my_org_id())
    with check (organization_id = get_my_org_id());

-- ── meta_ad_metrics ─────────────────────────────────────────────

create table meta_ad_metrics (
    id uuid primary key default gen_random_uuid(),
    ad_id uuid references meta_ads(id) on delete cascade,
    organization_id uuid not null references organizations(id) on delete cascade,
    date date not null,
    impressions integer not null default 0,
    reach integer not null default 0,
    clicks integer not null default 0,
    ctr numeric not null default 0,
    cpm numeric not null default 0,
    cpc numeric not null default 0,
    spend numeric not null default 0,
    leads integer not null default 0,
    created_at timestamptz not null default now(),
    unique(ad_id, date)
);

create index meta_ad_metrics_organization_id_idx on meta_ad_metrics(organization_id);
create index meta_ad_metrics_ad_id_idx on meta_ad_metrics(ad_id);
create index meta_ad_metrics_date_idx on meta_ad_metrics(date);

alter table meta_ad_metrics enable row level security;

create policy "meta_ad_metrics_select" on meta_ad_metrics
    for select using (organization_id = get_my_org_id());

create policy "meta_ad_metrics_insert" on meta_ad_metrics
    for insert with check (organization_id = get_my_org_id());

create policy "meta_ad_metrics_update" on meta_ad_metrics
    for update using (organization_id = get_my_org_id())
    with check (organization_id = get_my_org_id());

-- ═══════════════════════════════════════════════════════════════
-- clients — Meta Ads attribution
-- ═══════════════════════════════════════════════════════════════

alter table clients
    add column if not exists source text;

alter table clients
    add column if not exists source_ad_id uuid references meta_ads(id);
