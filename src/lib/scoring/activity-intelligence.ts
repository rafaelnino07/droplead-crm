import { QUICK_ACTIONS, QuickActionCategory } from '@/lib/scp/quick-actions'

export type ActivityStatus = 'sin_actividad' | 'activo' | 'en_riesgo' | 'dormido'

export type ActivityIntelligenceResult = {
    daysSinceLastActivity: number | null
    activityStatus: ActivityStatus
    lastActivityLabel: string
    touchpointCount: number
    discoveryCount: number
    milestoneCount: number
    noteCount: number
    warningMessage: string | null
    recommendedOperationalAction: string
}

export const ACTIVITY_STATUS_LABELS: Record<ActivityStatus, string> = {
    sin_actividad: 'Sin actividad',
    activo: 'Activo',
    en_riesgo: 'En riesgo',
    dormido: 'Dormido',
}

type ActivityInput = {
    type?: string | null
    title?: string | null
    created_at?: string | null
}

const QUICK_ACTION_CATEGORY_MAP = new Map<string, QuickActionCategory>(
    QUICK_ACTIONS.map((action) => [action.key, action.category])
)

function getDaysSince(date: string) {
    const now = new Date()
    const past = new Date(date)

    const diffMs = now.getTime() - past.getTime()
    return Math.floor(diffMs / (1000 * 60 * 60 * 24))
}

function getWarningMessage(
    activityStatus: ActivityStatus,
    daysSinceLastActivity: number | null
): string | null {
    switch (activityStatus) {
        case 'sin_actividad':
            return 'Esta cuenta no tiene actividad registrada en el Timeline Comercial.'
        case 'en_riesgo':
            return `Han pasado ${daysSinceLastActivity} días sin actividad. La cuenta empieza a enfriarse.`
        case 'dormido':
            return `Han pasado ${daysSinceLastActivity} días sin actividad. La cuenta está dormida y en riesgo de perderse.`
        default:
            return null
    }
}

function getRecommendedOperationalAction({
    activityStatus,
    discoveryCount,
    milestoneCount,
}: {
    activityStatus: ActivityStatus
    discoveryCount: number
    milestoneCount: number
}): string {
    if (activityStatus === 'sin_actividad') {
        return 'Registra el primer touchpoint (llamada, WhatsApp o correo) para iniciar el seguimiento.'
    }

    if (activityStatus === 'dormido') {
        return 'Reactiva la cuenta con un nuevo contacto directo o valida si el proyecto sigue vigente.'
    }

    if (activityStatus === 'en_riesgo') {
        return 'Contacta a la cuenta antes de que se enfríe más: agenda una llamada o WhatsApp esta semana.'
    }

    if (milestoneCount > 0) {
        return 'Da seguimiento al hito más reciente y confirma el siguiente paso con el cliente.'
    }

    if (discoveryCount > 0) {
        return 'Prepara y envía la propuesta para avanzar al siguiente hito SCP.'
    }

    return 'Avanza el descubrimiento comercial: identifica decisor, presupuesto y fecha objetivo.'
}

export function calculateActivityIntelligence({
    activities,
}: {
    activities: ActivityInput[]
}): ActivityIntelligenceResult {
    let touchpointCount = 0
    let discoveryCount = 0
    let milestoneCount = 0
    let noteCount = 0

    for (const activity of activities) {
        const type = activity.type

        if (!type) continue

        if (type === 'note_added') {
            noteCount += 1
            continue
        }

        const category = QUICK_ACTION_CATEGORY_MAP.get(type)

        if (category === 'touchpoint') touchpointCount += 1
        else if (category === 'discovery') discoveryCount += 1
        else if (category === 'milestone') milestoneCount += 1
    }

    const lastActivity = activities[0]

    let daysSinceLastActivity: number | null = null
    let lastActivityLabel = 'Sin actividad registrada'
    let activityStatus: ActivityStatus = 'sin_actividad'

    if (lastActivity?.created_at) {
        daysSinceLastActivity = getDaysSince(lastActivity.created_at)
        lastActivityLabel = lastActivity.title ?? lastActivity.type ?? 'Actividad registrada'

        if (daysSinceLastActivity <= 3) {
            activityStatus = 'activo'
        } else if (daysSinceLastActivity <= 13) {
            activityStatus = 'en_riesgo'
        } else {
            activityStatus = 'dormido'
        }
    }

    const warningMessage = getWarningMessage(activityStatus, daysSinceLastActivity)
    const recommendedOperationalAction = getRecommendedOperationalAction({
        activityStatus,
        discoveryCount,
        milestoneCount,
    })

    return {
        daysSinceLastActivity,
        activityStatus,
        lastActivityLabel,
        touchpointCount,
        discoveryCount,
        milestoneCount,
        noteCount,
        warningMessage,
        recommendedOperationalAction,
    }
}
