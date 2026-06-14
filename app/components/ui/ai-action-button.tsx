'use client'

import { useFormStatus } from 'react-dom'
import { cn } from '@/lib/utils'

type AIActionButtonProps = {
    label: string
    loadingLabel?: string
    className?: string
}

export function AIActionButton({ label, loadingLabel = 'Generando...', className }: AIActionButtonProps) {
    const { pending } = useFormStatus()

    return (
        <button
            type="submit"
            disabled={pending}
            className={cn(className, pending && 'cursor-not-allowed opacity-70')}
        >
            {pending ? (
                <span className="flex items-center justify-center gap-2">
                    <span className="size-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    {loadingLabel}
                </span>
            ) : (
                label
            )}
        </button>
    )
}
