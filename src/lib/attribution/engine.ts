export type AttributionSummary = {
    totalLeads: number
    totalWon: number
    conversionRate: number
    totalRevenue: number
    cac: number
    roas: number
    byCampaign: {
        campaignId: string
        campaignName: string
        leads: number
        won: number
        revenue: number
        spend: number
        cac: number
        roas: number
    }[]
}

function resolveCampaignId(
    client: { utm_campaign: string | null; source_ad_id: string | null },
    adToCampaign: Map<string, string>,
    campaignNameToId: Map<string, string>
): string | null {
    if (client.source_ad_id) {
        const campaignId = adToCampaign.get(client.source_ad_id)
        if (campaignId) return campaignId
    }

    if (client.utm_campaign) {
        const campaignId = campaignNameToId.get(client.utm_campaign)
        if (campaignId) return campaignId
    }

    return null
}

export function calculateAttributionSummary(input: {
    clients: { id: string; stage: string | null; utm_campaign: string | null; source_ad_id: string | null }[]
    quotes: { client_id: string | null; total: number; status: string }[]
    campaigns: { id: string; name: string | null; spend: number | null }[]
    adToCampaign: Map<string, string>
}): AttributionSummary {
    const { clients, quotes, campaigns, adToCampaign } = input

    const acceptedRevenueByClient = new Map<string, number>()
    for (const quote of quotes) {
        if (!quote.client_id) continue
        if (quote.status !== 'accepted') continue
        acceptedRevenueByClient.set(
            quote.client_id,
            (acceptedRevenueByClient.get(quote.client_id) ?? 0) + quote.total
        )
    }

    const campaignNameToId = new Map(
        campaigns.filter((campaign) => campaign.name).map((campaign) => [campaign.name as string, campaign.id])
    )

    const byCampaignMap = new Map<string, AttributionSummary['byCampaign'][number]>()
    for (const campaign of campaigns) {
        byCampaignMap.set(campaign.id, {
            campaignId: campaign.id,
            campaignName: campaign.name ?? 'Sin nombre',
            leads: 0,
            won: 0,
            revenue: 0,
            spend: campaign.spend ?? 0,
            cac: 0,
            roas: 0,
        })
    }

    let totalWon = 0
    let totalRevenue = 0

    for (const client of clients) {
        const isWon = client.stage === 'proyecto_cerrado'
        const revenue = acceptedRevenueByClient.get(client.id) ?? 0

        if (isWon) {
            totalWon += 1
            totalRevenue += revenue
        }

        const campaignId = resolveCampaignId(client, adToCampaign, campaignNameToId)
        const entry = campaignId ? byCampaignMap.get(campaignId) : undefined

        if (entry) {
            entry.leads += 1

            if (isWon) {
                entry.won += 1
                entry.revenue += revenue
            }
        }
    }

    for (const entry of byCampaignMap.values()) {
        entry.cac = entry.won > 0 ? entry.spend / entry.won : 0
        entry.roas = entry.spend > 0 ? entry.revenue / entry.spend : 0
    }

    const totalLeads = clients.length
    const totalSpend = campaigns.reduce((sum, campaign) => sum + (campaign.spend ?? 0), 0)

    return {
        totalLeads,
        totalWon,
        conversionRate: totalLeads > 0 ? (totalWon / totalLeads) * 100 : 0,
        totalRevenue,
        cac: totalWon > 0 ? totalSpend / totalWon : 0,
        roas: totalSpend > 0 ? totalRevenue / totalSpend : 0,
        byCampaign: Array.from(byCampaignMap.values()),
    }
}
