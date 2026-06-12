import type { QuickActionType } from '@/lib/scp/quick-actions'
import type { ClientStage } from '@/lib/scp/stages'

const STAGE_AUTO_SYNC_RULES: Partial<Record<QuickActionType, ClientStage>> = {
    proposal_sent: 'cotizacion_enviada',
    verbal_acceptance: 'verbalmente_ganado',
    project_won: 'proyecto_cerrado',
    project_lost: 'perdido',
    plans_received: 'visita_tecnica_realizada',
}

const TERMINAL_STAGES: ClientStage[] = ['proyecto_cerrado', 'perdido']

export function getStageAutoSyncTarget(actionKey: QuickActionType): ClientStage | null {
    return STAGE_AUTO_SYNC_RULES[actionKey] ?? null
}

export function isTerminalStage(stage?: string | null): boolean {
    return TERMINAL_STAGES.includes(stage as ClientStage)
}
