"use client";

import { useEffect, useRef, useState } from "react";
import { Bell } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Notification } from "@/lib/types/database";
import { markAsRead, markAllAsRead } from "@/lib/notifications/actions";

export type NotificationWithClient = Notification & { client_name: string | null };

const PRIORITY_CLASSES: Record<Notification["priority"], string> = {
  Alta: "bg-red-950 text-red-300 border border-red-900",
  Media: "bg-amber-950 text-amber-300 border border-amber-900",
  Baja: "bg-neutral-800 text-neutral-300 border border-neutral-700",
};

function timeAgo(dateString: string): string {
  const diffMs = Date.now() - new Date(dateString).getTime();
  const minutes = Math.floor(diffMs / 60000);

  if (minutes < 1) return "hace un momento";
  if (minutes < 60) return `hace ${minutes} min`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `hace ${hours} h`;

  const days = Math.floor(hours / 24);
  return `hace ${days} d`;
}

export function NotificationBell({
  initialCount,
  initialNotifications,
}: {
  initialCount: number;
  initialNotifications: NotificationWithClient[];
}) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState(initialNotifications);
  const [count, setCount] = useState(initialCount);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMarkAsRead = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    setCount((prev) => Math.max(0, prev - 1));
    void markAsRead(id);
  };

  const handleMarkAllAsRead = () => {
    setNotifications([]);
    setCount(0);
    void markAllAsRead();
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-label="Notificaciones"
        className="relative flex size-9 items-center justify-center rounded-lg border border-neutral-800 bg-neutral-900 text-neutral-300 transition hover:text-white"
      >
        <Bell className="size-4" />
        {count > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
            {count > 9 ? "9+" : count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-80 rounded-xl border border-neutral-800 bg-neutral-900 shadow-xl">
          <div className="flex items-center justify-between gap-4 border-b border-neutral-800 p-4">
            <p className="text-sm font-semibold text-white">Notificaciones</p>
            {notifications.length > 0 && (
              <button
                type="button"
                onClick={handleMarkAllAsRead}
                className="text-xs text-neutral-400 transition hover:text-white"
              >
                Marcar todas como leídas
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="p-6 text-center text-sm text-neutral-400">Todo al día ✓</p>
            ) : (
              <div className="divide-y divide-neutral-800">
                {notifications.map((notification) => (
                  <button
                    key={notification.id}
                    type="button"
                    onClick={() => handleMarkAsRead(notification.id)}
                    className="block w-full px-4 py-3 text-left transition hover:bg-neutral-800"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[10px] font-medium",
                          PRIORITY_CLASSES[notification.priority],
                        )}
                      >
                        {notification.priority}
                      </span>
                      <span className="text-[11px] text-neutral-500">{timeAgo(notification.created_at)}</span>
                    </div>
                    <p className="mt-1.5 text-sm font-medium text-white">{notification.title}</p>
                    <p className="mt-0.5 text-xs text-neutral-400 line-clamp-2">{notification.description}</p>
                    {notification.client_name && (
                      <p className="mt-1 text-[11px] text-neutral-500">{notification.client_name}</p>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
