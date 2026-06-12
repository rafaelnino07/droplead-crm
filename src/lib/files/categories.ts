export type FileCategory =
    | 'render'
    | 'plano'
    | 'contrato'
    | 'referencia'
    | 'foto'
    | 'levantamiento'
    | 'otro'

export const FILE_CATEGORIES: {
    key: FileCategory
    label: string
}[] = [
        { key: 'render', label: 'Render' },
        { key: 'plano', label: 'Plano' },
        { key: 'contrato', label: 'Contrato' },
        { key: 'referencia', label: 'Referencia' },
        { key: 'foto', label: 'Foto' },
        { key: 'levantamiento', label: 'Levantamiento' },
        { key: 'otro', label: 'Otro' },
    ]

export function getFileCategoryLabel(category?: string | null): string {
    return FILE_CATEGORIES.find((item) => item.key === category)?.label ?? 'Otro'
}
