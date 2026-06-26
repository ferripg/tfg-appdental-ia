"use client";

import { ChevronDown, KeyRound, LogOut } from "lucide-react";
import Link from "next/link";
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

/**
 * Client-only user menu. Extracted from the Server Component Header so the
 * Radix DropdownMenu (which injects `id`/`aria-controls`/`data-state` only
 * at hydration time) never has a server-rendered counterpart to mismatch
 * against. The Server renders the shell, the Client mounts the menu fresh.
 */
export function UserMenu({ user }: { user: SessionUser }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-9 gap-2 px-2"
          aria-label="Menú d'usuari"
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
        <DropdownMenuItem asChild>
          <Link href="/canvi-contrasenya" className="w-full cursor-pointer">
            <KeyRound className="size-4" />
            Canviar contrasenya
          </Link>
        </DropdownMenuItem>
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
  );
}
