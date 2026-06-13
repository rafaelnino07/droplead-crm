'use client'

import { useState } from 'react'
import { createProduct } from '@/lib/products/actions'

export function NewProductForm() {
    const [open, setOpen] = useState(false)

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()

        const formData = new FormData(event.currentTarget)
        await createProduct(formData)

        event.currentTarget.reset()
        setOpen(false)
    }

    return (
        <div className="relative">
            <button
                type="button"
                onClick={() => setOpen((value) => !value)}
                className="rounded bg-white px-4 py-2 text-sm font-semibold text-black"
            >
                Nuevo producto
            </button>

            {open && (
                <form
                    onSubmit={handleSubmit}
                    className="absolute right-0 top-full z-10 mt-2 w-80 space-y-2 rounded-lg border border-neutral-700 bg-neutral-900 p-4 shadow-xl"
                >
                    <input
                        name="name"
                        placeholder="Nombre"
                        required
                        className="w-full rounded bg-neutral-800 px-3 py-2 text-sm outline-none"
                    />

                    <input
                        name="description"
                        placeholder="Descripción (opcional)"
                        className="w-full rounded bg-neutral-800 px-3 py-2 text-sm outline-none"
                    />

                    <div className="grid grid-cols-2 gap-2">
                        <input
                            name="unit"
                            defaultValue="pza"
                            placeholder="Unidad"
                            className="w-full rounded bg-neutral-800 px-3 py-2 text-sm outline-none"
                        />

                        <input
                            type="number"
                            name="unit_price"
                            step="0.01"
                            min="0"
                            required
                            placeholder="Precio unitario"
                            className="w-full rounded bg-neutral-800 px-3 py-2 text-sm outline-none"
                        />
                    </div>

                    <input
                        name="category"
                        placeholder="Categoría (opcional)"
                        className="w-full rounded bg-neutral-800 px-3 py-2 text-sm outline-none"
                    />

                    <button className="w-full rounded bg-white px-3 py-1.5 text-xs font-semibold text-black">
                        Guardar producto
                    </button>
                </form>
            )}
        </div>
    )
}
