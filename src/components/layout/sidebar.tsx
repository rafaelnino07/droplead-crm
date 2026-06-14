import { getSupabaseServer, getActiveOrganizationId } from '@/lib/supabase/server'
import { SidebarNav } from './sidebar-nav'

export async function Sidebar() {
  const supabase = await getSupabaseServer()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  let isSuperAdmin = false
  let unreadNotifications = 0

  if (user) {
    const { data: superAdmin } = await supabase
      .from('super_admins')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle()

    isSuperAdmin = !!superAdmin

    const organizationId = await getActiveOrganizationId(supabase, user.id)

    if (organizationId) {
      const { count } = await supabase
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', organizationId)
        .eq('is_read', false)

      unreadNotifications = count ?? 0
    }
  }

  return <SidebarNav isSuperAdmin={isSuperAdmin} unreadNotifications={unreadNotifications} />
}
