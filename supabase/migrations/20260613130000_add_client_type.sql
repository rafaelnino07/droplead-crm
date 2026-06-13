-- ═══════════════════════════════════════════════════════════════
-- Add client_type to clients
-- ═══════════════════════════════════════════════════════════════

alter table clients add column if not exists client_type text not null default 'empresa';
-- values: 'persona' | 'empresa'
