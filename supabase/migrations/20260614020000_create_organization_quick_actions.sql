CREATE TABLE organization_quick_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  action_key text NOT NULL,
  label text NOT NULL,
  emoji text NOT NULL DEFAULT '📋',
  is_active boolean NOT NULL DEFAULT true,
  is_universal boolean NOT NULL DEFAULT false,
  scp_stage text,
  -- maps to ClientStage: calificado_para_visita, visita_tecnica_realizada,
  -- cotizacion_enviada, verbalmente_ganado, proyecto_cerrado, perdido
  auto_task_trigger text,
  -- maps to AutoTaskTrigger from auto-tasks.ts
  sort_order integer NOT NULL DEFAULT 0,
  is_custom boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE organization_quick_actions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org_access" ON organization_quick_actions
  USING (organization_id = (SELECT organization_id FROM profiles WHERE user_id = auth.uid()));

CREATE UNIQUE INDEX org_action_key_idx ON organization_quick_actions(organization_id, action_key);
CREATE INDEX org_quick_actions_org_idx ON organization_quick_actions(organization_id, is_active);

-- Seed default actions for existing organizations
INSERT INTO organization_quick_actions
  (organization_id, action_key, label, emoji, is_universal, scp_stage, auto_task_trigger, sort_order)
SELECT
  o.id,
  a.action_key,
  a.label,
  a.emoji,
  a.is_universal,
  a.scp_stage,
  a.auto_task_trigger,
  a.sort_order
FROM organizations o
CROSS JOIN (VALUES
  -- UNIVERSALES
  ('call_completed', 'Llamada realizada', '📞', true, NULL, 'call_completed', 1),
  ('whatsapp_sent', 'WhatsApp enviado', '💬', true, NULL, 'whatsapp_sent', 2),
  ('email_sent', 'Correo enviado', '📧', true, NULL, NULL, 3),
  ('meeting_completed', 'Reunión realizada', '🤝', true, NULL, 'meeting_completed', 4),
  ('appointment_scheduled', 'Cita agendada', '🗓️', true, 'calificado_para_visita', NULL, 5),
  ('followup_done', 'Follow-up realizado', '⏰', true, NULL, 'call_completed', 6),
  ('no_response', 'No respondió', '🔕', true, NULL, 'no_response', 7),
  -- BIBLIOTECA ACTIVABLE (is_active = false by default except for existing orgs)
  ('site_visit_completed', 'Visita al sitio', '🏠', false, 'visita_tecnica_realizada', 'site_visit_completed', 8),
  ('plans_received', 'Planos recibidos', '📐', false, 'visita_tecnica_realizada', 'plans_received', 9),
  ('budget_confirmed', 'Presupuesto confirmado', '💰', false, NULL, 'budget_confirmed', 10),
  ('target_date_defined', 'Fecha objetivo definida', '🎯', false, NULL, NULL, 11),
  ('proposal_presented', 'Propuesta presentada', '📊', false, 'cotizacion_enviada', 'proposal_sent', 12),
  ('verbal_acceptance', 'Aceptación verbal', '🏆', false, 'verbalmente_ganado', 'verbal_acceptance', 13),
  ('project_won', 'Ganado', '✅', false, 'proyecto_cerrado', NULL, 14),
  ('project_lost', 'Perdido', '❌', false, 'perdido', NULL, 15),
  ('installation_completed', 'Instalación completada', '📦', false, NULL, NULL, 16),
  ('online_sale', 'Venta en línea', '🌐', false, 'proyecto_cerrado', NULL, 17)
) AS a(action_key, label, emoji, is_universal, scp_stage, auto_task_trigger, sort_order);
