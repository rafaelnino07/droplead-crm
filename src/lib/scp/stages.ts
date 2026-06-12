export type ClientStage =
    | 'nuevo_lead'
    | 'calificado_para_visita'
    | 'visita_tecnica_realizada'
    | 'cotizacion_enviada'
    | 'verbalmente_ganado'
    | 'proyecto_cerrado'
    | 'perdido'
    | 'pausado'

export const CLIENT_STAGES: {
    key: ClientStage
    label: string
    probability: number
}[] = [
        {
            key: 'nuevo_lead',
            label: 'Nuevo Lead',
            probability: 5,
        },
        {
            key: 'calificado_para_visita',
            label: 'Calificado para Visita',
            probability: 20,
        },
        {
            key: 'visita_tecnica_realizada',
            label: 'Visita Técnica Realizada',
            probability: 40,
        },
        {
            key: 'cotizacion_enviada',
            label: 'Cotización Enviada',
            probability: 60,
        },
        {
            key: 'verbalmente_ganado',
            label: 'Verbalmente Ganado',
            probability: 85,
        },
        {
            key: 'proyecto_cerrado',
            label: 'Proyecto Cerrado',
            probability: 100,
        },
        {
            key: 'perdido',
            label: 'Perdido',
            probability: 0,
        },
        {
            key: 'pausado',
            label: 'Pausado',
            probability: 10,
        },
    ]

export function getClientStageLabel(stage?: string | null): string {
    return CLIENT_STAGES.find((item) => item.key === stage)?.label ?? 'Nuevo Lead'
}

export function getClientStageProbability(stage?: string | null): number {
    return CLIENT_STAGES.find((item) => item.key === stage)?.probability ?? 5
}