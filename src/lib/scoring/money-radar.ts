export type MoneyRadarStatus =
    | "Caliente"
    | "En riesgo"
    | "Dormido"
    | "Recuperable"
    | "Ganado"
    | "Perdido"
    | "Sin dinero detectado"

export type MoneyRadarInput = {
    quotes: {
        id?: string | null
        quote_number?: string | null
        status?: string | null
        total?: number | string | null
        valid_until?: string | null
        sent_at?: string | null
        accepted_at?: string | null
        rejected_at?: string | null
        created_at?: string | null
    }[]
    activities: {
        type?: string | null
        title?: string | null
        created_at?: string | null
    }[]
}

export type MoneyRadarResult = {
    status: MoneyRadarStatus
    totalDetected: number
    hotMoney: number
    atRiskMoney: number
    sleepingMoney: number
    recoverableMoney: number
    wonMoney: number
    lostMoney: number
    reasons: string[]
    recommendedAction: string
}

function toNumber(value: number | string | null | undefined): number {
    if (value === null || value === undefined) return 0

    const parsed = Number(value)

    return Number.isNaN(parsed) ? 0 : parsed
}

function daysSince(date?: string | null): number | null {
    if (!date) return null

    const parsed = new Date(date)

    if (Number.isNaN(parsed.getTime())) return null

    const now = new Date()
    const diff = now.getTime() - parsed.getTime()

    return Math.floor(diff / (1000 * 60 * 60 * 24))
}

function daysUntil(date?: string | null): number | null {
    if (!date) return null

    const parsed = new Date(date)

    if (Number.isNaN(parsed.getTime())) return null

    const now = new Date()
    const diff = parsed.getTime() - now.getTime()

    return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

export function calculateMoneyRadar(input: MoneyRadarInput): MoneyRadarResult {
    const { quotes, activities } = input

    const reasons: string[] = []

    const latestActivity = activities
        .filter((activity) => activity.created_at)
        .sort(
            (a, b) =>
                new Date(b.created_at as string).getTime() -
                new Date(a.created_at as string).getTime()
        )[0]

    const lastActivityDays = daysSince(latestActivity?.created_at)

    let hotMoney = 0
    let atRiskMoney = 0
    let sleepingMoney = 0
    let recoverableMoney = 0
    let wonMoney = 0
    let lostMoney = 0

    for (const quote of quotes) {
        const total = toNumber(quote.total)

        if (total <= 0) continue

        const quoteAgeDays = daysSince(quote.sent_at ?? quote.created_at)
        const validDaysLeft = daysUntil(quote.valid_until)

        const isAccepted = quote.status === "accepted" || Boolean(quote.accepted_at)
        const isRejected = quote.status === "rejected" || Boolean(quote.rejected_at)

        if (isAccepted) {
            wonMoney += total
            continue
        }

        if (isRejected) {
            lostMoney += total

            if (quoteAgeDays !== null && quoteAgeDays <= 30) {
                recoverableMoney += total
            }

            continue
        }

        if (
            validDaysLeft !== null &&
            validDaysLeft >= 0 &&
            validDaysLeft <= 7 &&
            lastActivityDays !== null &&
            lastActivityDays <= 7
        ) {
            hotMoney += total
            continue
        }

        if (
            validDaysLeft !== null &&
            validDaysLeft >= 0 &&
            validDaysLeft <= 7
        ) {
            atRiskMoney += total
            continue
        }

        if (
            lastActivityDays !== null &&
            lastActivityDays > 14 &&
            quoteAgeDays !== null &&
            quoteAgeDays <= 60
        ) {
            recoverableMoney += total
            continue
        }

        if (
            quoteAgeDays !== null &&
            quoteAgeDays > 30
        ) {
            sleepingMoney += total
            continue
        }

        hotMoney += total
    }

    const totalDetected =
        hotMoney +
        atRiskMoney +
        sleepingMoney +
        recoverableMoney +
        wonMoney +
        lostMoney

    let status: MoneyRadarStatus = "Sin dinero detectado"
    let recommendedAction =
        "Crear una cotización o registrar actividad comercial para activar el radar."

    if (totalDetected <= 0) {
        reasons.push("No hay valor económico suficiente para clasificar esta cuenta.")
    } else if (hotMoney > 0) {
        status = "Caliente"
        reasons.push("Hay dinero activo con señales recientes de oportunidad.")
        recommendedAction =
            "Priorizar seguimiento inmediato. Esta cuenta puede convertirse pronto."
    } else if (atRiskMoney > 0) {
        status = "En riesgo"
        reasons.push("Hay cotizaciones próximas a vencer o sin suficiente movimiento.")
        recommendedAction =
            "Contactar al cliente y destrabar la siguiente decisión antes de que se enfríe."
    } else if (recoverableMoney > 0) {
        status = "Recuperable"
        reasons.push("Hay dinero que todavía puede recuperarse con seguimiento estratégico.")
        recommendedAction =
            "Reabrir conversación con una razón concreta, nueva propuesta o ajuste comercial."
    } else if (sleepingMoney > 0) {
        status = "Dormido"
        reasons.push("Hay dinero detectado, pero lleva demasiado tiempo sin señales fuertes.")
        recommendedAction =
            "Evaluar si vale la pena reactivar o archivar esta oportunidad."
    } else if (wonMoney > 0) {
        status = "Ganado"
        reasons.push("Esta cuenta ya tiene dinero ganado.")
        recommendedAction =
            "Buscar expansión, recompra, referidos o siguiente proyecto."
    } else if (lostMoney > 0) {
        status = "Perdido"
        reasons.push("El valor detectado pertenece a cotizaciones rechazadas.")
        recommendedAction =
            "Documentar motivo de pérdida y usarlo como aprendizaje comercial."
    }

    return {
        status,
        totalDetected,
        hotMoney,
        atRiskMoney,
        sleepingMoney,
        recoverableMoney,
        wonMoney,
        lostMoney,
        reasons,
        recommendedAction,
    }
}