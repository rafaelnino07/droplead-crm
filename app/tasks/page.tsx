import { redirect } from 'next/navigation'
import { getSupabaseServer, getActiveOrganizationId } from '@/lib/supabase/server'
import { ImpersonationBanner } from '../components/admin/impersonation-banner'
import { NewTaskForm } from '../components/tasks/new-task-form'
import { TaskCard } from '../components/tasks/task-card'
import type { Task } from '@/lib/types/database'

const PRIORITY_GROUPS: Task['priority'][] = ['Alta', 'Media', 'Baja']

export default async function TasksPage() {
    const supabase = await getSupabaseServer()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) redirect('/login')

    const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('user_id', user.id)
        .maybeSingle()

    if (!profile) redirect('/onboarding')

    const organizationId = await getActiveOrganizationId(supabase, user.id)

    const { data: tasksData, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('status', 'pending')
        .order('due_date', { ascending: true, nullsFirst: false })

    if (error) console.error('TASKS ERROR:', error)

    const tasks = tasksData ?? []

    const clientIds = Array.from(
        new Set(tasks.filter((task) => task.client_id).map((task) => task.client_id as string))
    )

    const { data: clientsData } =
        clientIds.length > 0
            ? await supabase.from('clients').select('id, name').in('id', clientIds)
            : { data: [] as { id: string; name: string }[] }

    const clientNameById = new Map((clientsData ?? []).map((c) => [c.id, c.name]))

    const groupedTasks = PRIORITY_GROUPS.map((priority) => ({
        priority,
        tasks: tasks.filter((task) => task.priority === priority),
    }))

    return (
        <>
        <ImpersonationBanner />
        <main className="min-h-screen bg-neutral-950 p-8 text-white">
            <div className="flex items-center justify-between gap-4">
                <div>
                    <p className="text-xs uppercase tracking-wider text-neutral-500">Gestión de tareas</p>
                    <h1 className="mt-1 text-3xl font-bold">Tareas pendientes</h1>
                </div>

                <span className="rounded-full bg-neutral-800 px-3 py-1 text-sm font-medium text-neutral-300">
                    {tasks.length}
                </span>
            </div>

            <div className="mt-6 max-w-2xl">
                <NewTaskForm />
            </div>

            <div className="mt-8 max-w-2xl space-y-8">
                {tasks.length === 0 ? (
                    <p className="text-neutral-400">No hay tareas pendientes. ¡Todo al día! 🎉</p>
                ) : (
                    groupedTasks.map(
                        ({ priority, tasks: group }) =>
                            group.length > 0 && (
                                <div key={priority}>
                                    <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-neutral-500">
                                        {priority}
                                    </h2>
                                    <div className="space-y-3">
                                        {group.map((task) => (
                                            <TaskCard
                                                key={task.id}
                                                task={task}
                                                clientName={task.client_id ? clientNameById.get(task.client_id) : null}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )
                    )
                )}
            </div>
        </main>
        </>
    )
}
