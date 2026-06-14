"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const HIDDEN_ROUTES = ["/", "/login", "/register", "/onboarding"];

type NavItem = { label: string; href: string };
type NavSection = { title: string; items: NavItem[] };

const sections: NavSection[] = [
  {
    title: "General",
    items: [
      { label: "Dashboard", href: "/dashboard" },
      { label: "Pipeline", href: "/pipeline" },
      { label: "Clientes", href: "/clients" },
      { label: "Productos", href: "/products" },
      { label: "Tareas", href: "/tasks" },
    ],
  },
  {
    title: "Marketing",
    items: [
      { label: "Resumen", href: "/marketing" },
      { label: "Creativos", href: "/marketing/ads" },
      { label: "Atribución", href: "/marketing/attribution" },
      { label: "Configuración", href: "/marketing/settings" },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();

  if (HIDDEN_ROUTES.includes(pathname) || pathname.startsWith("/q/") || pathname.endsWith("/print")) {
    return null;
  }

  return (
    <aside className="hidden md:flex w-60 shrink-0 flex-col border-r border-neutral-800 bg-neutral-950 px-4 py-6">
      <Link href="/dashboard" className="mb-8 px-2 text-lg font-bold text-white">
        Droplead
      </Link>

      <nav className="flex-1 space-y-6">
        {sections.map((section) => (
          <div key={section.title}>
            <p className="px-2 mb-2 text-xs font-semibold uppercase tracking-wider text-neutral-500">
              {section.title}
            </p>
            <ul className="space-y-1">
              {section.items.map((item) => {
                const active = pathname === item.href;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        "block rounded-md px-2 py-2 text-sm transition",
                        active
                          ? "bg-neutral-800 text-white font-medium"
                          : "text-neutral-400 hover:bg-neutral-900 hover:text-white",
                      )}
                    >
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  );
}
