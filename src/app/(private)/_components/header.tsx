import { ChevronDown, LogOut } from "lucide-react";
import Link from "next/link";
import { NavItem } from "@/components/app/nav-item";
import { Wordmark } from "@/components/app/wordmark";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { logoutAction } from "../dashboard/actions";

type SessionUser = {
  name?: string | null;
  email: string;
  role?: string | null;
};

const NAV_ITEMS: { label: string; href: string; disabled?: boolean }[] = [
  { label: "Tauler", href: "/dashboard" },
  { label: "Despeses", href: "#", disabled: true },
  { label: "Proveïdors", href: "/proveidors" },
  { label: "Inventari", href: "#", disabled: true },
  { label: "Reports", href: "#", disabled: true },
];

function initials(user: SessionUser): string {
  const source = user.name?.trim() || user.email;
  return (
    source
      .split(/[\s@.]+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "·"
  );
}

export function Header({ user }: { user: SessionUser }) {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/65">
      <div className="container mx-auto flex h-14 max-w-6xl items-center gap-6 px-6">
        <Link href="/dashboard" className="shrink-0">
          <Wordmark size="md" />
        </Link>

        <nav className="hidden flex-1 items-center gap-1 md:flex">
          {NAV_ITEMS.map((item) => (
            <NavItem key={item.label} {...item} />
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              {/*
                suppressHydrationWarning: Radix DropdownMenu injecta
                aria-controls/aria-expanded/data-state al trigger durant la
                hidratació; un Server Component pare provoca un mismatch
                inofensiu però soroll als logs.
              */}
              <Button
                variant="ghost"
                size="sm"
                className="h-9 gap-2 px-2"
                aria-label="Menú d'usuari"
                suppressHydrationWarning
              >
                <Avatar size="sm">
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                    {initials(user)}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden max-w-[12rem] truncate text-sm md:inline">
                  {user.email}
                </span>
                <ChevronDown className="size-3.5 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <DropdownMenuLabel className="space-y-1">
                <p className="truncate text-sm font-medium">
                  {user.name || "Usuari"}
                </p>
                <p className="truncate text-xs font-normal text-muted-foreground">
                  {user.email}
                </p>
                {user.role && (
                  <p className="pt-1">
                    <span className="inline-flex items-center rounded-full border border-border bg-secondary/70 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-secondary-foreground">
                      {user.role}
                    </span>
                  </p>
                )}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <form action={logoutAction}>
                <DropdownMenuItem asChild>
                  <button type="submit" className="w-full cursor-pointer">
                    <LogOut className="size-4" />
                    Tanca sessió
                  </button>
                </DropdownMenuItem>
              </form>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
