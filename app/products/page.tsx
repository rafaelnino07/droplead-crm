import { redirect } from 'next/navigation'
import { getSupabaseServer } from '@/lib/supabase/server'
import { NewProductForm } from '../components/products/new-product-form'
import { archiveProduct } from '@/lib/products/actions'

export default async function ProductsPage() {
    const supabase = await getSupabaseServer()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) redirect('/login')

    const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('user_id', user.id)
        .maybeSingle()

    if (!profile) redirect('/login')

    const { data: activeData, error } = await supabase
        .from('products')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .eq('is_archived', false)
        .order('times_used', { ascending: false })
        .order('name', { ascending: true })

    if (error) console.error('PRODUCTS ERROR:', error)

    const products = activeData ?? []

    const { data: archivedData, error: archivedError } = await supabase
        .from('products')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .eq('is_archived', true)
        .order('times_used', { ascending: false })
        .order('name', { ascending: true })

    if (archivedError) console.error('ARCHIVED PRODUCTS ERROR:', archivedError)

    const archivedProducts = archivedData ?? []

    const mostQuoted = products[0] ?? null

    const lastUsedAt = products.reduce<string | null>((latest, product) => {
        if (!product.last_used_at) return latest
        if (!latest || product.last_used_at > latest) return product.last_used_at
        return latest
    }, null)

    return (
        <main className="min-h-screen bg-neutral-950 p-8 text-white">
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-xs uppercase tracking-wider text-neutral-500">Catálogo de productos</p>
                    <h1 className="mt-1 text-3xl font-bold">Productos</h1>

                    {archivedProducts.length > 0 && (
                        <p className="mt-1 text-xs text-neutral-500">
                            {archivedProducts.length} producto{archivedProducts.length === 1 ? '' : 's'} archivado
                            {archivedProducts.length === 1 ? '' : 's'}
                        </p>
                    )}
                </div>

                <NewProductForm />
            </div>

            {/* STATS ROW */}
            <div className="mt-6 grid gap-4 sm:grid-cols-3">
                <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-6">
                    <p className="text-xs text-neutral-500">Productos activos</p>
                    <p className="mt-2 text-2xl font-bold">{products.length}</p>
                </div>

                <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-6">
                    <p className="text-xs text-neutral-500">Más cotizado</p>
                    <p className="mt-2 text-2xl font-bold">{mostQuoted?.name ?? '—'}</p>
                </div>

                <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-6">
                    <p className="text-xs text-neutral-500">Última vez usado</p>
                    <p className="mt-2 text-2xl font-bold">
                        {lastUsedAt
                            ? new Date(lastUsedAt).toLocaleDateString('es-MX', {
                                  day: 'numeric',
                                  month: 'long',
                                  year: 'numeric',
                              })
                            : '—'}
                    </p>
                </div>
            </div>

            {/* PRODUCT TABLE */}
            <section className="mt-6 rounded-xl border border-neutral-800 bg-neutral-900 p-6">
                {products.length === 0 ? (
                    <p className="text-neutral-400">No tienes productos en tu catálogo.</p>
                ) : (
                    <table className="w-full text-left text-sm">
                        <thead>
                            <tr className="border-b border-neutral-800 text-neutral-500">
                                <th className="py-2 pr-4 font-medium">Producto</th>
                                <th className="py-2 pr-4 font-medium">Categoría</th>
                                <th className="py-2 pr-4 font-medium">Precio</th>
                                <th className="py-2 pr-4 font-medium">Veces usado</th>
                                <th className="py-2 pr-4 font-medium">Último uso</th>
                                <th className="py-2"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {products.map((product) => (
                                <tr key={product.id} className="border-b border-neutral-900">
                                    <td className="py-3 pr-4 font-medium">{product.name}</td>
                                    <td className="py-3 pr-4 text-neutral-400">{product.category ?? '—'}</td>
                                    <td className="py-3 pr-4 tabular-nums">
                                        ${Number(product.unit_price).toLocaleString('es-MX')}
                                    </td>
                                    <td className="py-3 pr-4 tabular-nums">{product.times_used}</td>
                                    <td className="py-3 pr-4 text-neutral-400">
                                        {product.last_used_at
                                            ? new Date(product.last_used_at).toLocaleDateString('es-MX', {
                                                  day: 'numeric',
                                                  month: 'short',
                                                  year: 'numeric',
                                              })
                                            : '—'}
                                    </td>
                                    <td className="py-3 text-right">
                                        <form action={archiveProduct}>
                                            <input type="hidden" name="product_id" value={product.id} />
                                            <button className="rounded border border-neutral-600 px-2 py-1 text-xs text-neutral-300 hover:bg-neutral-800">
                                                Archivar
                                            </button>
                                        </form>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </section>
        </main>
    )
}
