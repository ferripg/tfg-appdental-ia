"use client";

import { Menu } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

type Item = { label: string; href: string };

/**
 * Navegació mòbil (IA-22): botó hamburguesa (visible només per sota del
 * breakpoint md) que obre TOTS els enllaços, inclosos els d'admin si escau.
 * Manté l'estat actiu via usePathname (sense tocar el NavItem d'escriptori).
 */
export function MobileNav({
  regular,
  admin,
}: {
  regular: Item[];
  admin: Item[];
}) {
  const pathname = usePathname();

  function renderLink(i: Item) {
    const active = pathname === i.href || pathname.startsWith(`${i.href}/`);
    return (
      <DropdownMenuItem key={i.href} asChild>
        <Link
          href={i.href}
          aria-current={active ? "page" : undefined}
          className={cn(
            "w-full cursor-pointer",
            active && "bg-secondary text-secondary-foreground",
          )}
        >
          {i.label}
        </Link>
      </DropdownMenuItem>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          aria-label="Obre el menú de navegació"
        >
          <Menu className="size-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {regular.map(renderLink)}
        {admin.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-[11px] uppercase tracking-wider text-muted-foreground">
              Admin
            </DropdownMenuLabel>
            {admin.map(renderLink)}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
