'use client'

import { useState } from 'react'
import { saveItemAsProduct } from '@/lib/products/actions'

export function SaveAsProductForm({
    itemId,
    name,
    description,
    unit,
    unitPrice,
}: {
    itemId: string
    name: string
    description: string | null
    unit: string
    unitPrice: number
}) {
    const [open, setOpen] = useState(false)
    const [saved, setSaved] = useState(false)
    const [duplicateName, setDuplicateName] = useState<string | null>(null)

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()

        const formData = new FormData(event.currentTarget)
        const result = await saveItemAsProduct(formData)

        if (result?.duplicate) {
            setDuplicateName(result.existingName)
        } else if (result?.created) {
            setSaved(true)
            setOpen(false)
        }
    }

    if (saved) {
        return <span className="text-xs text-green-400">✓ Guardado en catálogo</span>
    }

    return (
        <div className="relative">
            <button
                type="button"
                onClick={() => setOpen((value) => !value)}
                className="rounded border border-neutral-600 px-2 py-1 text-xs text-neutral-300 hover:bg-neutral-700"
            >
                Guardar en catálogo
            </button>

            {open && (
                <form
                    onSubmit={handleSubmit}
                    className="absolute right-0 top-full z-10 mt-2 w-72 space-y-2 rounded-lg border border-neutral-700 bg-neutral-900 p-3 shadow-xl"
                >
                    <input type="hidden" name="quote_item_id" value={itemId} />

                    <input
                        name="name"
                        defaultValue={name}
                        placeholder="Nombre"
                        className="w-full rounded bg-neutral-800 px-3 py-2 text-sm outline-none"
                    />

                    <input
                        name="description"
                        defaultValue={description ?? ''}
                        placeholder="Descripción (opcional)"
                        className="w-full rounded bg-neutral-800 px-3 py-2 text-sm outline-none"
                    />

                    <div className="grid grid-cols-2 gap-2">
                        <input
                            name="unit"
                            defaultValue={unit}
                            placeholder="Unidad"
                            className="w-full rounded bg-neutral-800 px-3 py-2 text-sm outline-none"
                        />

                        <input
                            type="number"
                            name="unit_price"
                            defaultValue={unitPrice}
                            step="0.01"
                            min="0"
                            placeholder="Precio unitario"
                            className="w-full rounded bg-neutral-800 px-3 py-2 text-sm outline-none"
                        />
                    </div>

                    <input
                        name="category"
                        placeholder="Categoría (opcional)"
                        className="w-full rounded bg-neutral-800 px-3 py-2 text-sm outline-none"
                    />

                    {duplicateName && (
                        <p className="text-xs text-amber-400">
                            Ya existe un producto llamado &quot;{duplicateName}&quot; en el catálogo.
                        </p>
                    )}

                    <button className="rounded bg-white px-3 py-1.5 text-xs font-semibold text-black">
                        Guardar
                    </button>
                </form>
            )}
        </div>
    )
}
