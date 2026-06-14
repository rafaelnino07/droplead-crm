CREATE TABLE notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  client_id uuid REFERENCES clients(id) ON DELETE SET NULL,
  type text NOT NULL,
  -- types: lead_cold, quote_expiring, quote_forgotten, verbal_no_followup,
  --        task_overdue, meta_cpl_spike, deal_won, deal_lost
  title text NOT NULL,
  description text NOT NULL,
  priority text NOT NULL DEFAULT 'Media',
  -- values: Alta, Media, Baja
  is_read boolean NOT NULL DEFAULT false,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org_access" ON notifications
  USING (organization_id = (SELECT organization_id FROM profiles WHERE user_id = auth.uid()));

CREATE INDEX notifications_org_id_idx ON notifications(organization_id);
CREATE INDEX notifications_is_read_idx ON notifications(organization_id, is_read);
