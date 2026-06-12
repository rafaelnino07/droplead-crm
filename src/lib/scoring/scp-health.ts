export type ScpHealthLevel = "Crítico" | "Débil" | "Estable" | "Saludable" | "Excelente";

export type ScpHealthInput = {
    client: {
        name?: string | null;
        company?: string | null;
        email?: string | null;
        phone?: string | null;
        source?: string | null;
        notes?: string | null;
        created_at?: string | null;
        is_active?: boolean | null;
    };
    quotes: {
        status?: string | null;
        total?: number | string | null;
        valid_until?: string | null;
        sent_at?: string | null;
        accepted_at?: string | null;
        rejected_at?: string | null;
        created_at?: string | null;
    }[];
    activities: {
        type?: string | null;
        title?: string | null;
        created_at?: string | null;
    }[];
};

export type ScpHealthResult = {
    score: number;
    level: ScpHealthLevel;
    reasons: string[];
    risks: string[];
};

function daysSince(date?: string | null): number | null {
    if (!date) return null;

    const parsed = new Date(date);
    if (Number.isNaN(parsed.getTime())) return null;

    const now = new Date();
    const diff = now.getTime() - parsed.getTime();

    return Math.floor(diff / (1000 * 60 * 60 * 24));
}

function toNumber(value: number | string | null | undefined): number {
    if (value === null || value === undefined) return 0;
    const parsed = Number(value);
    return Number.isNaN(parsed) ? 0 : parsed;
}

export function calculateScpHealth(input: ScpHealthInput): ScpHealthResult {
    let score = 0;
    const reasons: string[] = [];
    const risks: string[] = [];

    const { client, quotes, activities } = input;

    const hasEmail = Boolean(client.email);
    const hasPhone = Boolean(client.phone);
    const hasCompany = Boolean(client.company);
    const hasSource = Boolean(client.source);
    const hasNotes = Boolean(client.notes);

    const latestActivity = activities
        .filter((activity) => activity.created_at)
        .sort(
            (a, b) =>
                new Date(b.created_at as string).getTime() -
                new Date(a.created_at as string).getTime()
        )[0];

    const lastActivityDays = daysSince(latestActivity?.created_at);

    const activeQuotes = quotes.filter(
        (quote) =>
            quote.status !== "rejected" &&
            quote.status !== "accepted" &&
            !quote.rejected_at &&
            !quote.accepted_at
    );

    const acceptedQuotes = quotes.filter(
        (quote) => quote.status === "accepted" || quote.accepted_at
    );

    const rejectedQuotes = quotes.filter(
        (quote) => quote.status === "rejected" || quote.rejected_at
    );

    const totalPipelineValue = activeQuotes.reduce(
        (sum, quote) => sum + toNumber(quote.total),
        0
    );

    if (client.is_active) {
        score += 10;
        reasons.push("Cliente activo en el sistema");
    } else {
        risks.push("Cliente marcado como inactivo");
    }

    if (hasEmail) score += 8;
    else risks.push("No tiene correo registrado");

    if (hasPhone) score += 8;
    else risks.push("No tiene teléfono registrado");

    if (hasCompany) score += 6;
    else risks.push("No tiene empresa registrada");

    if (hasSource) {
        score += 6;
        reasons.push("Origen del lead registrado");
    } else {
        risks.push("No se conoce el origen del lead");
    }

    if (hasNotes) {
        score += 7;
        reasons.push("Tiene notas comerciales registradas");
    } else {
        risks.push("No hay notas comerciales en el expediente");
    }

    if (activities.length >= 5) {
        score += 15;
        reasons.push("Tiene historial comercial sólido");
    } else if (activities.length >= 2) {
        score += 10;
        reasons.push("Tiene actividad comercial registrada");
    } else if (activities.length === 1) {
        score += 5;
        reasons.push("Tiene poca actividad registrada");
    } else {
        risks.push("No hay actividad comercial registrada");
    }

    if (lastActivityDays !== null && lastActivityDays <= 3) {
        score += 12;
        reasons.push("Actividad reciente en los últimos 3 días");
    } else if (lastActivityDays !== null && lastActivityDays <= 7) {
        score += 8;
        reasons.push("Actividad reciente en la última semana");
    } else if (lastActivityDays !== null && lastActivityDays <= 14) {
        score += 4;
        risks.push("Actividad algo fría: más de 7 días sin movimiento");
    } else {
        risks.push("Oportunidad fría: más de 14 días sin actividad");
    }

    if (quotes.length >= 2) {
        score += 10;
        reasons.push("Tiene más de una cotización creada");
    } else if (quotes.length === 1) {
        score += 7;
        reasons.push("Tiene una cotización creada");
    } else {
        risks.push("No tiene cotizaciones creadas");
    }

    if (activeQuotes.length > 0) {
        score += 8;
        reasons.push("Tiene cotizaciones activas en proceso");
    }

    if (totalPipelineValue > 0) {
        score += 7;
        reasons.push("Tiene valor comercial activo en pipeline");
    }

    if (acceptedQuotes.length > 0) {
        score += 10;
        reasons.push("Tiene cotizaciones aceptadas");
    }

    if (rejectedQuotes.length > activeQuotes.length && quotes.length > 0) {
        risks.push("Tiene más cotizaciones rechazadas que activas");
    }

    const finalScore = Math.min(100, Math.max(0, score));

    let level: ScpHealthLevel = "Crítico";

    if (finalScore >= 85) level = "Excelente";
    else if (finalScore >= 70) level = "Saludable";
    else if (finalScore >= 50) level = "Estable";
    else if (finalScore >= 30) level = "Débil";

    return {
        score: finalScore,
        level,
        reasons,
        risks,
    };
}