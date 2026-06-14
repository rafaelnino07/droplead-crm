// PDF MIGRATION PATH:
// When ready to migrate to server-side PDF generation:
// 1. Install puppeteer or @sparticuz/chromium for serverless
// 2. Create app/api/quotes/[id]/pdf/route.ts
// 3. Use page.goto('/quotes/[id]/print') + page.pdf({ format: 'A4' })
// 4. Return as application/pdf response
// 5. Replace the print link with a fetch to this API route

import { notFound, redirect } from 'next/navigation'
import { getSupabaseServer } from '@/lib/supabase/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { PrintButton } from './print-button-client'

function formatCurrency(amount: number, currency: string): string {
    const formatted = new Intl.NumberFormat('es-MX', {
        maximumFractionDigits: 0,
        minimumFractionDigits: 0,
    }).format(amount)

    const code = (currency || 'MXN').toUpperCase()

    switch (code) {
        case 'MXN': return `$${formatted} MXN`
        case 'USD': return `$${formatted} USD`
        case 'EUR': return `€${formatted} EUR`
        default: return `${code} ${formatted}`
    }
}

export default async function PrintQuotePage({
    params,
}: {
    params: { id: string }
}) {
    const supabase = await getSupabaseServer()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    const admin = getSupabaseAdmin()

    const quoteSelect = `
      *,
      clients (
        id,
        name,
        client_type,
        company,
        email,
        phone
      )
    `

    const { data: quote, error } = await admin
        .from('quotes')
        .select(quoteSelect)
        .eq('id', params.id)
        .maybeSingle()

    if (!quote) notFound()

    let organizationId: string | null = null

    if (user) {
        const { data: profile } = await supabase
            .from('profiles')
            .select('organization_id')
            .eq('user_id', user.id)
            .maybeSingle()

        if (!profile) redirect('/onboarding')

        organizationId = profile.organization_id
    }

    if (organizationId && quote.organization_id !== organizationId) notFound()

    if (!user && !quote.share_token) {
        redirect('/login')
    }

    const { data: itemsData, error: itemsError } = await admin
        .from('quote_items')
        .select('id, name, description, quantity, unit, unit_price, discount_pct, subtotal, sort_order')
        .eq('quote_id', quote.id)
        .order('sort_order', { ascending: true })

    const quoteItems = itemsData ?? []

    const { data: organization } = await admin
        .from('organizations')
        .select('name')
        .eq('id', quote.organization_id)
        .maybeSingle()

    const client = Array.isArray(quote.clients) ? quote.clients[0] : quote.clients

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

            <div className="mx-auto max-w-3xl">
                <div className="no-print mb-6 flex justify-end">
                    <PrintButton />
                </div>

                {/* 1. HEADER */}
                <header className="flex items-start justify-between border-b border-neutral-300 pb-4">
                    <p className="text-lg font-bold">{organization?.name ?? 'Droplead'}</p>

                    <div className="text-right">
                        <p className="font-semibold">{quote.quote_number}</p>
                        <p className="text-sm text-neutral-600">
                            {new Date(quote.created_at).toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' })}
                        </p>
                    </div>
                </header>

                {/* 2. CLIENT BLOCK */}
                <section className="mt-6 rounded border border-neutral-300 p-4">
                    <p className="text-sm font-semibold text-neutral-500">Cliente</p>
                    <div className="mt-2 grid gap-2 sm:grid-cols-2">
                        <p><span className="text-neutral-500">Nombre:</span> {client?.name ?? 'Sin cliente'}</p>
                        {client?.client_type !== 'persona' && client?.company && (
                            <p><span className="text-neutral-500">Empresa:</span> {client.company}</p>
                        )}
                        <p><span className="text-neutral-500">Correo:</span> {client?.email ?? '—'}</p>
                        <p><span className="text-neutral-500">Teléfono:</span> {client?.phone ?? '—'}</p>
                    </div>
                </section>

                {/* 3. PROJECT INFO */}
                <section className="mt-6">
                    <h1 className="text-2xl font-bold">{quote.project_name}</h1>

                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                        <p><span className="text-neutral-500">Tipo de proyecto:</span> {quote.project_type ?? '—'}</p>
                        <p><span className="text-neutral-500">Dirección:</span> {quote.project_address ?? '—'}</p>
                    </div>

                    {quote.client_vision && (
                        <p className="mt-3">
                            <span className="text-neutral-500">Visión del cliente:</span> {quote.client_vision}
                        </p>
                    )}
                </section>

                {/* 4. LINE ITEMS TABLE */}
                {quoteItems.length > 0 && (
                    <section className="mt-6">
                        <table className="w-full border-collapse border border-neutral-300 text-sm">
                            <thead>
                                <tr className="bg-neutral-100 text-left">
                                    <th className="border border-neutral-300 px-3 py-2 font-medium">Descripción</th>
                                    <th className="border border-neutral-300 px-3 py-2 text-right font-medium">Cant.</th>
                                    <th className="border border-neutral-300 px-3 py-2 font-medium">Unidad</th>
                                    <th className="border border-neutral-300 px-3 py-2 text-right font-medium">P.Unit</th>
                                    <th className="border border-neutral-300 px-3 py-2 text-right font-medium">Desc%</th>
                                    <th className="border border-neutral-300 px-3 py-2 text-right font-medium">Subtotal</th>
                                </tr>
                            </thead>
                            <tbody>
                                {quoteItems.map((item) => (
                                    <tr key={item.id}>
                                        <td className="border border-neutral-300 px-3 py-2">
                                            <p className="font-medium">{item.name}</p>
                                            {item.description && (
                                                <p className="text-xs text-neutral-500">{item.description}</p>
                                            )}
                                        </td>
                                        <td className="border border-neutral-300 px-3 py-2 text-right tabular-nums">{item.quantity}</td>
                                        <td className="border border-neutral-300 px-3 py-2">{item.unit}</td>
                                        <td className="border border-neutral-300 px-3 py-2 text-right tabular-nums">
                                            {formatCurrency(Number(item.unit_price), quote.currency)}
                                        </td>
                                        <td className="border border-neutral-300 px-3 py-2 text-right tabular-nums">
                                            {item.discount_pct > 0 ? `${item.discount_pct}%` : '—'}
                                        </td>
                                        <td className="border border-neutral-300 px-3 py-2 text-right font-medium tabular-nums">
                                            {formatCurrency(Number(item.subtotal), quote.currency)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </section>
                )}

                {/* 5. FINANCIAL SUMMARY */}
                <section className="mt-6 flex justify-end">
                    <div className="w-full max-w-sm">
                        <div className="space-y-1 text-sm">
                            <div className="flex justify-between">
                                <span className="text-neutral-500">Subtotal</span>
                                <span className="tabular-nums">{formatCurrency(Number(quote.subtotal), quote.currency)}</span>
                            </div>

                            {(quote.discount_global > 0 || quote.discount_amount > 0) && (
                                <div className="flex justify-between">
                                    <span className="text-neutral-500">Descuento ({quote.discount_global}%)</span>
                                    <span className="tabular-nums">
                                        -{formatCurrency(Number(quote.discount_amount), quote.currency)}
                                    </span>
                                </div>
                            )}

                            {quote.tax_rate > 0 && (
                                <div className="flex justify-between">
                                    <span className="text-neutral-500">IVA ({quote.tax_rate}%)</span>
                                    <span className="tabular-nums">{formatCurrency(Number(quote.tax_amount), quote.currency)}</span>
                                </div>
                            )}
                        </div>

                        <div className="mt-2 flex items-center justify-between border-t border-neutral-300 pt-2">
                            <span className="text-base font-semibold">Total</span>
                            <span className="text-2xl font-bold">{formatCurrency(Number(quote.total), quote.currency)}</span>
                        </div>
                    </div>
                </section>

                {/* 6. FOOTER */}
                <footer className="mt-10 border-t border-neutral-300 pt-4 text-sm text-neutral-500">
                    {quote.executive_name && (
                        <p>
                            Preparado por: {quote.executive_name}
                            {quote.executive_email && ` · ${quote.executive_email}`}
                        </p>
                    )}
                    {quote.valid_until && (
                        <p className="mt-1">Válida hasta: {new Date(quote.valid_until).toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                    )}
                    <p className="mt-2">Generado con Droplead</p>
                </footer>
            </div>
        </main>
    )
}
