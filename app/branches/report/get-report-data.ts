import { redirect } from 'next/navigation'
import { getSupabaseServer, getActiveOrganizationId } from '@/lib/supabase/server'
import { calculateMoneyRadar } from '@/lib/scoring/money-radar'

const OPEN_QUOTE_STATUSES = ['draft', 'sent', 'viewed']

export type BranchReportRow = {
    branchId: string
    branchName: string
    clientCount: number
    pipelineValue: number
    hotMoney: number
    wonMoney: number
    openQuotesCount: number
}

export async function getConsolidatedReportData() {
    const supabase = await getSupabaseServer()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) redirect('/login')

    const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('user_id', user.id)
        .maybeSingle()

    if (!profile) redirect('/onboarding')

    const organizationId = await getActiveOrganizationId(supabase, user.id)

    const [{ data: organization }, { data: branchesData }] = await Promise.all([
        supabase.from('organizations').select('name').eq('id', organizationId).maybeSingle(),
        supabase.from('branches').select('*').eq('organization_id', organizationId).order('name'),
    ])

    const branches = branchesData ?? []

    const branchStats: BranchReportRow[] = await Promise.all(
        branches.map(async (branch) => {
            const [{ data: clientsData }, { data: quotesData }] = await Promise.all([
                supabase.from('clients').select('id').eq('organization_id', organizationId).eq('branch_id', branch.id),
                supabase
                    .from('quotes')
                    .select('id, status, total, accepted_at')
                    .eq('organization_id', organizationId)
                    .eq('branch_id', branch.id),
            ])

            const clients = clientsData ?? []
            const quotes = quotesData ?? []

            const moneyRadar = calculateMoneyRadar({ quotes, activities: [] })

            const openQuotes = quotes.filter((q) => OPEN_QUOTE_STATUSES.includes(q.status))
            const pipelineValue = openQuotes.reduce((sum, q) => sum + Number(q.total), 0)

            return {
                branchId: branch.id,
                branchName: branch.name,
                clientCount: clients.length,
                pipelineValue,
                hotMoney: moneyRadar.hotMoney,
                wonMoney: moneyRadar.wonMoney,
                openQuotesCount: openQuotes.length,
            }
        })
    )

    branchStats.sort((a, b) => b.pipelineValue - a.pipelineValue)

    const totals = branchStats.reduce(
        (acc, row) => ({
            clientCount: acc.clientCount + row.clientCount,
            pipelineValue: acc.pipelineValue + row.pipelineValue,
            hotMoney: acc.hotMoney + row.hotMoney,
            wonMoney: acc.wonMoney + row.wonMoney,
            openQuotesCount: acc.openQuotesCount + row.openQuotesCount,
        }),
        { clientCount: 0, pipelineValue: 0, hotMoney: 0, wonMoney: 0, openQuotesCount: 0 }
    )

    return {
        organizationName: organization?.name ?? 'Tu negocio',
        branchStats,
        totals,
    }
}
