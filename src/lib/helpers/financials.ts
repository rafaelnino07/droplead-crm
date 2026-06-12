// ═══════════════════════════════════════════════════════════════
// DROPLEAD CRM — Financial Helpers
// Single source of truth for quote calculations.
// Used on both client (form) and server (saving to DB).
// ═══════════════════════════════════════════════════════════════

import type { CreateQuoteItemInput } from '@/lib/types/database'

export interface ItemCalc {
    unit_price: number
    quantity: number
    discount_pct: number
    discount_amount: number
    subtotal: number
}

export interface QuoteCalc {
    subtotal: number  // sum of item subtotals
    discount_global: number  // % off subtotal
    discount_amount: number  // calculated global discount
    taxable_amount: number  // subtotal - global discount
    tax_rate: number
    tax_amount: number
    total: number
}

// ── Per-item math ────────────────────────────────────────────────

export function calcItem(
    unit_price: number,
    quantity: number,
    discount_pct: number
): ItemCalc {
    const gross = round2(unit_price * quantity)
    const discount_amount = round2(gross * (discount_pct / 100))
    const subtotal = round2(gross - discount_amount)

    return { unit_price, quantity, discount_pct, discount_amount, subtotal }
}

// ── Quote-level math ─────────────────────────────────────────────

export function calcQuote(
    items: Array<{ subtotal: number }>,
    discount_global: number,   // %
    tax_rate: number    // % (e.g. 16)
): QuoteCalc {
    const subtotal = round2(items.reduce((s, i) => s + i.subtotal, 0))
    const discount_amount = round2(subtotal * (discount_global / 100))
    const taxable_amount = round2(subtotal - discount_amount)
    const tax_amount = round2(taxable_amount * (tax_rate / 100))
    const total = round2(taxable_amount + tax_amount)

    return {
        subtotal,
        discount_global,
        discount_amount,
        taxable_amount,
        tax_rate,
        tax_amount,
        total,
    }
}

// ── Formatting ───────────────────────────────────────────────────

const MXN = new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
})

const MXN_DECIMAL = new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2,
})

export const formatMXN = (n: number) => MXN.format(n)
export const formatMXNDecimal = (n: number) => MXN_DECIMAL.format(n)
export const formatPct = (n: number) => `${n.toFixed(1)}%`

// ── Utilities ────────────────────────────────────────────────────

function round2(n: number): number {
    return Math.round(n * 100) / 100
}

export function calcItemsFromInput(
    items: Array<CreateQuoteItemInput>
): Array<CreateQuoteItemInput & ItemCalc> {
    return items.map(item => ({
        ...item,
        ...calcItem(item.unit_price, item.quantity, item.discount_pct),
    }))
}
