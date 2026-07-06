"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const TABS = [
  { segment: "resumen", label: "Resumen" },
  { segment: "estrategia", label: "Estrategia" },
  { segment: "calendario", label: "Calendario" },
  { segment: "publicaciones", label: "Publicaciones" },
  { segment: "historias", label: "Historias" },
  { segment: "reels", label: "Reels" },
  { segment: "tiktoks", label: "TikToks" },
  { segment: "biblioteca", label: "Biblioteca" },
  { segment: "memoria", label: "Memoria de Marca" },
  { segment: "metricas", label: "Métricas" },
  { segment: "comentarios", label: "Comentarios" },
  { segment: "configuracion", label: "Configuración" },
];

export function ClientSubNav({ clientId }: { clientId: string }) {
  const pathname = usePathname();

  return (
    <div className="scrollbar-none overflow-x-auto border-b border-border px-6">
      <nav className="flex w-max gap-1">
        {TABS.map((tab) => {
          const href = `/clients/${clientId}/${tab.segment}`;
          const active = pathname === href;
          return (
            <Link
              key={tab.segment}
              href={href}
              className={cn(
                "shrink-0 border-b-2 px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
