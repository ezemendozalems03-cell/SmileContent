"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  FileText,
  CircleDot,
  Lightbulb,
  Users,
  Tags,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useCurrentProfile } from "@/components/layout/current-profile-provider";
import { ClientSwitcher } from "@/components/layout/client-switcher";
import { can } from "@/lib/auth/roles";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/clients", label: "Clientes", icon: Building2 },
  { href: "/content", label: "Contenido", icon: FileText },
  { href: "/stories", label: "Historias", icon: CircleDot },
  { href: "/ideas", label: "Ideas", icon: Lightbulb },
];

const SETTINGS_ITEMS = [
  { href: "/settings/team", label: "Equipo", icon: Users },
  { href: "/settings/pillars-formats", label: "Pilares y formatos", icon: Tags },
];

function NavLink({
  href,
  label,
  icon: Icon,
  active,
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors",
        active
          ? "bg-accent text-accent-foreground"
          : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
      )}
    >
      <Icon className="size-4 shrink-0" />
      {label}
    </Link>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const profile = useCurrentProfile();

  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-sidebar-border bg-sidebar md:flex">
      <div className="flex h-14 items-center gap-2 px-4">
        <div className="flex size-6 items-center justify-center rounded-md bg-primary text-xs font-bold text-primary-foreground">
          C
        </div>
        <span className="text-sm font-semibold tracking-tight">Content OS</span>
      </div>

      <ClientSwitcher />

      <nav className="flex-1 space-y-0.5 px-3 py-2">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.href}
            {...item}
            active={pathname === item.href || pathname.startsWith(`${item.href}/`)}
          />
        ))}

        {can(profile?.role, "manageTeam") ? (
          <div className="mt-4 space-y-0.5">
            <div className="px-3 pb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground/70">
              Configuración
            </div>
            {SETTINGS_ITEMS.map((item) => (
              <NavLink key={item.href} {...item} active={pathname.startsWith(item.href)} />
            ))}
          </div>
        ) : null}
      </nav>
    </aside>
  );
}
