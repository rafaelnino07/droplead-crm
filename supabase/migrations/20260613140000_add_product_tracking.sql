-- ═══════════════════════════════════════════════════════════════
-- Track product usage in quotes
-- ═══════════════════════════════════════════════════════════════

alter table products add column if not exists times_used integer not null default 0;
alter table products add column if not exists last_used_at timestamptz;
alter table products add column if not exists is_archived boolean not null default false;
