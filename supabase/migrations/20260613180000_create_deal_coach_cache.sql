CREATE TABLE deal_coach_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  advice_text text NOT NULL,
  generated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(client_id)
);

ALTER TABLE deal_coach_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_access" ON deal_coach_cache
  USING (organization_id = (SELECT organization_id FROM profiles WHERE user_id = auth.uid()));
