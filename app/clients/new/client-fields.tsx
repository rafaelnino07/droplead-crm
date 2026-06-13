'use client'

import { useState } from 'react'
import type { ClientType } from '@/lib/types/database'

export function ClientFields() {
    const [clientType, setClientType] = useState<ClientType>('empresa')

    return (
        <>
            <div>
                <label className="mb-1 block text-xs text-neutral-500">Tipo de cliente</label>
                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={() => setClientType('persona')}
                        className={`flex-1 rounded px-4 py-3 text-sm font-semibold transition ${
                            clientType === 'persona'
                                ? 'bg-white text-black'
                                : 'bg-neutral-800 text-neutral-400 hover:text-white'
                        }`}
                    >
                        Persona
                    </button>
                    <button
                        type="button"
                        onClick={() => setClientType('empresa')}
                        className={`flex-1 rounded px-4 py-3 text-sm font-semibold transition ${
                            clientType === 'empresa'
                                ? 'bg-white text-black'
                                : 'bg-neutral-800 text-neutral-400 hover:text-white'
                        }`}
                    >
                        Empresa
                    </button>
                </div>
                <input type="hidden" name="client_type" value={clientType} />
            </div>

            <input
                name="name"
                placeholder="Nombre del cliente"
                required
                className="w-full rounded bg-neutral-800 px-4 py-3 outline-none"
            />

            {clientType === 'empresa' && (
                <input
                    name="company"
                    placeholder="Empresa"
                    className="w-full rounded bg-neutral-800 px-4 py-3 outline-none"
                />
            )}

            <input
                name="email"
                type="email"
                placeholder="Correo"
                className="w-full rounded bg-neutral-800 px-4 py-3 outline-none"
            />

            <input
                name="phone"
                placeholder="Teléfono"
                className="w-full rounded bg-neutral-800 px-4 py-3 outline-none"
            />
        </>
    )
}
