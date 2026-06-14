import { existsSync, readFileSync } from 'fs'
import { resolve } from 'path'
import { getSupabaseAdmin } from '../src/lib/supabase/admin'
import type { Database, ClientType, QuoteStatus } from '../src/lib/types/database'
import type { ClientStage } from '../src/lib/scp/stages'

function loadEnvLocal() {
    const envPath = resolve(process.cwd(), '.env.local')
    if (!existsSync(envPath)) return

    for (const line of readFileSync(envPath, 'utf-8').split('\n')) {
        const trimmed = line.trim()
        if (!trimmed || trimmed.startsWith('#')) continue

        const eqIndex = trimmed.indexOf('=')
        if (eqIndex === -1) continue

        const key = trimmed.slice(0, eqIndex).trim()
        const value = trimmed.slice(eqIndex + 1).trim().replace(/^['"]|['"]$/g, '')

        if (!process.env[key]) process.env[key] = value
    }
}

loadEnvLocal()

const orgId = process.argv[2]

if (!orgId) {
    console.error('Uso: npm run seed:demo -- <organization_id>')
    process.exit(1)
}

const supabase = getSupabaseAdmin()

type ClientSeed = Database['public']['Tables']['clients']['Insert'] & { stage: ClientStage }
type QuoteSeed = Database['public']['Tables']['quotes']['Insert']
type ActivitySeed = Database['public']['Tables']['client_activities']['Insert'] & { created_at: string }
type MemorySeed = Database['public']['Tables']['commercial_memory']['Insert']

function daysAgo(days: number): string {
    const date = new Date()
    date.setDate(date.getDate() - days)
    return date.toISOString()
}

function randomDaysAgo(maxDays: number): string {
    return daysAgo(Math.floor(Math.random() * maxDays))
}

const CLIENTS_SEED: {
    name: string
    client_type: ClientType
    company: string | null
    phone: string
    stage: ClientStage
    source: string
}[] = [
    { name: 'Arturo Díaz', client_type: 'empresa', company: 'LOGY Solutions', phone: '8123948312', stage: 'visita_tecnica_realizada', source: 'meta_ads' },
    { name: 'Erick Chapa', client_type: 'empresa', company: 'MSC', phone: '8123948310', stage: 'cotizacion_enviada', source: 'meta_ads' },
    { name: 'Carlos Mendoza', client_type: 'empresa', company: 'Constructora Mendoza', phone: '8121234567', stage: 'nuevo_lead', source: 'manual' },
    { name: 'Sofía Ramírez', client_type: 'persona', company: null, phone: '8129876543', stage: 'calificado_para_visita', source: 'manual' },
    { name: 'Roberto Garza', client_type: 'empresa', company: 'GarCorp', phone: '8125551234', stage: 'verbalmente_ganado', source: 'meta_ads' },
    { name: 'Ana Torres', client_type: 'persona', company: null, phone: '8127654321', stage: 'proyecto_cerrado', source: 'manual' },
]

const ACTIVITY_TEMPLATES: { type: string; title: string; description: string }[] = [
    { type: 'call_completed', title: 'Llamada realizada', description: 'Llamada de seguimiento con el cliente.' },
    { type: 'whatsapp_sent', title: 'WhatsApp enviado', description: 'Mensaje de WhatsApp enviado con información del proyecto.' },
    { type: 'meeting_completed', title: 'Reunión realizada', description: 'Reunión realizada para revisar avances y siguientes pasos.' },
]

function quoteDefaults(clientId: string): QuoteSeed {
    return {
        organization_id: orgId,
        client_id: clientId,
        created_by: null,
        version: 1,
        parent_quote_id: null,
        status: 'draft',
        project_name: '',
        project_address: null,
        project_type: null,
        client_vision: null,
        currency: 'MXN',
        subtotal: 0,
        discount_global: 0,
        discount_amount: 0,
        taxable_amount: 0,
        tax_rate: 16,
        tax_amount: 0,
        total: 0,
        template: 'modern',
        start_date: null,
        duration_weeks: null,
        executive_name: null,
        executive_phone: null,
        executive_email: null,
        guarantee: null,
        payment_terms: null,
        notes: null,
        valid_until: null,
        sent_at: null,
        first_viewed_at: null,
        last_viewed_at: null,
        accepted_at: null,
        rejected_at: null,
    }
}

function memoryDefaults(clientId: string): MemorySeed {
    return {
        organization_id: orgId,
        client_id: clientId,
        estimated_budget: null,
        urgency: null,
        closing_probability: null,
        temperature: null,
        project_type: null,
        lead_source: null,
        executive_summary: null,
        pain_points: null,
        desires: null,
        objections: null,
        competitors: null,
        next_step: null,
        next_step_date: null,
    }
}

function requireClientId(map: Map<string, string>, name: string): string {
    const id = map.get(name)
    if (!id) {
        throw new Error(`No se encontró el cliente "${name}" tras la inserción`)
    }
    return id
}

function buildQuotePayload(opts: {
    clientId: string
    projectName: string
    total: number
    status: QuoteStatus
    currency: string
    sentAt: string | null
    firstViewedAt?: string | null
    lastViewedAt?: string | null
    acceptedAt?: string | null
}): QuoteSeed {
    const subtotal = Math.round(opts.total / 1.16)
    const taxAmount = opts.total - subtotal

    return {
        ...quoteDefaults(opts.clientId),
        project_name: opts.projectName,
        status: opts.status,
        currency: opts.currency,
        total: opts.total,
        subtotal,
        taxable_amount: subtotal,
        tax_amount: taxAmount,
        sent_at: opts.sentAt,
        first_viewed_at: opts.firstViewedAt ?? null,
        last_viewed_at: opts.lastViewedAt ?? null,
        accepted_at: opts.acceptedAt ?? null,
    }
}

async function main() {
    const clientsPayload: ClientSeed[] = CLIENTS_SEED.map((c) => ({
        organization_id: orgId,
        name: c.name,
        client_type: c.client_type,
        company: c.company,
        email: null,
        phone: c.phone,
        address: null,
        city: null,
        notes: null,
        tags: [],
        source: c.source,
        source_ad_id: null,
        is_active: true,
        utm_source: null,
        utm_campaign: null,
        utm_content: null,
        utm_term: null,
        utm_medium: null,
        attributed_revenue: 0,
        attributed_at: null,
        stage: c.stage,
    }))

    const { data: insertedClients, error: clientsError } = await supabase
        .from('clients')
        .insert(clientsPayload)
        .select('id, name')

    if (clientsError || !insertedClients) {
        console.error('Error creando clientes:', clientsError)
        process.exit(1)
    }

    const clientIdByName = new Map(insertedClients.map((c) => [c.name, c.id]))

    const robertoId = requireClientId(clientIdByName, 'Roberto Garza')
    const anaId = requireClientId(clientIdByName, 'Ana Torres')
    const arturoId = requireClientId(clientIdByName, 'Arturo Díaz')
    const erickId = requireClientId(clientIdByName, 'Erick Chapa')

    const quotesPayload: QuoteSeed[] = [
        buildQuotePayload({
            clientId: robertoId,
            projectName: 'Automatización residencial',
            total: 285000,
            status: 'sent',
            currency: 'MXN',
            sentAt: daysAgo(5),
        }),
        buildQuotePayload({
            clientId: anaId,
            projectName: 'Remodelación integral',
            total: 142000,
            status: 'accepted',
            currency: 'MXN',
            sentAt: daysAgo(10),
            firstViewedAt: daysAgo(9),
            lastViewedAt: daysAgo(8),
            acceptedAt: daysAgo(7),
        }),
    ]

    const { data: insertedQuotes, error: quotesError } = await supabase
        .from('quotes')
        .insert(quotesPayload)
        .select('id, project_name, total, status')

    if (quotesError || !insertedQuotes) {
        console.error('Error creando cotizaciones:', quotesError)
        process.exit(1)
    }

    const activitiesPayload: ActivitySeed[] = []

    for (const client of insertedClients) {
        for (const template of ACTIVITY_TEMPLATES) {
            activitiesPayload.push({
                organization_id: orgId,
                client_id: client.id,
                created_by: null,
                type: template.type,
                title: template.title,
                description: template.description,
                metadata: { source: 'seed_demo' },
                created_at: randomDaysAgo(7),
            })
        }
    }

    const { error: activitiesError } = await supabase
        .from('client_activities')
        .insert(activitiesPayload)

    if (activitiesError) {
        console.error('Error creando actividades:', activitiesError)
        process.exit(1)
    }

    const memoryPayload: MemorySeed[] = [
        {
            ...memoryDefaults(arturoId),
            pain_points: 'Proceso de cotización lento',
            desires: 'Automatizar seguimiento',
            temperature: 'Caliente',
            estimated_budget: 200000,
        },
        {
            ...memoryDefaults(erickId),
            pain_points: 'Pierde clientes por falta de seguimiento',
            urgency: 'Este mes',
            temperature: 'Muy caliente',
            estimated_budget: 150000,
        },
    ]

    const { error: memoryError } = await supabase
        .from('commercial_memory')
        .insert(memoryPayload)

    if (memoryError) {
        console.error('Error creando memoria comercial:', memoryError)
        process.exit(1)
    }

    console.log('Datos demo creados para la organización:', orgId)
    console.log(`  Clientes (${insertedClients.length}):`)
    for (const c of insertedClients) {
        console.log(`    - ${c.name} (${c.id})`)
    }
    console.log(`  Cotizaciones (${insertedQuotes.length}):`)
    for (const q of insertedQuotes) {
        console.log(`    - ${q.project_name}: $${q.total} (${q.status})`)
    }
    console.log(`  Actividades creadas: ${activitiesPayload.length}`)
    console.log(`  Memoria comercial creada: ${memoryPayload.length} clientes (Arturo Díaz, Erick Chapa)`)
}

main().catch((error) => {
    console.error('Error inesperado durante el seed:', error)
    process.exit(1)
})
