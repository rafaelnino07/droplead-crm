'use client'

import { exitImpersonation } from '../../admin/actions'

export function ImpersonationBanner({ impersonatedOrgName }: { impersonatedOrgName: string | null }) {
    if (!impersonatedOrgName) return null

    return (
        <div className="fixed inset-x-0 top-0 z-50 flex items-center justify-center gap-3 bg-amber-500 px-4 py-2 text-sm font-medium text-black">
            <span>👁 Viendo como: {impersonatedOrgName}</span>
            <form action={exitImpersonation}>
                <button className="rounded bg-black px-3 py-1 text-xs font-semibold text-white">
                    Salir
                </button>
            </form>
        </div>
    )
}
