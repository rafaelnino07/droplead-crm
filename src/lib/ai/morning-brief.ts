import { generateText } from './anthropic-client'

export type MorningBriefInput = {
    organizationName: string
    firstName: string
    date: string
    stats: {
        totalClients: number
        openQuotes: number
        pipelineValue: number
        closedThisMonth: number
    }
    topActions: {
        clientName: string
        clientStage: string
        actionTitle: string
        actionPriority: string
        moneyStatus: string
        totalDetected: number
    }[]
    pendingTasks: {
        title: string
        priority: string
        dueDate: string | null
        clientName: string | null
        isOverdue: boolean
    }[]
    radarSummary: {
        hotMoney: number
        atRiskMoney: number
        recoverableMoney: number
        wonMoney: number
    }
    recentActivities: {
        title: string
        clientName: string
        createdAt: string
    }[]
}

const SYSTEM_PROMPT = `Eres el copiloto comercial de Droplead. Cada mañana generas un brief ejecutivo personalizado para el dueño del negocio.

Reglas estrictas:
- Responde siempre en español.
- Máximo 6 oraciones. Sin viñetas. Sin encabezados. Solo prosa fluida.
- Empieza con una frase de contexto general del negocio (¿cómo va hoy?).
- Menciona el riesgo más importante si existe dinero en riesgo o tareas vencidas.
- Termina con UNA acción concreta y específica que el dueño debe ejecutar primero hoy.
- Tono: como un socio estratégico que conoce el negocio, directo y sin rodeos.
- No inventes datos. Usa solo lo que está en el contexto.`

export async function generateMorningBrief(input: MorningBriefInput): Promise<string> {
    const prompt = buildPrompt(input)

    return generateText({
        system: SYSTEM_PROMPT,
        prompt,
        maxTokens: 400,
    })
}

function formatCurrency(value: number): string {
    return `$${value.toLocaleString('es-MX', { maximumFractionDigits: 0 })}`
}

function buildPrompt(input: MorningBriefInput): string {
    const { organizationName, firstName, date, stats, topActions, pendingTasks, radarSummary, recentActivities } = input

    const lines: string[] = []

    lines.push('CONTEXTO')
    lines.push(`Negocio: ${organizationName}`)
    lines.push(`Destinatario: ${firstName}`)
    lines.push(`Fecha: ${date}`)

    lines.push('')
    lines.push('MÉTRICAS GENERALES')
    lines.push(`Clientes totales: ${stats.totalClients}`)
    lines.push(`Cotizaciones abiertas: ${stats.openQuotes}`)
    lines.push(`Valor en pipeline: ${formatCurrency(stats.pipelineValue)}`)
    lines.push(`Proyectos cerrados este mes: ${stats.closedThisMonth}`)

    lines.push('')
    lines.push('RADAR DE DINERO')
    if (radarSummary.hotMoney > 0) {
        lines.push(`Dinero caliente: ${formatCurrency(radarSummary.hotMoney)}`)
    }
    if (radarSummary.atRiskMoney > 0) {
        lines.push(`Dinero en riesgo: ${formatCurrency(radarSummary.atRiskMoney)}`)
    }
    if (radarSummary.recoverableMoney > 0) {
        lines.push(`Dinero recuperable: ${formatCurrency(radarSummary.recoverableMoney)}`)
    }
    if (radarSummary.wonMoney > 0) {
        lines.push(`Dinero ganado: ${formatCurrency(radarSummary.wonMoney)}`)
    }
    if (
        radarSummary.hotMoney === 0 &&
        radarSummary.atRiskMoney === 0 &&
        radarSummary.recoverableMoney === 0 &&
        radarSummary.wonMoney === 0
    ) {
        lines.push('No hay dinero detectado en el radar todavía.')
    }

    if (topActions.length > 0) {
        lines.push('')
        lines.push('TOP ACCIONES PENDIENTES')
        for (const action of topActions) {
            const detected = action.totalDetected > 0 ? ` · valor detectado ${formatCurrency(action.totalDetected)}` : ''
            lines.push(
                `- ${action.clientName} (${action.clientStage}) · ${action.actionTitle} · prioridad ${action.actionPriority} · radar: ${action.moneyStatus}${detected}`
            )
        }
    }

    const overdueTasks = pendingTasks.filter((task) => task.isOverdue)
    if (overdueTasks.length > 0) {
        lines.push('')
        lines.push('TAREAS VENCIDAS')
        for (const task of overdueTasks) {
            lines.push(`- ${task.title}${task.clientName ? ` · ${task.clientName}` : ''} · prioridad ${task.priority}`)
        }
    }

    if (pendingTasks.length > 0) {
        lines.push('')
        lines.push('TAREAS PENDIENTES')
        for (const task of pendingTasks) {
            const due = task.dueDate ? ` · vence ${new Date(task.dueDate).toLocaleDateString('es-MX')}` : ''
            const overdue = task.isOverdue ? ' · VENCIDA' : ''
            lines.push(`- ${task.title}${task.clientName ? ` · ${task.clientName}` : ''} · prioridad ${task.priority}${due}${overdue}`)
        }
    }

    if (recentActivities.length > 0) {
        lines.push('')
        lines.push('ACTIVIDAD RECIENTE')
        for (const activity of recentActivities) {
            const date = new Date(activity.createdAt).toLocaleDateString('es-MX')
            lines.push(`- [${date}] ${activity.title} · ${activity.clientName}`)
        }
    }

    lines.push('')
    lines.push(
        'Redacta el CEO Morning Brief siguiendo las reglas del system prompt, basándote únicamente en la información anterior.'
    )

    return lines.join('\n')
}
