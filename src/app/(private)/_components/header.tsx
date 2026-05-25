import Link from "next/link";
import { NavItem } from "@/components/app/nav-item";
import { Wordmark } from "@/components/app/wordmark";
import { UserMenu } from "./user-menu";

type SessionUser = {
  name?: string | null;
  email: string;
  role?: string | null;
};

const NAV_ITEMS: { label: string; href: string; disabled?: boolean }[] = [
  { label: "Tauler", href: "/dashboard" },
  { label: "Proveïdors", href: "/proveidors" },
  { label: "Tipus despesa", href: "/tipus-despesa" },
  { label: "Despeses", href: "#", disabled: true },
  { label: "Inventari", href: "#", disabled: true },
  { label: "Reports", href: "#", disabled: true },
];

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
          <UserMenu user={user} />
        </div>
      </div>
    </header>
  );
}
