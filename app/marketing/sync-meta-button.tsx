"use client";

import { useState } from "react";

export function SyncMetaButton() {
    const [isSyncing, setIsSyncing] = useState(false);
    const [cooldown, setCooldown] = useState(false);

    async function handleSync() {
        if (isSyncing || cooldown) return;

        setIsSyncing(true);

        try {
            const response = await fetch("/api/meta/sync", {
                method: "POST",
            });

            const data = await response.json();

            if (!response.ok) {
                alert(data.error || "Error al sincronizar Meta");
                return;
            }

            alert(`Sincronización completada.
Campañas: ${data.campaigns}
Ads: ${data.ads}

Errores:
${data.errors?.length ? data.errors.join("\n") : "Ninguno"}`);

            setCooldown(true);

            setTimeout(() => {
                setCooldown(false);
            }, 60000);

            window.location.reload();
        } catch (error) {
            console.error(error);
            alert("Ocurrió un error al sincronizar.");
        } finally {
            setIsSyncing(false);
        }
    }

    return (
        <button
            onClick={handleSync}
            disabled={isSyncing || cooldown}
            className="h-9 px-4 rounded-lg gradient-primary text-sm font-medium text-white shadow-lg shadow-indigo-500/25 hover:opacity-95 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
            {isSyncing
                ? "Sincronizando..."
                : cooldown
                    ? "Espera 60s"
                    : "Sincronizar ahora"}
        </button>
    );
}