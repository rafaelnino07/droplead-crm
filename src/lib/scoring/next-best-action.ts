export type NextBestActionInput = {
    momentum: {
        score: number
        level: string
    }
    scpHealth: {
        score: number
        level: string
        risks: string[]
    }
    moneyRadar: {
        status: string
        totalDetected: number
        hotMoney: number
        atRiskMoney: number
        sleepingMoney: number
        recoverableMoney: number
        wonMoney: number
        lostMoney: number
    }
}

export type NextBestActionResult = {
    title: string
    description: string
    priority: "Alta" | "Media" | "Baja"
    actionType:
    | "follow_up"
    | "qualify"
    | "recover"
    | "close"
    | "document"
    | "expand"
    | "create_quote"
}

export function calculateNextBestAction(
    input: NextBestActionInput
): NextBestActionResult {
    const { momentum, scpHealth, moneyRadar } = input

    if (moneyRadar.status === "Caliente") {
        return {
            title: "Dar seguimiento hoy",
            description:
                "Hay dinero caliente detectado. Prioriza una conversación directa para avanzar la decisión.",
            priority: "Alta",
            actionType: "follow_up",
        }
    }

    if (moneyRadar.status === "En riesgo") {
        return {
            title: "Destrabar decisión",
            description:
                "La oportunidad tiene valor económico en riesgo. Contacta al cliente y detecta qué está frenando el avance.",
            priority: "Alta",
            actionType: "follow_up",
        }
    }

    if (moneyRadar.status === "Recuperable") {
        return {
            title: "Reactivar oportunidad",
            description:
                "Existe dinero recuperable. Reabre la conversación con una razón concreta o una nueva propuesta.",
            priority: "Alta",
            actionType: "recover",
        }
    }

    if (moneyRadar.status === "Dormido") {
        return {
            title: "Evaluar reactivación",
            description:
                "La oportunidad está dormida. Decide si se reactiva con seguimiento o se archiva para mantener limpio el pipeline.",
            priority: "Media",
            actionType: "recover",
        }
    }

    if (moneyRadar.status === "Ganado") {
        return {
            title: "Buscar expansión",
            description:
                "La cuenta ya generó ingreso. Busca recompra, referidos o un siguiente proyecto.",
            priority: "Media",
            actionType: "expand",
        }
    }

    if (moneyRadar.status === "Perdido") {
        return {
            title: "Documentar pérdida",
            description:
                "Registra por qué se perdió la oportunidad para mejorar futuras conversaciones comerciales.",
            priority: "Baja",
            actionType: "document",
        }
    }

    if (scpHealth.risks.some((risk) => risk.includes("No tiene teléfono"))) {
        return {
            title: "Completar teléfono",
            description:
                "El expediente no tiene teléfono. Sin este dato, el seguimiento comercial pierde fuerza.",
            priority: "Alta",
            actionType: "qualify",
        }
    }

    if (scpHealth.risks.some((risk) => risk.includes("No se conoce el origen"))) {
        return {
            title: "Registrar origen del lead",
            description:
                "Documenta de dónde llegó este lead para medir qué canales generan mejores oportunidades.",
            priority: "Media",
            actionType: "document",
        }
    }

    if (scpHealth.risks.some((risk) => risk.includes("No hay notas"))) {
        return {
            title: "Agregar notas comerciales",
            description:
                "Agrega contexto comercial: necesidad, presupuesto, urgencia, objeciones y siguiente paso.",
            priority: "Media",
            actionType: "document",
        }
    }

    if (momentum.score < 30 && moneyRadar.totalDetected === 0) {
        return {
            title: "Crear primera cotización",
            description:
                "No hay suficiente valor económico detectado. Si el lead está calificado, crea una cotización para activar el pipeline.",
            priority: "Media",
            actionType: "create_quote",
        }
    }

    return {
        title: "Mantener seguimiento",
        description:
            "La cuenta no muestra alertas críticas. Mantén el seguimiento y actualiza el expediente después de cada interacción.",
        priority: "Baja",
        actionType: "follow_up",
    }
}