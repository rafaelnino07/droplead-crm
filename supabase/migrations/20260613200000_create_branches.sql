CREATE TABLE branches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  city text,
  address text,
  phone text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE branches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org_access" ON branches
  USING (organization_id = (SELECT organization_id FROM profiles WHERE user_id = auth.uid()));

CREATE INDEX branches_org_id_idx ON branches(organization_id);

-- Add branch_id to existing tables
ALTER TABLE clients ADD COLUMN IF NOT EXISTS branch_id uuid REFERENCES branches(id) ON DELETE SET NULL;
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS branch_id uuid REFERENCES branches(id) ON DELETE SET NULL;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS branch_id uuid REFERENCES branches(id) ON DELETE SET NULL;

CREATE INDEX clients_branch_id_idx ON clients(branch_id);
CREATE INDEX quotes_branch_id_idx ON quotes(branch_id);

-- Super admin table
CREATE TABLE super_admins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE super_admins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "self_access" ON super_admins
  USING (user_id = auth.uid());
