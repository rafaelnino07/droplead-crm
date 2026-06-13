'use client'

import { useEffect, useState } from 'react'

const ITEM_FIELD_NAMES = ['unit_price', 'quantity', 'discount_pct']

function formatCurrency(value: number) {
    return value.toLocaleString('es-MX', { minimumFractionDigits: 0, maximumFractionDigits: 2 })
}

export function FinancialPreview({
    initialSubtotal = 0,
    initialTaxRate = 0,
    initialDiscountGlobal = 0,
}: {
    initialSubtotal?: number
    initialTaxRate?: number
    initialDiscountGlobal?: number
}) {
    const [subtotal, setSubtotal] = useState(initialSubtotal)
    const [taxRate, setTaxRate] = useState(initialTaxRate)
    const [discountGlobal, setDiscountGlobal] = useState(initialDiscountGlobal)

    useEffect(() => {
        function recalcSubtotal() {
            const unitPriceInputs = document.querySelectorAll<HTMLInputElement>('input[name="unit_price"]')

            let sum = 0

            unitPriceInputs.forEach((unitPriceInput) => {
                const row = unitPriceInput.closest('form') ?? unitPriceInput.parentElement
                const quantityInput = row?.querySelector<HTMLInputElement>('input[name="quantity"]')
                const discountInput = row?.querySelector<HTMLInputElement>('input[name="discount_pct"]')

                const unitPrice = Number(unitPriceInput.value) || 0
                const quantity = Number(quantityInput?.value) || 0
                const discountPct = Number(discountInput?.value) || 0

                sum += unitPrice * quantity * (1 - discountPct / 100)
            })

            setSubtotal(sum)
        }

        function handleInput(event: Event) {
            const target = event.target as HTMLElement

            if (!(target instanceof HTMLInputElement)) return

            if (target.name === 'tax_rate') {
                setTaxRate(Number(target.value) || 0)
            } else if (target.name === 'discount_global') {
                setDiscountGlobal(Number(target.value) || 0)
            } else if (ITEM_FIELD_NAMES.includes(target.name)) {
                recalcSubtotal()
            }
        }

        document.addEventListener('input', handleInput)

        return () => document.removeEventListener('input', handleInput)
    }, [])

    const discountAmount = (subtotal * discountGlobal) / 100
    const taxableAmount = subtotal - discountAmount
    const taxAmount = (taxableAmount * taxRate) / 100
    const total = taxableAmount + taxAmount

    return (
        <div className="fixed bottom-6 right-6 z-50 w-full max-w-sm rounded-xl border border-neutral-800 bg-neutral-900 p-6 shadow-2xl">
            <h2 className="text-sm font-medium text-neutral-500">Resumen financiero</h2>

            <div className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between">
                    <span className="text-neutral-400">Subtotal</span>
                    <span className="tabular-nums">${formatCurrency(subtotal)}</span>
                </div>

                {discountGlobal > 0 && (
                    <div className="flex justify-between">
                        <span className="text-amber-400">Descuento ({discountGlobal}%)</span>
                        <span className="tabular-nums text-amber-400">
                            -${formatCurrency(discountAmount)}
                        </span>
                    </div>
                )}

                {taxRate > 0 && (
                    <div className="flex justify-between">
                        <span className="text-neutral-400">IVA ({taxRate}%)</span>
                        <span className="tabular-nums">${formatCurrency(taxAmount)}</span>
                    </div>
                )}
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-neutral-800 pt-4">
                <span className="text-base font-semibold">Total</span>
                <span className="text-2xl font-bold text-white">${formatCurrency(total)}</span>
            </div>
        </div>
    )
}
