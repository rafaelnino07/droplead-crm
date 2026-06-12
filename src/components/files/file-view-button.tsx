'use client'

import { useState } from 'react'
import { getSupabaseBrowser } from '@/lib/supabase/client'

const SIGNED_URL_EXPIRES_IN = 60 * 5 // 5 minutos

type FileViewButtonProps = {
    filePath: string
}

export function FileViewButton({ filePath }: FileViewButtonProps) {
    const supabase = getSupabaseBrowser()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    async function handleView() {
        setLoading(true)
        setError(null)

        const { data, error: signedUrlError } = await supabase.storage
            .from('client-files')
            .createSignedUrl(filePath, SIGNED_URL_EXPIRES_IN)

        if (signedUrlError || !data?.signedUrl) {
            console.error(signedUrlError)
            setError('No se pudo abrir el archivo.')
            setLoading(false)
            return
        }

        window.open(data.signedUrl, '_blank', 'noopener,noreferrer')
        setLoading(false)
    }

    return (
        <div className="flex flex-col items-end gap-1">
            <button
                type="button"
                onClick={handleView}
                disabled={loading}
                className="shrink-0 rounded-lg border border-neutral-700 px-3 py-1 text-xs font-semibold text-white hover:bg-neutral-800 disabled:opacity-50"
            >
                {loading ? 'Abriendo...' : 'Ver archivo'}
            </button>

            {error && (
                <p className="text-xs text-red-400">{error}</p>
            )}
        </div>
    )
}
