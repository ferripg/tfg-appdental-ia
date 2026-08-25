"use client";

import {
  Boxes,
  Building2,
  FileText,
  LayoutDashboard,
  Percent,
  Receipt,
  ScrollText,
  Tags,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Wordmark } from "@/components/app/wordmark";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";

type NavLink = {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
};

type NavGroup = { label: string; items: NavLink[] };

/**
 * Navegació lateral del layout privat (identitat visual distintiva).
 *
 * Els mateixos enllaços que tenia la capçalera superior, agrupats per àmbit.
 * Només canvia la presentació: rutes, etiquetes i visibilitat per rol són
 * exactament les d'abans (el grup d'administració només es mostra a ADMIN;
 * el control d'accés real continua al servei, no aquí).
 *
 * Responsive: el component Sidebar de shadcn es plega a un rail d'icones
 * (collapsible="icon") i, per sota de md, es converteix en un panell
 * lateral (Sheet) que s'obre amb el SidebarTrigger de la barra superior.
 */
const GROUPS: NavGroup[] = [
  {
    label: "Operativa",
    items: [
      { label: "Tauler", href: "/dashboard", icon: LayoutDashboard },
      { label: "Despeses", href: "/despeses", icon: Receipt },
      { label: "Inventari", href: "/inventari", icon: Boxes },
      { label: "Amortitzacions", href: "/amortitzacions", icon: Percent },
    ],
  },
  {
    label: "Catàlegs",
    items: [
      { label: "Proveïdors", href: "/proveidors", icon: Building2 },
      { label: "Tipus despesa", href: "/tipus-despesa", icon: Tags },
    ],
  },
  {
    label: "Anàlisi",
    items: [{ label: "Informes", href: "/informes", icon: FileText }],
  },
];

const ADMIN_GROUP: NavGroup = {
  label: "Administració",
  items: [
    { label: "Usuaris", href: "/usuaris", icon: Users },
    { label: "Auditoria", href: "/auditoria", icon: ScrollText },
  ],
};

export function AppSidebar({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname();
  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  const groups = isAdmin ? [...GROUPS, ADMIN_GROUP] : GROUPS;

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="h-14 justify-center border-b border-sidebar-border px-4 group-data-[collapsible=icon]:px-0">
        <Link
          href="/dashboard"
          className="flex items-center justify-center group-data-[collapsible=icon]:justify-center"
          aria-label="AppDental — Tauler"
        >
          <Wordmark size="md" className="group-data-[collapsible=icon]:hidden" />
          <span className="hidden font-serif text-2xl font-medium leading-none text-primary group-data-[collapsible=icon]:inline">
            D
          </span>
        </Link>
      </SidebarHeader>

      <SidebarContent className="gap-1 py-2">
        {groups.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
              {group.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive(item.href)}
                      tooltip={item.label}
                    >
                      <Link
                        href={item.href}
                        aria-current={isActive(item.href) ? "page" : undefined}
                      >
                        <item.icon className="size-4" />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarRail />
    </Sidebar>
  );
}
