export const TASK_TYPES = [
    { value: 'call', label: 'Llamada', icon: '📞' },
    { value: 'whatsapp', label: 'WhatsApp', icon: '💬' },
    { value: 'visit', label: 'Visita', icon: '🏠' },
    { value: 'quote', label: 'Cotización', icon: '📄' },
    { value: 'follow_up', label: 'Follow up', icon: '🔄' },
    { value: 'other', label: 'Otro', icon: '✏️' },
] as const

export const TASK_TYPE_ICONS: Record<string, string> = {
    call: '📞',
    whatsapp: '💬',
    visit: '🏠',
    quote: '📄',
    follow_up: '🔄',
    other: '✏️',
}

export const TASK_PRIORITY_CLASSES: Record<'Alta' | 'Media' | 'Baja', string> = {
    Alta: 'bg-red-950 text-red-300 border border-red-900',
    Media: 'bg-amber-950 text-amber-300 border border-amber-900',
    Baja: 'bg-neutral-800 text-neutral-300 border border-neutral-700',
}

export function formatTaskDueDate(dueDate: string) {
    return new Date(dueDate).toLocaleString('es-MX', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
    })
}

export function isTaskOverdue(dueDate: string | null) {
    return !!dueDate && new Date(dueDate) < new Date()
}
