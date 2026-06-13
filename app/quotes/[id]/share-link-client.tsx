'use client'

import { useState } from 'react'

export function CopyLinkButton({ text }: { text: string }) {
    const [copied, setCopied] = useState(false)

    return (
        <button
            type="button"
            onClick={() => {
                navigator.clipboard.writeText(text)
                setCopied(true)
                setTimeout(() => setCopied(false), 2000)
            }}
            className="shrink-0 rounded bg-white px-4 py-2 text-sm font-semibold text-black"
        >
            {copied ? 'Copiado ✓' : 'Copiar link'}
        </button>
    )
}
