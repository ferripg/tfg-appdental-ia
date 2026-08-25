import Link from "next/link";
import { Wordmark } from "@/components/app/wordmark";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { UserMenu } from "./user-menu";

type SessionUser = {
  name?: string | null;
  email: string;
  role?: string | null;
};

/**
 * Barra superior del layout privat (identitat visual distintiva).
 *
 * La navegació ha passat a la barra lateral (AppSidebar); aquí només queda
 * el commutador de la barra lateral (plega/desplega a escriptori, obre el
 * panell a mòbil), el wordmark quan la lateral està amagada (mòbil) i el
 * menú d'usuari, que és exactament el d'abans.
 */
export function Header({ user }: { user: SessionUser }) {
  return (
    <header className="sticky top-0 z-40 flex h-14 shrink-0 items-center gap-3 border-b border-border bg-background/85 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/65 md:px-6">
      <SidebarTrigger aria-label="Commuta la barra lateral" />
      <Link href="/dashboard" className="md:hidden">
        <Wordmark size="sm" />
      </Link>
      <div className="ml-auto flex items-center gap-2">
        <UserMenu user={user} />
      </div>
    </header>
  );
}
