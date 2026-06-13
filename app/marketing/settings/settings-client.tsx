"use client";

import { useState } from "react";
import { Copy, Check, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

export function SyncButton() {
  const [syncing, setSyncing] = useState(false);

  const sync = () => {
    setSyncing(true);
    setTimeout(() => setSyncing(false), 1400);
  };

  return (
    <button
      onClick={sync}
      disabled={syncing}
      className="h-9 px-4 rounded-lg gradient-primary text-sm font-medium text-white shadow-lg shadow-indigo-500/25 hover:opacity-95 transition flex items-center gap-2 disabled:opacity-70"
    >
      <RefreshCw className={cn("size-4", syncing && "animate-spin")} />
      {syncing ? "Sincronizando…" : "Sincronizar ahora"}
    </button>
  );
}

export function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <button
      onClick={copy}
      className="px-4 border-l border-border/60 hover:bg-secondary transition flex items-center gap-2 text-xs font-medium"
    >
      {copied ? (
        <>
          <Check className="size-3.5 text-emerald-400" /> Copiado
        </>
      ) : (
        <>
          <Copy className="size-3.5" /> Copiar
        </>
      )}
    </button>
  );
}
