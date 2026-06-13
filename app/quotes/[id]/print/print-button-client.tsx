'use client'

export function PrintButton() {
    return (
        <button
            type="button"
            onClick={() => window.print()}
            className="no-print rounded bg-black px-4 py-2 text-sm font-semibold text-white"
        >
            Imprimir / Guardar PDF
        </button>
    )
}
