"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

export function TokenInput({ defaultValue }: { defaultValue: string }) {
  const [showToken, setShowToken] = useState(false);
  const [value, setValue] = useState(defaultValue);

  return (
    <div>
      <div className="relative">
        <input
          type={showToken ? "text" : "password"}
          name="access_token"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="w-full h-10 rounded-lg bg-secondary/50 border border-border/60 px-3 pr-10 text-sm font-mono text-white focus:outline-none focus:ring-2 focus:ring-ring/40"
        />
        <button
          type="button"
          onClick={() => setShowToken((prev) => !prev)}
          aria-label={showToken ? "Ocultar token" : "Mostrar token"}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition"
        >
          {showToken ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </div>
      <p className="text-xs text-neutral-500 mt-1">{value.length} caracteres</p>
    </div>
  );
}
