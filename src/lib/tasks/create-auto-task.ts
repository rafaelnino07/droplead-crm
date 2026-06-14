import type { SupabaseClient } from '@supabase/supabase-js'
import { generateAutoTask, type AutoTaskTrigger } from './auto-tasks'

export async function createAutoTask({
    supabase,
    organizationId,
    clientId,
    createdBy,
    trigger,
}: {
    supabase: SupabaseClient
    organizationId: string
    clientId: string | null
    createdBy: string | null
    trigger: AutoTaskTrigger
}) {
    const suggestion = generateAutoTask(trigger)
    if (!suggestion) return

    const dueDate = new Date()
    dueDate.setHours(dueDate.getHours() + suggestion.due_in_hours)

    const { error } = await supabase.from('tasks').insert({
        organization_id: organizationId,
        client_id: clientId,
        created_by: createdBy,
        title: suggestion.title,
        description: suggestion.description,
        type: suggestion.type,
        priority: suggestion.priority,
        status: 'pending',
        due_date: dueDate.toISOString(),
    })

    if (error) console.error('AUTO TASK ERROR:', error)
}
