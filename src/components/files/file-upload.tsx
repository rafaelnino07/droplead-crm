'use client'

import { useState } from 'react'
import { getSupabaseBrowser } from '@/lib/supabase/client'
import { FILE_CATEGORIES, type FileCategory } from '@/lib/files/categories'

type FileUploadProps = {
    organizationId: string
    clientId: string
    userId: string
}

export function FileUpload({
    organizationId,
    clientId,
    userId,
}: FileUploadProps) {
    const supabase = getSupabaseBrowser()
    const [uploading, setUploading] = useState(false)
    const [message, setMessage] = useState<string | null>(null)
    const [category, setCategory] = useState<FileCategory>('otro')

    async function handleUpload(event: React.ChangeEvent<HTMLInputElement>) {
        const file = event.target.files?.[0]

        if (!file) return

        setUploading(true)
        setMessage(null)

        const safeFileName = file.name.replace(/\s+/g, '-').toLowerCase()
        const filePath = `${organizationId}/${clientId}/${Date.now()}-${safeFileName}`

        const { error: uploadError } = await supabase.storage
            .from('client-files')
            .upload(filePath, file)

        if (uploadError) {
            console.error(uploadError)
            setMessage('Error al subir el archivo.')
            setUploading(false)
            return
        }

        const { error: insertError } = await supabase
            .from('client_files')
            .insert({
                organization_id: organizationId,
                client_id: clientId,
                uploaded_by: userId,
                file_name: file.name,
                file_path: filePath,
                file_type: file.type,
                file_size: file.size,
                category,
            })

        if (insertError) {
            console.error(insertError)
            setMessage('El archivo subió, pero no se guardó la metadata.')
            setUploading(false)
            return
        }

        setMessage('Archivo subido correctamente.')
        setUploading(false)
        event.target.value = ''

        window.location.reload()
    }

    return (
        <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-6">
            <p className="text-lg font-bold">
                Subir archivo
            </p>

            <p className="mt-2 text-sm text-neutral-400">
                Sube fotos, renders, planos, contratos, referencias o levantamientos.
            </p>

            <div className="mt-5">
                <label className="text-sm text-neutral-400">
                    Categoría
                </label>

                <select
                    value={category}
                    onChange={(event) => setCategory(event.target.value as FileCategory)}
                    disabled={uploading}
                    className="mt-2 w-full rounded-lg border border-neutral-700 bg-black px-4 py-3 text-white"
                >
                    {FILE_CATEGORIES.map((item) => (
                        <option key={item.key} value={item.key}>
                            {item.label}
                        </option>
                    ))}
                </select>
            </div>

            <div className="mt-5">
                <input
                    type="file"
                    onChange={handleUpload}
                    disabled={uploading}
                    className="block w-full text-sm text-neutral-300 file:mr-4 file:rounded-lg file:border-0 file:bg-white file:px-4 file:py-2 file:font-semibold file:text-black"
                />
            </div>

            {uploading && (
                <p className="mt-3 text-sm text-neutral-400">
                    Subiendo archivo...
                </p>
            )}

            {message && (
                <p className="mt-3 text-sm text-neutral-300">
                    {message}
                </p>
            )}
        </div>
    )
}