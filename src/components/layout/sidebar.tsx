import { getSupabaseServer } from '@/lib/supabase/server'
import { SidebarNav } from './sidebar-nav'

export async function Sidebar() {
  const supabase = await getSupabaseServer()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  let isSuperAdmin = false

  if (user) {
    const { data: superAdmin } = await supabase
      .from('super_admins')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle()

    isSuperAdmin = !!superAdmin
  }

  return <SidebarNav isSuperAdmin={isSuperAdmin} />
}
