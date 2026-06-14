import { generateText } from './anthropic-client'
import { loadAIContext } from '../ai/context-loader'

export type DealCoachInput = {
    client: {
        name: string
        company: string | null
        stage: string | null
        stageLabel: string
    }
    momentum: { score: number; level: string; reasons: string[] }
    scpHealth: { score: number; level: string; risks: string[] }
    moneyRadar: { status: string; totalDetected: number; hotMoney: number; atRiskMoney: number }
    nextBestAction: { title: string; description: string; priority: string }
    commercialMemory: {
        pain_points: string | null
        desires: string | null
        objections: string | null
        competitors: string | null
        urgency: string | null
        temperature: string | null
        next_step: string | null
    } | null
    recentActivities: { type: string; title: string; created_at: string }[]
    quotes: { quote_number: string; status: string; total: number }[]
}

const SYSTEM_PROMPT = `Eres un coach comercial experto en ventas consultivas de servicios premium en Latinoamérica (domótica, remodelación, construcción). Conoces el mercado mexicano y latinoamericano profundamente.

Reglas estrictas:
- Responde siempre en español latino natural — como hablaría un mentor experimentado de negocios en México o Colombia, no como un consultor corporativo.
- Usa un tono cálido, directo y humano. Como si fuera un amigo que sabe mucho de ventas y te está dando un consejo real entre cafés.
- Los mensajes de WhatsApp que sugieras deben sonar como los escribe una persona real en LATAM — sin formalidades innecesarias, con contracciones naturales, emojis ocasionales si aplica, y el tuteo o ustedeo según el contexto del cliente.
- Sé específico y accionable. Nada genérico.
- Estructura tu respuesta en exactamente 3 partes separadas por saltos de línea:
  1. SITUACIÓN (1 oración): qué está pasando con esta cuenta ahora mismo.
  2. RIESGO (1 oración): qué puede salir mal si no se actúa hoy.
  3. ACCIÓN EXACTA (2-3 oraciones): qué decir, cómo decirlo, por qué canal y cuándo. Incluye un mensaje de WhatsApp listo para copiar y pegar, escrito como lo escribiría una persona real — no un vendedor corporativo.
- Usa los datos del contexto. No inventes.
- Nunca uses frases como "es crucial", "es imperativo", "es fundamental" — suenan a robot.
- Tono: mentor que conoce la cuenta, habla directo, quiere que el vendedor cierre.`

export async function generateDealCoach(input: DealCoachInput): Promise<string> {
    const prompt = buildPrompt(input)

    const context = loadAIContext('deal-coach')
    const enrichedSystem = context
        ? `${SYSTEM_PROMPT}\n\n---\nMETODOLOGÍA Y CONTEXTO DEL NEGOCIO:\n${context}`
        : SYSTEM_PROMPT

    return generateText({
        system: enrichedSystem,
        prompt,
        maxTokens: 400,
    })
}

function formatCurrency(value: number): string {
    return `$${value.toLocaleString('es-MX', { maximumFractionDigits: 0 })}`
}

function buildPrompt(input: DealCoachInput): string {
    const { client, momentum, scpHealth, moneyRadar, nextBestAction, commercialMemory, recentActivities, quotes } = input

    const lines: string[] = []

    lines.push('CUENTA')
    lines.push(`Nombre: ${client.name}`)
    if (client.company) lines.push(`Empresa: ${client.company}`)
    lines.push(`Etapa SCP: ${client.stageLabel}`)

    lines.push('')
    lines.push('MOTORES SCP')
    lines.push(`Momentum comercial: ${momentum.score}/100 (${momentum.level})`)
    if (momentum.reasons.length > 0) {
        lines.push(`Señales de momentum: ${momentum.reasons.join(', ')}`)
    }
    lines.push(`SCP Health: ${scpHealth.score}/100 (${scpHealth.level})`)
    if (scpHealth.risks.length > 0) {
        lines.push(`Riesgos detectados: ${scpHealth.risks.join(', ')}`)
    }
    lines.push(`Radar de dinero: ${moneyRadar.status}`)
    if (moneyRadar.totalDetected > 0) {
        lines.push(`Valor total detectado: ${formatCurrency(moneyRadar.totalDetected)}`)
    }
    if (moneyRadar.hotMoney > 0) {
        lines.push(`Dinero caliente: ${formatCurrency(moneyRadar.hotMoney)}`)
    }
    if (moneyRadar.atRiskMoney > 0) {
        lines.push(`Dinero en riesgo: ${formatCurrency(moneyRadar.atRiskMoney)}`)
    }
    lines.push(
        `Siguiente mejor acción sugerida por el sistema: ${nextBestAction.title} — ${nextBestAction.description} (prioridad ${nextBestAction.priority})`
    )

    if (commercialMemory) {
        lines.push('')
        lines.push('MEMORIA COMERCIAL')

        if (commercialMemory.urgency) lines.push(`Urgencia: ${commercialMemory.urgency}`)
        if (commercialMemory.temperature) lines.push(`Temperatura: ${commercialMemory.temperature}`)
        if (commercialMemory.pain_points) lines.push(`Dolores detectados: ${commercialMemory.pain_points}`)
        if (commercialMemory.desires) lines.push(`Deseos detectados: ${commercialMemory.desires}`)
        if (commercialMemory.objections) lines.push(`Objeciones: ${commercialMemory.objections}`)
        if (commercialMemory.competitors) lines.push(`Competidores mencionados: ${commercialMemory.competitors}`)
        if (commercialMemory.next_step) lines.push(`Próximo paso registrado: ${commercialMemory.next_step}`)
    }

    if (quotes.length > 0) {
        lines.push('')
        lines.push('COTIZACIONES')

        for (const quote of quotes) {
            lines.push(`- ${quote.quote_number} · ${formatCurrency(quote.total)} · ${quote.status}`)
        }
    }

    if (recentActivities.length > 0) {
        lines.push('')
        lines.push('ACTIVIDAD RECIENTE (más reciente primero)')

        for (const activity of recentActivities.slice(0, 5)) {
            const date = new Date(activity.created_at).toLocaleDateString('es-MX')
            lines.push(`- [${date}] ${activity.title} (${activity.type})`)
        }
    }

    lines.push('')
    lines.push(
        'Redacta el consejo del Deal Coach siguiendo las reglas del system prompt, basándote únicamente en la información anterior.'
    )

    return lines.join('\n')
}
