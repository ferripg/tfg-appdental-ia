"use client";

import { ChevronDown } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

type Item = { label: string; href: string };

/**
 * Desplegable "Admin" del nav d'escriptori (IA-22): agrupa Usuaris i Auditoria
 * en una sola entrada. El renderitza el Header només per a ADMIN. El trigger
 * queda actiu quan la ruta actual és sota qualsevol de les opcions.
 */
export function AdminMenu({ items }: { items: Item[] }) {
  const pathname = usePathname();
  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);
  const groupActive = items.some((i) => isActive(i.href));

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          "inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-sm transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
          groupActive
            ? "bg-secondary text-secondary-foreground"
            : "text-muted-foreground hover:bg-muted hover:text-foreground",
        )}
      >
        Admin
        <ChevronDown className="size-3.5" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-48">
        {items.map((i) => (
          <DropdownMenuItem key={i.href} asChild>
            <Link
              href={i.href}
              aria-current={isActive(i.href) ? "page" : undefined}
              className={cn(
                "w-full cursor-pointer",
                isActive(i.href) && "bg-secondary text-secondary-foreground",
              )}
            >
              {i.label}
            </Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
