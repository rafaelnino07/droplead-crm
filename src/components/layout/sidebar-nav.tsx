"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const HIDDEN_ROUTES = ["/", "/login", "/register", "/onboarding", "/admin"];

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
      { label: "Sucursales", href: "/branches" },
      { label: "Quick Actions", href: "/settings/quick-actions" },
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

export function SidebarNav({
  isSuperAdmin,
  unreadNotifications = 0,
}: {
  isSuperAdmin: boolean;
  unreadNotifications?: number;
}) {
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
                        "flex items-center justify-between rounded-md px-2 py-2 text-sm transition",
                        active
                          ? "bg-neutral-800 text-white font-medium"
                          : "text-neutral-400 hover:bg-neutral-900 hover:text-white",
                      )}
                    >
                      <span>{item.label}</span>
                      {item.href === "/dashboard" && unreadNotifications > 0 && (
                        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
                          {unreadNotifications > 9 ? "9+" : unreadNotifications}
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {isSuperAdmin && (
        <div className="mt-6 border-t border-neutral-800 pt-4">
          <Link
            href="/admin"
            className={cn(
              "block rounded-md px-2 py-2 text-sm transition",
              pathname === "/admin"
                ? "bg-neutral-800 text-white font-medium"
                : "text-neutral-400 hover:bg-neutral-900 hover:text-white",
            )}
          >
            Admin
          </Link>
        </div>
      )}
    </aside>
  );
}
