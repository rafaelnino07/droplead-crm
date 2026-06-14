-- ═══════════════════════════════════════════════════════════════
-- Tasks
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  client_id uuid REFERENCES clients(id) ON DELETE SET NULL,
  created_by uuid REFERENCES auth.users(id),
  title text NOT NULL,
  description text,
  type text NOT NULL DEFAULT 'follow_up',
  priority text NOT NULL DEFAULT 'Media',
  status text NOT NULL DEFAULT 'pending',
  due_date timestamptz,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_access" ON tasks
  USING (organization_id = (SELECT organization_id FROM profiles WHERE user_id = auth.uid()));

CREATE INDEX tasks_org_id_idx ON tasks(organization_id);
CREATE INDEX tasks_client_id_idx ON tasks(client_id);
CREATE INDEX tasks_due_date_idx ON tasks(due_date);
