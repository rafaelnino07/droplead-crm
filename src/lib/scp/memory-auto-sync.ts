import type { QuickActionType } from '@/lib/scp/quick-actions'

export type MemoryAutoSyncPatch = {
    next_step?: string
    temperature?: string
    closing_probability?: number
    competitors?: string
}

export type CurrentMemorySnapshot = {
    competitors?: string | null
} | null

const MEMORY_AUTO_SYNC_ACTIONS: QuickActionType[] = [
    'budget_confirmed',
    'decision_maker_identified',
    'plans_received',
    'competitor_identified',
    'target_date_defined',
    'verbal_acceptance',
    'project_won',
    'project_lost',
    'no_response',
]

export function isMemoryAutoSyncAction(actionKey: QuickActionType): boolean {
    return MEMORY_AUTO_SYNC_ACTIONS.includes(actionKey)
}

export function buildMemoryAutoSyncPatch({
    actionKey,
    currentMemory,
}: {
    actionKey: QuickActionType
    currentMemory: CurrentMemorySnapshot
}): MemoryAutoSyncPatch | null {
    switch (actionKey) {
        case 'budget_confirmed':
            return {
                next_step: 'Presupuesto confirmado. Definir propuesta o siguiente decisión.',
            }

        case 'decision_maker_identified':
            return {
                next_step: 'Decisor identificado. Confirmar criterios de decisión.',
            }

        case 'plans_received':
            return {
                next_step: 'Planos recibidos. Revisar alcance y preparar propuesta.',
            }

        case 'competitor_identified': {
            const patch: MemoryAutoSyncPatch = {
                next_step: 'Diferenciar propuesta frente a competidor.',
            }

            if (!currentMemory?.competitors) {
                patch.competitors = 'Competidor mencionado / pendiente detallar'
            }

            return patch
        }

        case 'target_date_defined':
            return {
                next_step: 'Fecha objetivo definida. Alinear propuesta y tiempos.',
            }

        case 'verbal_acceptance':
            return {
                temperature: 'Muy caliente',
                closing_probability: 85,
                next_step: 'Formalizar aceptación verbal y preparar cierre.',
            }

        case 'project_won':
            return {
                temperature: 'Ganado',
                closing_probability: 100,
                next_step: 'Proyecto ganado. Preparar onboarding o ejecución.',
            }

        case 'project_lost':
            return {
                temperature: 'Perdido',
                closing_probability: 0,
                next_step: 'Proyecto perdido. Registrar motivo y aprendizaje.',
            }

        case 'no_response':
            return {
                temperature: 'Frío',
                next_step: 'Reactivar contacto con nuevo ángulo.',
            }

        default:
            return null
    }
}
