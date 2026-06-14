'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'

export function BranchFilter({ branches }: { branches: { id: string; name: string }[] }) {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()

    const currentBranchId = searchParams.get('branch_id') ?? ''

    function handleChange(event: React.ChangeEvent<HTMLSelectElement>) {
        const value = event.target.value
        const params = new URLSearchParams(searchParams.toString())

        if (value) {
            params.set('branch_id', value)
        } else {
            params.delete('branch_id')
        }

        const query = params.toString()
        router.push(query ? `${pathname}?${query}` : pathname)
    }

    return (
        <select
            value={currentBranchId}
            onChange={handleChange}
            className="rounded bg-neutral-800 px-4 py-2 text-sm outline-none"
        >
            <option value="">Todas las sucursales</option>
            {branches.map((branch) => (
                <option key={branch.id} value={branch.id}>
                    {branch.name}
                </option>
            ))}
        </select>
    )
}
