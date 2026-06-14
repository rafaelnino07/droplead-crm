'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { getSupabaseServer } from '@/lib/supabase/server'

export async function createTask(formData: FormData) {
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

    const title = String(formData.get('title') ?? '').trim()

    if (!title) {
        throw new Error('Title is required')
    }

    const description = String(formData.get('description') ?? '').trim()
    const type = String(formData.get('type') || 'follow_up').trim()
    const priority = String(formData.get('priority') || 'Media').trim()
    const dueDate = String(formData.get('due_date') ?? '').trim()
    const clientId = String(formData.get('client_id') ?? '').trim()

    const { data: task, error } = await supabase
        .from('tasks')
        .insert({
            organization_id: profile.organization_id,
            client_id: clientId || null,
            created_by: user.id,
            title,
            description: description || null,
            type,
            priority: priority as 'Alta' | 'Media' | 'Baja',
            status: 'pending',
            due_date: dueDate || null,
            completed_at: null,
        })
        .select('id, title, client_id')
        .single()

    if (error) {
        throw error
    }

    if (task.client_id) {
        const { error: activityError } = await supabase
            .from('client_activities')
            .insert({
                organization_id: profile.organization_id,
                client_id: task.client_id,
                created_by: user.id,
                type: 'task_created',
                title: 'Tarea creada',
                description: task.title,
                metadata: { task_id: task.id },
            })

        if (activityError) console.error('TASK CREATED ACTIVITY ERROR:', activityError)
    }

    revalidatePath('/dashboard')
    revalidatePath('/tasks')

    if (task.client_id) {
        revalidatePath(`/clients/${task.client_id}`)
    }
}

export async function completeTask(formData: FormData) {
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

    const taskId = String(formData.get('task_id'))
    const clientId = String(formData.get('client_id') ?? '').trim()

    const { data: task, error } = await supabase
        .from('tasks')
        .update({
            status: 'done',
            completed_at: new Date().toISOString(),
        })
        .eq('id', taskId)
        .eq('organization_id', profile.organization_id)
        .select('id, title')
        .single()

    if (error) {
        throw error
    }

    if (clientId) {
        const { error: activityError } = await supabase
            .from('client_activities')
            .insert({
                organization_id: profile.organization_id,
                client_id: clientId,
                created_by: user.id,
                type: 'task_completed',
                title: 'Tarea completada',
                description: task.title,
                metadata: { task_id: task.id },
            })

        if (activityError) console.error('TASK COMPLETED ACTIVITY ERROR:', activityError)
    }

    revalidatePath('/dashboard')
    revalidatePath('/tasks')
}

export async function cancelTask(formData: FormData) {
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

    const taskId = String(formData.get('task_id'))

    const { error } = await supabase
        .from('tasks')
        .update({ status: 'cancelled' })
        .eq('id', taskId)
        .eq('organization_id', profile.organization_id)

    if (error) {
        throw error
    }

    revalidatePath('/tasks')
}
