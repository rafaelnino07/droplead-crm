CREATE TABLE morning_briefs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  brief_text text NOT NULL,
  generated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE morning_briefs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_access" ON morning_briefs
  USING (organization_id = (SELECT organization_id FROM profiles WHERE user_id = auth.uid()));
