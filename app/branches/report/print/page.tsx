import { getConsolidatedReportData } from '../get-report-data'
import { PrintButton } from '../../../quotes/[id]/print/print-button-client'

export default async function BranchesReportPrintPage() {
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
        <main className="min-h-screen bg-white px-6 py-10 text-black">
            <style>{`
                @media print {
                    .no-print {
                        display: none !important;
                    }

                    @page {
                        margin: 20mm;
                        size: A4;
                    }

                    section {
                        page-break-inside: avoid;
                    }
                }
            `}</style>

            <div className="mx-auto max-w-4xl">
                <div className="no-print mb-6 flex justify-end">
                    <PrintButton />
                </div>

                <header className="border-b border-neutral-300 pb-4">
                    <p className="text-sm font-semibold text-neutral-500">{organizationName}</p>
                    <h1 className="mt-1 text-2xl font-bold">Reporte consolidado</h1>
                    <p className="mt-1 text-sm text-neutral-600">{dateLabel}</p>
                </header>

                <section className="mt-6 grid grid-cols-4 gap-4">
                    {orgTotalsCards.map((card) => (
                        <div key={card.label} className="rounded border border-neutral-300 p-4">
                            <p className="text-xs text-neutral-500">{card.label}</p>
                            <p className="mt-1 text-xl font-bold">{card.value}</p>
                        </div>
                    ))}
                </section>

                <section className="mt-6">
                    <h2 className="text-lg font-semibold">Comparativo por sucursal</h2>

                    <table className="mt-3 w-full border-collapse border border-neutral-300 text-sm">
                        <thead>
                            <tr className="bg-neutral-100 text-left">
                                <th className="border border-neutral-300 px-3 py-2 font-medium">Sucursal</th>
                                <th className="border border-neutral-300 px-3 py-2 text-right font-medium">Clientes</th>
                                <th className="border border-neutral-300 px-3 py-2 text-right font-medium">Pipeline</th>
                                <th className="border border-neutral-300 px-3 py-2 text-right font-medium">Dinero Caliente</th>
                                <th className="border border-neutral-300 px-3 py-2 text-right font-medium">Ganado</th>
                                <th className="border border-neutral-300 px-3 py-2 text-right font-medium">Cotizaciones abiertas</th>
                            </tr>
                        </thead>
                        <tbody>
                            {branchStats.map((row) => (
                                <tr key={row.branchId}>
                                    <td className="border border-neutral-300 px-3 py-2 font-medium">{row.branchName}</td>
                                    <td className="border border-neutral-300 px-3 py-2 text-right tabular-nums">
                                        {row.clientCount.toLocaleString('es-MX')}
                                    </td>
                                    <td className="border border-neutral-300 px-3 py-2 text-right tabular-nums">
                                        ${row.pipelineValue.toLocaleString('es-MX', { maximumFractionDigits: 0 })}
                                    </td>
                                    <td className="border border-neutral-300 px-3 py-2 text-right tabular-nums">
                                        ${row.hotMoney.toLocaleString('es-MX', { maximumFractionDigits: 0 })}
                                    </td>
                                    <td className="border border-neutral-300 px-3 py-2 text-right tabular-nums">
                                        ${row.wonMoney.toLocaleString('es-MX', { maximumFractionDigits: 0 })}
                                    </td>
                                    <td className="border border-neutral-300 px-3 py-2 text-right tabular-nums">
                                        {row.openQuotesCount.toLocaleString('es-MX')}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr className="font-bold">
                                <td className="border border-neutral-300 px-3 py-2">Total</td>
                                <td className="border border-neutral-300 px-3 py-2 text-right tabular-nums">
                                    {totals.clientCount.toLocaleString('es-MX')}
                                </td>
                                <td className="border border-neutral-300 px-3 py-2 text-right tabular-nums">
                                    ${totals.pipelineValue.toLocaleString('es-MX', { maximumFractionDigits: 0 })}
                                </td>
                                <td className="border border-neutral-300 px-3 py-2 text-right tabular-nums">
                                    ${totals.hotMoney.toLocaleString('es-MX', { maximumFractionDigits: 0 })}
                                </td>
                                <td className="border border-neutral-300 px-3 py-2 text-right tabular-nums">
                                    ${totals.wonMoney.toLocaleString('es-MX', { maximumFractionDigits: 0 })}
                                </td>
                                <td className="border border-neutral-300 px-3 py-2 text-right tabular-nums">
                                    {totals.openQuotesCount.toLocaleString('es-MX')}
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </section>

                <footer className="mt-10 border-t border-neutral-300 pt-4 text-sm text-neutral-500">
                    <p>Generado con Droplead</p>
                </footer>
            </div>
        </main>
    )
}
