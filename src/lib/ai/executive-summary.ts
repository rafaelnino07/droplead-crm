import {
    buildClientIntelligence,
    type ClientIntelligenceInput,
} from '@/lib/scp/client-intelligence'
import { generateText } from './anthropic-client'

export type ExecutiveSummaryInput = ClientIntelligenceInput

const SYSTEM_PROMPT = `Eres un analista comercial que redacta resúmenes ejecutivos para un CRM de servicios premium (domótica, remodelación, construcción, arquitectura e ingeniería especializada).

Reglas estrictas:
- Responde siempre en español.
- Sé breve: entre 4 y 6 líneas en prosa, sin viñetas ni encabezados.
- Sé accionable: termina señalando la próxima acción recomendada.
- No inventes información que no esté en el contexto. Si un dato no está disponible, simplemente omítelo.
- Tono profesional y directo, como si se lo explicaras a un colega que entra a la cuenta por primera vez.`

export async function generateExecutiveSummaryText(
    input: ExecutiveSummaryInput
): Promise<string> {
    const intelligence = buildClientIntelligence(input)
    const prompt = buildPrompt(input, intelligence)

    return generateText({
        system: SYSTEM_PROMPT,
        prompt,
        maxTokens: 400,
    })
}

function buildPrompt(
    input: ExecutiveSummaryInput,
    intelligence: ReturnType<typeof buildClientIntelligence>
): string {
    const { client, quotes, activities, commercialMemory } = input

    const lines: string[] = []

    lines.push('CONTEXTO DEL CLIENTE')
    lines.push(`Nombre: ${client.name}`)
    if (client.company) lines.push(`Empresa: ${client.company}`)
    if (client.source) lines.push(`Fuente del lead: ${client.source}`)
    lines.push(
        `Etapa SCP: ${intelligence.stageLabel} (probabilidad base ${intelligence.pipelineProgress.percentage}%)`
    )

    lines.push('')
    lines.push('MOTORES SCP')
    lines.push(
        `Momentum comercial: ${intelligence.momentum.score}/100 (${intelligence.momentum.level})`
    )
    if (intelligence.momentum.reasons.length > 0) {
        lines.push(`Señales de momentum: ${intelligence.momentum.reasons.join(', ')}`)
    }
    lines.push(
        `SCP Health: ${intelligence.scpHealth.score}/100 (${intelligence.scpHealth.level})`
    )
    if (intelligence.scpHealth.risks.length > 0) {
        lines.push(`Riesgos detectados: ${intelligence.scpHealth.risks.join(', ')}`)
    }
    lines.push(`Radar de dinero: ${intelligence.moneyRadar.status}`)
    if (intelligence.moneyRadar.totalDetected > 0) {
        lines.push(
            `Valor total detectado: $${intelligence.moneyRadar.totalDetected.toLocaleString('es-MX')}`
        )
    }
    lines.push(
        `Siguiente mejor acción sugerida por el sistema: ${intelligence.nextBestAction.title} — ${intelligence.nextBestAction.description}`
    )

    if (commercialMemory) {
        lines.push('')
        lines.push('MEMORIA COMERCIAL')

        if (commercialMemory.estimated_budget) {
            lines.push(
                `Presupuesto estimado: $${Number(commercialMemory.estimated_budget).toLocaleString('es-MX')}`
            )
        }
        if (commercialMemory.urgency) lines.push(`Urgencia: ${commercialMemory.urgency}`)
        if (commercialMemory.temperature) lines.push(`Temperatura: ${commercialMemory.temperature}`)
        if (commercialMemory.project_type) lines.push(`Tipo de proyecto: ${commercialMemory.project_type}`)
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
            const total = Number(quote.total ?? 0)
            lines.push(
                `- ${quote.quote_number ?? 'Sin folio'} · ${quote.project_name ?? 'Sin nombre de proyecto'} · $${total.toLocaleString('es-MX')} · ${quote.status ?? 'sin estatus'}`
            )
        }
    }

    if (activities.length > 0) {
        lines.push('')
        lines.push('ACTIVIDAD RECIENTE (más reciente primero)')

        for (const activity of activities.slice(0, 5)) {
            const date = activity.created_at
                ? new Date(activity.created_at).toLocaleDateString('es-MX')
                : 'sin fecha'
            lines.push(`- [${date}] ${activity.title ?? activity.type ?? 'Actividad'}`)
        }
    }

    lines.push('')
    lines.push(
        'Redacta el resumen ejecutivo siguiendo las reglas del system prompt, basándote únicamente en la información anterior.'
    )

    return lines.join('\n')
}
