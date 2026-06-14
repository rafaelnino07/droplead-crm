import { generateText } from './anthropic-client'

export type RevenueCopilotContext = {
    stats: {
        totalClients: number
        openQuotes: number
        pipelineValue: number
        closedThisMonth: number
    }
    clients: {
        name: string
        stage: string
        moneyStatus: string
        totalDetected: number
    }[]
    quotes: {
        clientName: string
        projectName: string | null
        status: string
        total: number
        daysSinceSent: number | null
    }[]
    tasks: {
        title: string
        priority: string
        clientName: string | null
        isOverdue: boolean
    }[]
    radarSummary: {
        hotMoney: number
        atRiskMoney: number
        recoverableMoney: number
        wonMoney: number
    }
}

const SYSTEM_PROMPT = `Eres el Revenue Copilot de Droplead — un asistente comercial que responde preguntas sobre el pipeline de ventas de un negocio premium en México/LATAM.

Reglas:
- Responde siempre en español, tono conversacional y directo.
- Máximo 4-6 oraciones. Sin listas largas. Sin encabezados.
- Usa los datos reales del contexto. Menciona nombres, montos y fechas específicas.
- Si la pregunta no puede responderse con los datos disponibles, dilo honestamente.
- Termina siempre con UNA acción concreta sugerida.
- Nunca inventes datos que no estén en el contexto.`

export async function askRevenueCopilot(question: string, context: RevenueCopilotContext): Promise<string> {
    const prompt = buildPrompt(question, context)

    return generateText({
        system: SYSTEM_PROMPT,
        prompt,
        maxTokens: 400,
    })
}

function formatCurrency(value: number): string {
    return `$${value.toLocaleString('es-MX', { maximumFractionDigits: 0 })}`
}

function buildPrompt(question: string, context: RevenueCopilotContext): string {
    const { stats, clients, quotes, tasks, radarSummary } = context

    const lines: string[] = []

    lines.push('MÉTRICAS GENERALES')
    lines.push(`Clientes totales: ${stats.totalClients}`)
    lines.push(`Cotizaciones abiertas: ${stats.openQuotes}`)
    lines.push(`Valor en pipeline: ${formatCurrency(stats.pipelineValue)}`)
    lines.push(`Proyectos cerrados este mes: ${stats.closedThisMonth}`)

    lines.push('')
    lines.push('RADAR DE DINERO')
    lines.push(`Dinero caliente: ${formatCurrency(radarSummary.hotMoney)}`)
    lines.push(`Dinero en riesgo: ${formatCurrency(radarSummary.atRiskMoney)}`)
    lines.push(`Dinero recuperable: ${formatCurrency(radarSummary.recoverableMoney)}`)
    lines.push(`Dinero ganado: ${formatCurrency(radarSummary.wonMoney)}`)

    if (clients.length > 0) {
        lines.push('')
        lines.push('CLIENTES')
        for (const client of clients) {
            const detected = client.totalDetected > 0 ? ` · valor detectado ${formatCurrency(client.totalDetected)}` : ''
            lines.push(`- ${client.name} · etapa: ${client.stage} · radar: ${client.moneyStatus}${detected}`)
        }
    }

    if (quotes.length > 0) {
        lines.push('')
        lines.push('COTIZACIONES')
        for (const quote of quotes) {
            const project = quote.projectName ? ` (${quote.projectName})` : ''
            const sentInfo = quote.daysSinceSent !== null ? ` · enviada hace ${quote.daysSinceSent} días` : ''
            lines.push(`- ${quote.clientName}${project} · ${formatCurrency(quote.total)} · ${quote.status}${sentInfo}`)
        }
    }

    const overdueTasks = tasks.filter((task) => task.isOverdue)
    if (overdueTasks.length > 0) {
        lines.push('')
        lines.push('TAREAS VENCIDAS')
        for (const task of overdueTasks) {
            lines.push(`- ${task.title}${task.clientName ? ` · ${task.clientName}` : ''} · prioridad ${task.priority}`)
        }
    }

    if (tasks.length > 0) {
        lines.push('')
        lines.push('TAREAS PENDIENTES')
        for (const task of tasks) {
            lines.push(
                `- ${task.title}${task.clientName ? ` · ${task.clientName}` : ''} · prioridad ${task.priority}${task.isOverdue ? ' · VENCIDA' : ''}`
            )
        }
    }

    lines.push('')
    lines.push('PREGUNTA DEL USUARIO')
    lines.push(question)

    lines.push('')
    lines.push('Responde la pregunta siguiendo las reglas del system prompt, basándote únicamente en la información anterior.')

    return lines.join('\n')
}
