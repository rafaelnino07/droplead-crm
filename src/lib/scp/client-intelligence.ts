import { calculateMomentum } from '@/lib/scoring/momentum'
import { calculateScpHealth } from '@/lib/scoring/scp-health'
import { calculateMoneyRadar } from '@/lib/scoring/money-radar'
import { calculateNextBestAction } from '@/lib/scoring/next-best-action'
import { getClientStageLabel, getClientStageProbability } from '@/lib/scp/stages'
import { calculatePipelineProgress } from '@/lib/scp/progress'

export type ClientIntelligenceInput = {
    client: any
    quotes: any[]
    activities: any[]
    commercialMemory?: any | null
}

export function buildClientIntelligence({
    client,
    quotes,
    activities,
    commercialMemory,
}: ClientIntelligenceInput) {
    const momentum = calculateMomentum({
        quotes,
        activities,
    })

    const scpHealth = calculateScpHealth({
        client,
        quotes,
        activities,
    })

    const moneyRadar = calculateMoneyRadar({
        quotes,
        activities,
    })

    const nextBestAction = calculateNextBestAction({
        momentum,
        scpHealth,
        moneyRadar,
    })

    const stageLabel = getClientStageLabel(client.stage)
    const stageProgress = getClientStageProbability(client.stage)
    const pipelineProgress = calculatePipelineProgress(stageProgress)

    const concreteAction = getConcreteAction({
        client,
        commercialMemory,
        nextBestAction,
        moneyRadar,
        scpHealth,
    })

    return {
        client,
        momentum,
        scpHealth,
        moneyRadar,
        nextBestAction,
        stageLabel,
        pipelineProgress,
        concreteAction,
    }
}

function getConcreteAction({
    client,
    commercialMemory,
    nextBestAction,
    moneyRadar,
    scpHealth,
}: {
    client: any
    commercialMemory?: any | null
    nextBestAction: any
    moneyRadar: any
    scpHealth: any
}) {
    if (moneyRadar.status === 'Caliente') {
        return {
            title: 'Enviar seguimiento directo hoy',
            description: `Contacta a ${client.name} por WhatsApp o llamada y busca avanzar a la siguiente decisión comercial.`,
            suggestedMessage:
                'Hola, quería darle seguimiento a la propuesta/proyecto. ¿Tiene sentido que revisemos dudas y definamos el siguiente paso?',
        }
    }

    if (moneyRadar.status === 'En riesgo') {
        return {
            title: 'Destrabar objeción principal',
            description:
                'La oportunidad tiene dinero en riesgo. Pregunta directamente qué está frenando la decisión.',
            suggestedMessage:
                'Antes de avanzar, quiero entender algo: ¿qué tendría que quedar más claro para que puedan tomar una decisión con confianza?',
        }
    }

    if (moneyRadar.status === 'Recuperable') {
        return {
            title: 'Reactivar conversación con nuevo ángulo',
            description:
                'No mandes solo “seguimiento”. Reabre con contexto, una mejora o una pregunta concreta.',
            suggestedMessage:
                'Estuve revisando su caso y creo que hay una forma más simple de avanzar. ¿Le hace sentido que lo retomemos esta semana?',
        }
    }

    if (scpHealth.risks.some((risk: string) => risk.includes('No hay notas'))) {
        return {
            title: 'Completar notas comerciales',
            description:
                'Registra necesidad, presupuesto, urgencia, objeciones y próximo paso antes de seguir vendiendo.',
            suggestedMessage:
                'Actualizar expediente comercial antes del siguiente contacto.',
        }
    }

    if (!commercialMemory) {
        return {
            title: 'Crear memoria comercial',
            description:
                'Captura resumen ejecutivo, dolores, deseos, objeciones y próximo paso para no perder contexto.',
            suggestedMessage:
                'Completar Memoria Comercial de la cuenta.',
        }
    }

    return {
        title: nextBestAction.title,
        description: nextBestAction.description,
        suggestedMessage:
            'Revisar expediente, actualizar contexto y ejecutar el siguiente paso comercial.',
    }
}