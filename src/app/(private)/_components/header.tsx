import Link from "next/link";
import { NavItem } from "@/components/app/nav-item";
import { Wordmark } from "@/components/app/wordmark";
import { AdminMenu } from "./admin-menu";
import { MobileNav } from "./mobile-nav";
import { UserMenu } from "./user-menu";

type SessionUser = {
  name?: string | null;
  email: string;
  role?: string | null;
};

type NavLink = { label: string; href: string };

// Enllaços normals (solts al nav). L'estat actiu el gestiona NavItem.
const REGULAR_ITEMS: NavLink[] = [
  { label: "Tauler", href: "/dashboard" },
  { label: "Proveïdors", href: "/proveidors" },
  { label: "Tipus despesa", href: "/tipus-despesa" },
  { label: "Despeses", href: "/despeses" },
  { label: "Inventari", href: "/inventari" },
  { label: "Amortitzacions", href: "/amortitzacions" },
  { label: "Informes", href: "/informes" },
];

// Enllaços d'administració, agrupats sota el desplegable "Admin" (només ADMIN).
const ADMIN_ITEMS: NavLink[] = [
  { label: "Usuaris", href: "/usuaris" },
  { label: "Auditoria", href: "/auditoria" },
];

export function Header({ user }: { user: SessionUser }) {
  const isAdmin = user.role === "ADMIN";

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/65">
      <div className="container mx-auto flex h-14 max-w-6xl items-center gap-6 px-6">
        <Link href="/dashboard" className="shrink-0">
          <Wordmark size="md" />
        </Link>

        {/* Navegació d'escriptori (≥ lg): enllaços solts + grup Admin. Per sota
            de lg (mòbil i tauleta tipus iPad) s'amaga i s'usa la hamburguesa,
            perquè la nav sencera no hi cap i desbordava cap a la dreta. */}
        <nav className="hidden min-w-0 flex-1 items-center gap-1 lg:flex">
          {REGULAR_ITEMS.map((item) => (
            <NavItem key={item.href} {...item} />
          ))}
          {isAdmin && <AdminMenu items={ADMIN_ITEMS} />}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          {/* Hamburguesa (només mòbil) amb tots els enllaços */}
          <MobileNav
            regular={REGULAR_ITEMS}
            admin={isAdmin ? ADMIN_ITEMS : []}
          />
          <UserMenu user={user} />
        </div>
      </div>
    </header>
  );
}
