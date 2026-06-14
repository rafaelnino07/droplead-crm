'use client'

import { useState } from 'react'
import { HelpCircle } from 'lucide-react'

export function FieldLabel({ label, tooltip }: { label: string; tooltip: string }) {
    const [show, setShow] = useState(false)

    return (
        <div className="relative inline-flex items-center gap-1.5">
            <label className="text-sm text-neutral-400">{label}</label>

            <button
                type="button"
                onMouseEnter={() => setShow(true)}
                onMouseLeave={() => setShow(false)}
                className="text-neutral-500 hover:text-neutral-300"
                aria-label={`Ayuda: ${label}`}
            >
                <HelpCircle size={14} />
            </button>

            {show && (
                <div className="absolute bottom-full left-0 mb-2 w-64 rounded-lg border border-neutral-700 bg-neutral-800 p-3 text-xs text-neutral-300 z-50">
                    {tooltip}
                </div>
            )}
        </div>
    )
}
