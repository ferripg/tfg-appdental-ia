"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

type NavItemProps = {
  label: string;
  href: string;
  disabled?: boolean;
};

export function NavItem({ label, href, disabled }: NavItemProps) {
  const pathname = usePathname();
  const isActive = !disabled && (pathname === href || pathname.startsWith(`${href}/`));

  return (
    <Link
      href={href}
      aria-disabled={disabled || undefined}
      aria-current={isActive ? "page" : undefined}
      tabIndex={disabled ? -1 : 0}
      className={cn(
        "rounded-md px-3 py-1.5 text-sm transition-colors",
        isActive
          ? "bg-secondary text-secondary-foreground"
          : disabled
            ? "pointer-events-none text-muted-foreground/60"
            : "text-muted-foreground hover:bg-muted hover:text-foreground",
      )}
    >
      {label}
      {disabled && (
        <span className="ml-1.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground/70">
          aviat
        </span>
      )}
    </Link>
  );
}
