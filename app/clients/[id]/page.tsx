import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getSupabaseServer, getActiveOrganizationId } from '@/lib/supabase/server'
import { calculateMomentum } from '@/lib/scoring/momentum'
import { calculateScpHealth } from '@/lib/scoring/scp-health'
import { calculateMoneyRadar } from '@/lib/scoring/money-radar'
import { calculateNextBestAction } from '@/lib/scoring/next-best-action'
import {
    calculateActivityIntelligence,
    ACTIVITY_STATUS_LABELS,
} from '@/lib/scoring/activity-intelligence'
import {
    getClientStageLabel,
    getClientStageProbability,
} from '@/lib/scp/stages'
import { calculatePipelineProgress } from '@/lib/scp/progress'
import { FileUpload } from '@/components/files/file-upload'
import { FileViewButton } from '@/components/files/file-view-button'
import { getFileCategoryLabel } from '@/lib/files/categories'
import { generateExecutiveSummary } from './memory/actions'
import { generateDealCoachAdvice } from './deal-coach/actions'
import { addClientNote } from './notes/actions'
import { addQuickAction } from './quick-actions/actions'
import { QUICK_ACTIONS, QUICK_ACTION_CATEGORIES } from '@/lib/scp/quick-actions'
import { TaskCard } from '../../components/tasks/task-card'
import { NewTaskForm } from '../../components/tasks/new-task-form'
import { AIActionButton } from '../../components/ui/ai-action-button'

const DEAL_COACH_BLOCK_LABELS = ['Situación', 'Riesgo', 'Acción exacta']

export default async function ClientDetailPage({
    params,
}: {
    params: Promise<{ id: string }>
}) {
    const { id } = await params

    const supabase = await getSupabaseServer()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) notFound()

    const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('user_id', user.id)
        .single()

    if (!profile) notFound()

    const organizationId = await getActiveOrganizationId(supabase, user.id)

    const { data: client } = await supabase
        .from('clients')
        .select('*')
        .eq('id', id)
        .eq('organization_id', organizationId)
        .single()

    if (!client) notFound()

    const { data: branch } = client.branch_id
        ? await supabase
              .from('branches')
              .select('name')
              .eq('id', client.branch_id)
              .eq('organization_id', organizationId)
              .maybeSingle()
        : { data: null }

    const sourceAdId = client.source === 'meta_ads' ? client.source_ad_id : null

    const { data: sourceAd } = sourceAdId
        ? await supabase
              .from('meta_ads')
              .select('id, ad_set_id, name, headline, body, image_url, permalink_url')
              .eq('id', sourceAdId)
              .eq('organization_id', organizationId)
              .maybeSingle()
        : { data: null }

    let sourceCampaignName: string | null = null

    if (sourceAd?.ad_set_id) {
        const { data: adSet } = await supabase
            .from('meta_ad_sets')
            .select('campaign_id')
            .eq('id', sourceAd.ad_set_id)
            .eq('organization_id', organizationId)
            .maybeSingle()

        if (adSet?.campaign_id) {
            const { data: campaign } = await supabase
                .from('meta_campaigns')
                .select('name')
                .eq('id', adSet.campaign_id)
                .eq('organization_id', organizationId)
                .maybeSingle()

            sourceCampaignName = campaign?.name ?? null
        }
    }

    const { data: quotes } = await supabase
        .from('quotes')
        .select('*')
        .eq('client_id', client.id)
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false })

    const { data: activities } = await supabase
        .from('client_activities')
        .select('*')
        .eq('client_id', client.id)
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false })

    const { data: commercialMemory } = await supabase
        .from('commercial_memory')
        .select('*')
        .eq('client_id', client.id)
        .eq('organization_id', organizationId)
        .maybeSingle()

    const { data: dealCoachAdvice } = await supabase
        .from('deal_coach_cache')
        .select('advice_text, generated_at')
        .eq('client_id', client.id)
        .eq('organization_id', organizationId)
        .maybeSingle()

    const { data: clientFiles } = await supabase
        .from('client_files')
        .select('*')
        .eq('client_id', client.id)
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false })

    const { data: clientTasks } = await supabase
        .from('tasks')
        .select('*')
        .eq('client_id', client.id)
        .eq('organization_id', organizationId)
        .eq('status', 'pending')
        .order('due_date', { ascending: true, nullsFirst: false })

    const safeClientTasks = clientTasks ?? []
    const safeQuotes = quotes ?? []
    const safeActivities = activities ?? []

    const safeClientFiles = clientFiles ?? []

    const momentum = calculateMomentum({
        quotes: safeQuotes,
        activities: safeActivities,
    })

    const scpHealth = calculateScpHealth({
        client,
        quotes: safeQuotes,
        activities: safeActivities,
    })

    const moneyRadar = calculateMoneyRadar({
        quotes: safeQuotes,
        activities: safeActivities,
    })

    const nextBestAction = calculateNextBestAction({
        momentum,
        scpHealth,
        moneyRadar,
    })

    const activityIntelligence = calculateActivityIntelligence({
        activities: safeActivities,
    })
    const stageLabel = getClientStageLabel(client.stage)

    const stageProbability = getClientStageProbability(client.stage)

    const pipelineProgress = calculatePipelineProgress(stageProbability)

    const totalQuotes = safeQuotes.length

    const totalValue = safeQuotes.reduce(
        (acc, quote) => acc + Number(quote.total ?? 0),
        0
    )

    const dealCoachBlocks = (dealCoachAdvice?.advice_text ?? '')
        .split(/\n\s*\n/)
        .filter((block) => block.trim().length > 0)
        .map((block) => block.replace(/^\*\*[^*]+\*\*\n?/, '').trim())
        .map((block, index, allBlocks) => {
            const lines = block.split('\n')
            const messageLines = lines.filter((line) => line.trim().startsWith('>'))
            const mainLines = lines.filter((line) => !line.trim().startsWith('>'))

            const isLast = index === allBlocks.length - 1
            if (!isLast || messageLines.length === 0) {
                return { mainText: block, messageText: '' }
            }

            const messageText = messageLines
                .map((line) =>
                    line
                        .trim()
                        .replace(/^>\s*/, '')
                        .replace(/\*\*/g, '')
                        .replace(/\*/g, '')
                )
                .filter(
                    (line) =>
                        !line.includes('Mensaje listo para copiar') &&
                        !line.includes('Approach sugerido')
                )
                .join('\n')
                .trim()

            return { mainText: mainLines.join('\n').trim(), messageText }
        })

    return (
        <main className="min-h-screen bg-black p-8 text-white">
            <Link href="/clients" className="text-neutral-400 hover:text-white">
                ← Volver a clientes
            </Link>

            <section className="mt-8 rounded-xl border border-neutral-800 bg-neutral-900 p-8">
                <div className="flex items-start justify-between">
                    <div>
                        <p className="text-neutral-500">Cliente</p>
                        <h1 className="mt-2 text-5xl font-bold">{client.name}</h1>
                    </div>

                    <Link
                        href={`/clients/${client.id}/quotes/new`}
                        className="rounded-lg bg-white px-5 py-3 font-semibold text-black"
                    >
                        Nueva cotización
                    </Link>
                </div>

                <div className="mt-10 grid grid-cols-2 gap-10">
                    <div>
                        <p className="text-neutral-500">Empresa</p>
                        <p className="mt-2 text-2xl">{client.company || '-'}</p>

                        <div className="mt-8">
                            <p className="text-neutral-500">Teléfono</p>
                            <p className="mt-2 text-2xl">{client.phone || '-'}</p>
                        </div>
                    </div>
                    <div className="mt-10 border-t border-neutral-800 pt-8">
                        <p className="text-neutral-500">Etapa SCP</p>

                        <div className="mt-3 flex items-center gap-4">
                            <span className="rounded-full bg-neutral-800 px-4 py-2 text-lg">
                                {stageLabel}
                            </span>

                            {branch && (
                                <span className="rounded-full bg-neutral-800 px-4 py-2 text-lg text-neutral-400">
                                    {branch.name}
                                </span>
                            )}

                            <span className="text-neutral-400">
                                Progreso comercial: {pipelineProgress.percentage}%
                            </span>

                            <Link
                                href={`/clients/${client.id}/stage`}
                                className="rounded-lg border border-neutral-700 px-4 py-2 text-sm font-semibold text-white hover:bg-neutral-800"
                            >
                                Cambiar etapa
                            </Link>
                        </div>

                        <div className="mt-5 h-3 w-full max-w-md rounded-full bg-neutral-800">
                            <div
                                className="h-3 rounded-full bg-white"
                                style={{
                                    width: `${pipelineProgress.percentage}%`,
                                }}
                            />
                        </div>
                    </div>

                    <div>
                        <p className="text-neutral-500">Correo</p>
                        <p className="mt-2 text-2xl">{client.email || '-'}</p>

                        <div className="mt-8">
                            <p className="text-neutral-500">Fecha de creación</p>
                            <p className="mt-2 text-2xl">
                                {new Date(client.created_at).toLocaleDateString('es-MX')}
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {sourceAdId && (
                <section className="mt-8 rounded-xl border border-neutral-800 bg-neutral-900 p-5">
                    <p className="text-sm text-neutral-500">Origen del lead</p>

                    {sourceAd ? (
                        <div className="mt-4 flex gap-4">
                            {sourceAd.image_url ? (
                                <img
                                    src={sourceAd.image_url}
                                    alt={sourceAd.name ?? 'Anuncio'}
                                    className="h-20 w-20 rounded-lg object-cover"
                                />
                            ) : (
                                <div className="flex h-20 w-20 items-center justify-center rounded-lg bg-neutral-800 text-2xl font-bold text-neutral-500">
                                    {(sourceAd.name ?? 'A').charAt(0).toUpperCase()}
                                </div>
                            )}

                            <div>
                                <p className="font-semibold text-sm">{sourceAd.name ?? 'Anuncio sin nombre'}</p>

                                {sourceCampaignName && (
                                    <p className="text-xs text-neutral-500">{sourceCampaignName}</p>
                                )}

                                <span className="mt-2 inline-flex items-center rounded-full border border-violet-500/20 bg-violet-500/10 px-2 py-0.5 text-xs text-violet-400">
                                    Meta Ads
                                </span>

                                {sourceAd.permalink_url && (
                                    <div className="mt-2">
                                        <a
                                            href={sourceAd.permalink_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-xs text-neutral-500 hover:text-white"
                                        >
                                            Ver anuncio →
                                        </a>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="mt-4 flex items-center gap-3">
                            <span className="inline-flex items-center rounded-full border border-violet-500/20 bg-violet-500/10 px-2 py-0.5 text-xs text-violet-400">
                                Meta Ads
                            </span>

                            {client.utm_campaign && (
                                <p className="text-xs text-neutral-500">{client.utm_campaign}</p>
                            )}
                        </div>
                    )}
                </section>
            )}

            <section className="mt-8 rounded-xl border border-neutral-800 bg-neutral-900 p-8">
                <p className="text-neutral-500">Momentum Comercial</p>
                <h2 className="mt-2 text-5xl font-bold">{momentum.score}/100</h2>
                <p className="mt-2 text-xl text-neutral-300">{momentum.level}</p>

                <div className="mt-6 flex flex-wrap gap-2">
                    {momentum.reasons.map((reason) => (
                        <span key={reason} className="rounded-full bg-neutral-800 px-3 py-1 text-sm text-neutral-300">
                            {reason}
                        </span>
                    ))}
                </div>
            </section>

            <section className="mt-8 rounded-xl border border-neutral-800 bg-neutral-900 p-8">
                <p className="text-neutral-500">SCP Health Score</p>
                <h2 className="mt-2 text-5xl font-bold">{scpHealth.score}/100</h2>
                <p className="mt-2 text-xl text-neutral-300">{scpHealth.level}</p>

                <div className="mt-8 grid grid-cols-2 gap-6">
                    <div>
                        <p className="text-sm text-neutral-500">Fortalezas detectadas</p>
                        <div className="mt-3 flex flex-wrap gap-2">
                            {scpHealth.reasons.map((reason) => (
                                <span key={reason} className="rounded-full bg-neutral-800 px-3 py-1 text-sm text-neutral-300">
                                    {reason}
                                </span>
                            ))}
                        </div>
                    </div>

                    <div>
                        <p className="text-sm text-neutral-500">Riesgos detectados</p>
                        <div className="mt-3 flex flex-wrap gap-2">
                            {scpHealth.risks.map((risk) => (
                                <span key={risk} className="rounded-full bg-red-950 px-3 py-1 text-sm text-red-200">
                                    {risk}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            <section className="mt-8 rounded-xl border border-neutral-800 bg-neutral-900 p-8">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-neutral-500">Radar de Dinero</p>
                        <h2 className="mt-2 text-5xl font-bold">
                            ${moneyRadar.totalDetected.toLocaleString('es-MX')}
                        </h2>
                        <p className="mt-1 text-xs text-neutral-500">Valor neto después de descuentos aplicados</p>
                        <p className="mt-2 text-xl text-neutral-300">{moneyRadar.status}</p>
                    </div>

                    <div className="max-w-md text-right">
                        <p className="text-sm text-neutral-500">Acción recomendada</p>
                        <p className="mt-2 text-neutral-300">{moneyRadar.recommendedAction}</p>
                    </div>
                </div>

                <div className="mt-8 grid grid-cols-3 gap-4">
                    <div className="rounded-xl bg-neutral-800 p-5">
                        <p className="text-neutral-400">Dinero caliente</p>
                        <p className="mt-2 text-3xl font-bold">${moneyRadar.hotMoney.toLocaleString('es-MX')}</p>
                    </div>

                    <div className="rounded-xl bg-neutral-800 p-5">
                        <p className="text-neutral-400">En riesgo</p>
                        <p className="mt-2 text-3xl font-bold">${moneyRadar.atRiskMoney.toLocaleString('es-MX')}</p>
                    </div>

                    <div className="rounded-xl bg-neutral-800 p-5">
                        <p className="text-neutral-400">Recuperable</p>
                        <p className="mt-2 text-3xl font-bold">${moneyRadar.recoverableMoney.toLocaleString('es-MX')}</p>
                    </div>

                    <div className="rounded-xl bg-neutral-800 p-5">
                        <p className="text-neutral-400">Dormido</p>
                        <p className="mt-2 text-3xl font-bold">${moneyRadar.sleepingMoney.toLocaleString('es-MX')}</p>
                    </div>

                    <div className="rounded-xl bg-neutral-800 p-5">
                        <p className="text-neutral-400">Ganado</p>
                        <p className="mt-2 text-3xl font-bold">${moneyRadar.wonMoney.toLocaleString('es-MX')}</p>
                    </div>

                    <div className="rounded-xl bg-neutral-800 p-5">
                        <p className="text-neutral-400">Perdido</p>
                        <p className="mt-2 text-3xl font-bold">${moneyRadar.lostMoney.toLocaleString('es-MX')}</p>
                    </div>
                </div>

                <div className="mt-6 flex flex-wrap gap-2">
                    {moneyRadar.reasons.map((reason) => (
                        <span key={reason} className="rounded-full bg-neutral-800 px-3 py-1 text-sm text-neutral-300">
                            {reason}
                        </span>
                    ))}
                </div>
            </section>

            <section className="mt-8 rounded-xl border border-neutral-800 bg-neutral-900 p-8">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-neutral-500">Siguiente Mejor Acción</p>
                        <h2 className="mt-2 text-4xl font-bold">{nextBestAction.title}</h2>
                        <p className="mt-3 max-w-2xl text-neutral-300">{nextBestAction.description}</p>
                    </div>

                    <div className="text-right">
                        <p className="text-sm text-neutral-500">Prioridad</p>
                        <p className="mt-2 text-2xl font-bold">{nextBestAction.priority}</p>
                        <p className="mt-2 text-sm uppercase tracking-wider text-neutral-500">
                            {nextBestAction.actionType}
                        </p>
                    </div>
                </div>
            </section>

            <section className="mt-8 rounded-xl border border-neutral-800 border-l-2 border-l-violet-500 bg-neutral-900 p-8">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-neutral-500">Deal Coach</p>
                        <h2 className="mt-2 text-3xl font-bold">Consejo para esta cuenta</h2>
                    </div>

                    <form action={generateDealCoachAdvice}>
                        <input type="hidden" name="clientId" value={client.id} />

                        <AIActionButton
                            label={dealCoachAdvice ? 'Regenerar consejo' : 'Obtener consejo del Deal Coach'}
                            className="rounded-lg border border-neutral-700 px-5 py-3 font-semibold text-white hover:bg-neutral-800"
                        />
                    </form>
                </div>

                {!dealCoachAdvice ? (
                    <div className="mt-8 rounded-xl bg-neutral-800 p-6">
                        <p className="text-neutral-300">
                            Obtén consejo específico sobre qué decir o hacer ahora con esta cuenta, generado por IA
                            a partir del momentum, el radar de dinero y la memoria comercial.
                        </p>
                    </div>
                ) : (
                    <div className="mt-8 space-y-4">
                        {dealCoachBlocks.map((block, index) => (
                            <div key={index} className="rounded-xl bg-neutral-800 p-5">
                                <p className="text-xs font-semibold uppercase tracking-wider text-violet-400">
                                    {DEAL_COACH_BLOCK_LABELS[index] ?? ''}
                                </p>
                                {block.mainText && (
                                    <p className="mt-2 whitespace-pre-wrap text-neutral-200">
                                        {block.mainText}
                                    </p>
                                )}

                                {block.messageText && (
                                    <div className="mt-3 rounded-xl border border-neutral-700 bg-neutral-800 p-4">
                                        <p className="mb-2 text-xs text-neutral-500">💬 Puedes decir algo así:</p>
                                        <p className="whitespace-pre-wrap text-sm italic text-neutral-200">
                                            {block.messageText}
                                        </p>
                                    </div>
                                )}
                            </div>
                        ))}

                        <p className="text-xs text-neutral-500">
                            Generado{' '}
                            {new Date(dealCoachAdvice.generated_at).toLocaleString('es-MX', {
                                day: 'numeric',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit',
                            })}
                        </p>
                    </div>
                )}
            </section>

            <section className="mt-8 rounded-xl border border-neutral-800 bg-neutral-900 p-8">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-neutral-500">Memoria Comercial</p>
                        <h2 className="mt-2 text-3xl font-bold">
                            Inteligencia de la cuenta
                        </h2>
                    </div>

                    <div className="flex items-center gap-3">
                        <form action={generateExecutiveSummary}>
                            <input type="hidden" name="clientId" value={client.id} />

                            <AIActionButton
                                label="Generar resumen IA"
                                className="rounded-lg border border-neutral-700 px-5 py-3 font-semibold text-white hover:bg-neutral-800"
                            />
                        </form>

                        <Link
                            href={`/clients/${client.id}/memory`}
                            className="rounded-lg bg-white px-5 py-3 font-semibold text-black"
                        >
                            Editar memoria
                        </Link>
                    </div>
                </div>

                {!commercialMemory ? (
                    <div className="mt-8 rounded-xl bg-neutral-800 p-6">
                        <p className="text-neutral-300">
                            Todavía no hay memoria comercial registrada para esta cuenta.
                        </p>
                        <p className="mt-2 text-neutral-500">
                            Crea la memoria para guardar presupuesto, urgencia, dolores, deseos,
                            objeciones y próximos pasos.
                        </p>
                    </div>
                ) : (
                    <div className="mt-8 space-y-6">
                        <div className="grid grid-cols-4 gap-4">
                            <div className="rounded-xl bg-neutral-800 p-5">
                                <p className="text-neutral-400">Presupuesto estimado</p>
                                <p className="mt-2 text-2xl font-bold">
                                    {commercialMemory.estimated_budget
                                        ? `$${Number(commercialMemory.estimated_budget).toLocaleString('es-MX')}`
                                        : '-'}
                                </p>
                            </div>

                            <div className="rounded-xl bg-neutral-800 p-5">
                                <p className="text-neutral-400">Urgencia</p>
                                <p className="mt-2 text-2xl font-bold">
                                    {commercialMemory.urgency || '-'}
                                </p>
                            </div>

                            <div className="rounded-xl bg-neutral-800 p-5">
                                <p className="text-neutral-400">Probabilidad</p>
                                <p className="mt-2 text-2xl font-bold">
                                    {commercialMemory.closing_probability !== null &&
                                        commercialMemory.closing_probability !== undefined
                                        ? `${commercialMemory.closing_probability}%`
                                        : '-'}
                                </p>
                            </div>

                            <div className="rounded-xl bg-neutral-800 p-5">
                                <p className="text-neutral-400">Temperatura</p>
                                <p className="mt-2 text-2xl font-bold">
                                    {commercialMemory.temperature || '-'}
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="rounded-xl bg-neutral-800 p-5">
                                <p className="text-neutral-400">Tipo de proyecto</p>
                                <p className="mt-2 text-neutral-200">
                                    {commercialMemory.project_type || '-'}
                                </p>
                            </div>

                            <div className="rounded-xl bg-neutral-800 p-5">
                                <p className="text-neutral-400">Fuente real</p>
                                <p className="mt-2 text-neutral-200">
                                    {commercialMemory.lead_source || '-'}
                                </p>
                            </div>
                        </div>

                        <div className="rounded-xl bg-neutral-800 p-5">
                            <p className="text-neutral-400">Resumen ejecutivo</p>
                            <p className="mt-2 whitespace-pre-wrap text-neutral-200">
                                {commercialMemory.executive_summary || '-'}
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="rounded-xl bg-neutral-800 p-5">
                                <p className="text-neutral-400">Dolores detectados</p>
                                <p className="mt-2 whitespace-pre-wrap text-neutral-200">
                                    {commercialMemory.pain_points || '-'}
                                </p>
                            </div>

                            <div className="rounded-xl bg-neutral-800 p-5">
                                <p className="text-neutral-400">Deseos detectados</p>
                                <p className="mt-2 whitespace-pre-wrap text-neutral-200">
                                    {commercialMemory.desires || '-'}
                                </p>
                            </div>

                            <div className="rounded-xl bg-neutral-800 p-5">
                                <p className="text-neutral-400">Objeciones</p>
                                <p className="mt-2 whitespace-pre-wrap text-neutral-200">
                                    {commercialMemory.objections || '-'}
                                </p>
                            </div>

                            <div className="rounded-xl bg-neutral-800 p-5">
                                <p className="text-neutral-400">Competidores mencionados</p>
                                <p className="mt-2 whitespace-pre-wrap text-neutral-200">
                                    {commercialMemory.competitors || '-'}
                                </p>
                            </div>
                        </div>

                        <div className="rounded-xl bg-neutral-800 p-5">
                            <p className="text-neutral-400">Próximo paso</p>
                            <p className="mt-2 text-neutral-200">
                                {commercialMemory.next_step || '-'}
                            </p>

                            <p className="mt-3 text-sm text-neutral-500">
                                Fecha:{' '}
                                {commercialMemory.next_step_date
                                    ? new Date(commercialMemory.next_step_date).toLocaleDateString('es-MX')
                                    : '-'}
                            </p>
                        </div>
                    </div>
                )}
            </section>

            <section className="mt-8 rounded-xl border border-neutral-800 bg-neutral-900 p-8">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-neutral-500">Archivos del proyecto</p>
                        <h2 className="mt-2 text-3xl font-bold">
                            Expediente visual
                        </h2>
                    </div>
                </div>

                <div className="mt-8">
                    <FileUpload
                        organizationId={organizationId}
                        clientId={client.id}
                        userId={user.id}
                    />
                </div>

                <div className="mt-8">
                    {safeClientFiles.length === 0 ? (
                        <p className="text-neutral-400">
                            Todavía no hay archivos subidos.
                        </p>
                    ) : (
                        <div className="space-y-3">
                            {safeClientFiles.map((file) => (
                                <div
                                    key={file.id}
                                    className="rounded-xl bg-neutral-800 p-5"
                                >
                                    <div className="flex items-center justify-between gap-4">
                                        <p className="font-semibold">
                                            {file.file_name}
                                        </p>

                                        <span className="shrink-0 rounded-full bg-neutral-700 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-neutral-200">
                                            {getFileCategoryLabel(file.category)}
                                        </span>
                                    </div>

                                    <p className="mt-1 text-sm text-neutral-400">
                                        {file.file_type || 'Sin tipo'} ·{' '}
                                        {file.file_size
                                            ? `${Math.round(file.file_size / 1024)} KB`
                                            : 'Sin tamaño'}
                                    </p>

                                    <div className="mt-3 flex items-center justify-between gap-4">
                                        <p className="text-xs text-neutral-500">
                                            {new Date(file.created_at).toLocaleString('es-MX')}
                                        </p>

                                        <FileViewButton filePath={file.file_path} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </section>

            <section className="mt-8 rounded-xl border border-neutral-800 bg-neutral-900 p-8">
                <div className="flex items-center justify-between">
                    <h2 className="text-3xl font-bold">Expediente comercial</h2>

                    <Link href={`/clients/${client.id}/quotes/new`} className="rounded-lg bg-white px-5 py-3 font-semibold text-black">
                        Nueva cotización
                    </Link>
                </div>

                <div className="mt-8 grid grid-cols-3 gap-4">
                    <div className="rounded-xl bg-neutral-800 p-6">
                        <p className="text-neutral-400">Cotizaciones</p>
                        <p className="mt-2 text-5xl font-bold">{totalQuotes}</p>
                    </div>

                    <div className="rounded-xl bg-neutral-800 p-6">
                        <p className="text-neutral-400">Historial</p>
                        <p className="mt-2 text-5xl font-bold">{safeActivities.length}</p>
                    </div>

                    <div className="rounded-xl bg-neutral-800 p-6">
                        <p className="text-neutral-400">Valor potencial</p>
                        <p className="mt-2 text-5xl font-bold">
                            ${totalValue.toLocaleString('es-MX')}
                        </p>
                    </div>
                </div>
            </section>

            <section className="mt-8 rounded-xl border border-neutral-800 bg-neutral-900 p-8">
                <h2 className="text-2xl font-bold">Cotizaciones</h2>

                {safeQuotes.length === 0 ? (
                    <p className="mt-4 text-neutral-400">No hay cotizaciones registradas.</p>
                ) : (
                    <div className="mt-6 space-y-4">
                        {safeQuotes.map((quote) => (
                            <Link
                                key={quote.id}
                                href={`/quotes/${quote.id}`}
                                className="block rounded-xl bg-neutral-800 p-5 transition hover:bg-neutral-700"
                            >
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-semibold">{quote.quote_number}</p>
                                        <p className="text-neutral-400">{quote.project_name}</p>
                                        {quote.discount_global > 0 && (
                                            <p className="text-xs text-amber-400">Descuento {quote.discount_global}%</p>
                                        )}
                                    </div>

                                    <div className="text-right">
                                        <p className="font-bold">
                                            ${Number(quote.total ?? 0).toLocaleString('es-MX')}
                                        </p>
                                        <p className="text-sm text-neutral-500">{quote.status}</p>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </section>

            <section className="mt-8 rounded-xl border border-neutral-800 bg-neutral-900 p-8">
                <h2 className="text-2xl font-bold">Quick Actions SCP</h2>

                <form action={addQuickAction} className="mt-6 space-y-6">
                    <input type="hidden" name="clientId" value={client.id} />

                    {QUICK_ACTION_CATEGORIES.map((category) => (
                        <div key={category.key}>
                            <p className="text-sm font-semibold uppercase tracking-wider text-neutral-500">
                                {category.label}
                            </p>
                            <div className="mt-3 grid grid-cols-4 gap-3">
                                {QUICK_ACTIONS.filter((action) => action.category === category.key).map((action) => (
                                    <button
                                        key={action.key}
                                        type="submit"
                                        name="actionType"
                                        value={action.key}
                                        className="rounded-lg border border-neutral-700 px-4 py-3 text-sm font-semibold text-white hover:bg-neutral-800"
                                    >
                                        {action.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))}
                </form>
            </section>

            <section className="mt-8 rounded-xl border border-neutral-800 bg-neutral-900 p-8">
                <h2 className="text-2xl font-bold">Tareas</h2>

                <div className="mt-6">
                    <NewTaskForm clientId={client.id} />
                </div>

                {safeClientTasks.length === 0 ? (
                    <p className="mt-6 text-neutral-400">No hay tareas pendientes. ¡Todo al día! 🎉</p>
                ) : (
                    <div className="mt-6 space-y-3">
                        {safeClientTasks.map((task) => (
                            <TaskCard key={task.id} task={task} clientName={client.name} />
                        ))}
                    </div>
                )}
            </section>

            <section className="mt-8 rounded-xl border border-neutral-800 bg-neutral-900 p-8">
                <p className="text-neutral-500">Activity Intelligence</p>

                <div className="mt-2 flex flex-wrap items-center gap-3">
                    <h2 className="text-3xl font-bold">
                        {ACTIVITY_STATUS_LABELS[activityIntelligence.activityStatus]}
                    </h2>
                    <span className="rounded-full bg-neutral-800 px-3 py-1 text-sm text-neutral-300">
                        {activityIntelligence.daysSinceLastActivity !== null
                            ? `${activityIntelligence.daysSinceLastActivity} días desde la última actividad`
                            : 'Sin actividad registrada'}
                    </span>
                </div>

                <p className="mt-2 text-xl text-neutral-300">{activityIntelligence.lastActivityLabel}</p>

                <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
                    <div className="rounded-lg bg-neutral-800 p-4">
                        <p className="text-sm text-neutral-500">Touchpoints</p>
                        <p className="mt-1 text-2xl font-bold">{activityIntelligence.touchpointCount}</p>
                    </div>
                    <div className="rounded-lg bg-neutral-800 p-4">
                        <p className="text-sm text-neutral-500">Descubrimientos</p>
                        <p className="mt-1 text-2xl font-bold">{activityIntelligence.discoveryCount}</p>
                    </div>
                    <div className="rounded-lg bg-neutral-800 p-4">
                        <p className="text-sm text-neutral-500">Hitos SCP</p>
                        <p className="mt-1 text-2xl font-bold">{activityIntelligence.milestoneCount}</p>
                    </div>
                    <div className="rounded-lg bg-neutral-800 p-4">
                        <p className="text-sm text-neutral-500">Notas</p>
                        <p className="mt-1 text-2xl font-bold">{activityIntelligence.noteCount}</p>
                    </div>
                </div>

                {activityIntelligence.warningMessage && (
                    <p className="mt-6 rounded-lg bg-red-950 px-4 py-3 text-sm text-red-200">
                        {activityIntelligence.warningMessage}
                    </p>
                )}

                <p className="mt-4 text-neutral-300">
                    <span className="font-semibold text-white">Acción recomendada: </span>
                    {activityIntelligence.recommendedOperationalAction}
                </p>
            </section>

            <section className="mt-8 rounded-xl border border-neutral-800 bg-neutral-900 p-8">
                <h2 className="text-2xl font-bold">Timeline comercial</h2>

                <form action={addClientNote} className="mt-6">
                    <input type="hidden" name="clientId" value={client.id} />

                    <label className="text-sm text-neutral-400">
                        Nota comercial
                    </label>

                    <textarea
                        name="note"
                        rows={3}
                        required
                        className="mt-2 w-full rounded-lg border border-neutral-700 bg-black px-4 py-3 text-white"
                        placeholder="Ej. Cliente pidió descuento, quiere iniciar en agosto, está comparando con otro proveedor..."
                    />

                    <div className="mt-3 flex justify-end">
                        <button
                            type="submit"
                            className="rounded-lg bg-white px-5 py-3 font-semibold text-black"
                        >
                            Guardar nota
                        </button>
                    </div>
                </form>

                {safeActivities.length === 0 ? (
                    <p className="mt-4 text-neutral-400">Todavía no hay actividad registrada.</p>
                ) : (
                    <div className="mt-6 space-y-4">
                        {safeActivities.map((activity) => (
                            <div key={activity.id} className="rounded-xl bg-neutral-800 p-5">
                                <div className="flex items-center justify-between">
                                    <p className="font-semibold">{activity.title}</p>
                                    <p className="text-sm text-neutral-500">
                                        {new Date(activity.created_at).toLocaleString('es-MX')}
                                    </p>
                                </div>

                                {activity.description && (
                                    <p className="mt-2 text-neutral-400">{activity.description}</p>
                                )}

                                <p className="mt-3 text-xs uppercase tracking-wider text-neutral-500">
                                    {activity.type}
                                </p>
                            </div>
                        ))}
                    </div>
                )}
            </section>
        </main>
    )
}