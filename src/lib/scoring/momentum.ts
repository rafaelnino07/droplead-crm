export type MomentumResult = {
    score: number
    level: 'Crítico' | 'Frío' | 'Activo' | 'Caliente' | 'Momentum Máximo'
    reasons: string[]
}

type QuoteInput = {
    total: number | null
}

type ActivityInput = {
    created_at: string
}

function clampScore(score: number) {
    return Math.max(0, Math.min(100, score))
}

function getLevel(score: number): MomentumResult['level'] {
    if (score <= 25) return 'Crítico'
    if (score <= 50) return 'Frío'
    if (score <= 70) return 'Activo'
    if (score <= 85) return 'Caliente'
    return 'Momentum Máximo'
}

function getDaysSince(date: string) {
    const now = new Date()
    const past = new Date(date)

    const diffMs = now.getTime() - past.getTime()
    return Math.floor(diffMs / (1000 * 60 * 60 * 24))
}

export function calculateMomentum({
    quotes,
    activities,
}: {
    quotes: QuoteInput[]
    activities: ActivityInput[]
}): MomentumResult {
    let score = 0
    const reasons: string[] = []

    const totalPipelineValue = quotes.reduce((acc, quote) => {
        return acc + Number(quote.total ?? 0)
    }, 0)

    if (totalPipelineValue >= 500000) {
        score += 25
        reasons.push('Valor potencial alto')
    } else if (totalPipelineValue >= 250000) {
        score += 15
        reasons.push('Valor potencial medio-alto')
    } else if (totalPipelineValue >= 100000) {
        score += 10
        reasons.push('Valor potencial relevante')
    } else if (totalPipelineValue > 0) {
        score += 5
        reasons.push('Tiene valor potencial registrado')
    }

    if (quotes.length >= 4) {
        score += 30
        reasons.push('Tiene varias cotizaciones activas')
    } else if (quotes.length >= 2) {
        score += 20
        reasons.push('Tiene más de una cotización')
    } else if (quotes.length === 1) {
        score += 10
        reasons.push('Tiene una cotización creada')
    }

    const lastActivity = activities[0]

    let daysSinceLastActivity = 999

    if (lastActivity) {
        daysSinceLastActivity = getDaysSince(lastActivity.created_at)

        if (daysSinceLastActivity === 0) {
            score += 30
            reasons.push('Actividad registrada hoy')
        } else if (daysSinceLastActivity <= 3) {
            score += 20
            reasons.push('Actividad reciente')
        } else if (daysSinceLastActivity <= 7) {
            score += 10
            reasons.push('Actividad esta semana')
        } else if (daysSinceLastActivity <= 14) {
            score += 5
            reasons.push('Actividad en los últimos 14 días')
        }

        if (daysSinceLastActivity >= 90) {
            score -= 60
            reasons.push('Más de 90 días sin actividad')
        } else if (daysSinceLastActivity >= 60) {
            score -= 40
            reasons.push('Más de 60 días sin actividad')
        } else if (daysSinceLastActivity >= 30) {
            score -= 20
            reasons.push('Más de 30 días sin actividad')
        }
    } else {
        reasons.push('Sin actividad comercial registrada')
    }

    const finalScore = clampScore(score)

    return {
        score: finalScore,
        level: getLevel(finalScore),
        reasons,
    }
}