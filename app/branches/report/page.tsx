import Link from 'next/link'
import { getConsolidatedReportData } from './get-report-data'

export default async function BranchesReportPage() {
    const { organizationName, branchStats, totals } = await getConsolidatedReportData()

    const today = new Date()
    const rawDateLabel = today.toLocaleDateString('es-MX', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    })
    const dateLabel = rawDateLabel.charAt(0).toUpperCase() + rawDateLabel.slice(1)

    const orgTotalsCards = [
        { label: 'Clientes totales', value: totals.clientCount.toLocaleString('es-MX') },
        { label: 'Pipeline total', value: `$${totals.pipelineValue.toLocaleString('es-MX', { maximumFractionDigits: 0 })}` },
        { label: 'Dinero caliente', value: `$${totals.hotMoney.toLocaleString('es-MX', { maximumFractionDigits: 0 })}` },
        { label: 'Ganado', value: `$${totals.wonMoney.toLocaleString('es-MX', { maximumFractionDigits: 0 })}` },
    ]

    return (
        <main className="min-h-screen bg-neutral-950 p-8 text-white">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <p className="text-xs uppercase tracking-wider text-neutral-500">{organizationName}</p>
                    <h1 className="mt-1 text-3xl font-bold">Reporte consolidado</h1>
                    <p className="mt-1 text-sm text-neutral-500">{dateLabel}</p>
                </div>

                <Link
                    href="/branches/report/print"
                    className="rounded-lg border border-neutral-700 px-4 py-2 text-sm font-semibold text-white hover:bg-neutral-800"
                >
                    Imprimir reporte
                </Link>
            </div>

            <section className="mt-8 grid gap-4 md:grid-cols-4">
                {orgTotalsCards.map((card) => (
                    <div key={card.label} className="rounded-xl border border-neutral-800 bg-neutral-900 p-5">
                        <p className="text-sm text-neutral-500">{card.label}</p>
                        <p className="mt-2 text-3xl font-bold">{card.value}</p>
                    </div>
                ))}
            </section>

            <section className="mt-8 rounded-xl border border-neutral-800 bg-neutral-900 p-6">
                <h2 className="text-lg font-semibold">Comparativo por sucursal</h2>

                {branchStats.length === 0 ? (
                    <p className="mt-4 text-neutral-400">No tienes sucursales registradas.</p>
                ) : (
                    <table className="mt-4 w-full text-left text-sm">
                        <thead>
                            <tr className="border-b border-neutral-800 text-neutral-500">
                                <th className="py-2 pr-4 font-medium">Sucursal</th>
                                <th className="py-2 pr-4 font-medium">Clientes</th>
                                <th className="py-2 pr-4 font-medium">Pipeline</th>
                                <th className="py-2 pr-4 font-medium">Dinero Caliente</th>
                                <th className="py-2 pr-4 font-medium">Ganado</th>
                                <th className="py-2 font-medium">Cotizaciones abiertas</th>
                            </tr>
                        </thead>
                        <tbody>
                            {branchStats.map((row) => (
                                <tr key={row.branchId} className="border-b border-neutral-900">
                                    <td className="py-3 pr-4 font-medium">{row.branchName}</td>
                                    <td className="py-3 pr-4">{row.clientCount.toLocaleString('es-MX')}</td>
                                    <td className="py-3 pr-4">
                                        ${row.pipelineValue.toLocaleString('es-MX', { maximumFractionDigits: 0 })}
                                    </td>
                                    <td className="py-3 pr-4">
                                        ${row.hotMoney.toLocaleString('es-MX', { maximumFractionDigits: 0 })}
                                    </td>
                                    <td className="py-3 pr-4">
                                        ${row.wonMoney.toLocaleString('es-MX', { maximumFractionDigits: 0 })}
                                    </td>
                                    <td className="py-3">{row.openQuotesCount.toLocaleString('es-MX')}</td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr className="font-bold">
                                <td className="py-3 pr-4">Total</td>
                                <td className="py-3 pr-4">{totals.clientCount.toLocaleString('es-MX')}</td>
                                <td className="py-3 pr-4">
                                    ${totals.pipelineValue.toLocaleString('es-MX', { maximumFractionDigits: 0 })}
                                </td>
                                <td className="py-3 pr-4">
                                    ${totals.hotMoney.toLocaleString('es-MX', { maximumFractionDigits: 0 })}
                                </td>
                                <td className="py-3 pr-4">
                                    ${totals.wonMoney.toLocaleString('es-MX', { maximumFractionDigits: 0 })}
                                </td>
                                <td className="py-3">{totals.openQuotesCount.toLocaleString('es-MX')}</td>
                            </tr>
                        </tfoot>
                    </table>
                )}
            </section>
        </main>
    )
}
