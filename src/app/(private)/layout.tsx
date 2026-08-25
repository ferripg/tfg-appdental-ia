import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { auth } from "@/lib/auth";
import packageJson from "../../../package.json";
import { AppSidebar } from "./_components/app-sidebar";
import { Footer } from "./_components/footer";
import { Header } from "./_components/header";
import { SidebarAutoCollapse } from "./_components/sidebar-auto-collapse";

/**
 * Shell del layout privat (identitat visual distintiva): barra lateral
 * plegable a l'esquerra + barra superior fina + contingut. Només canvia la
 * presentació respecte al layout anterior (capçalera amb nav horitzontal);
 * la comprovació de sessió i el contingut de les pàgines són els mateixos.
 *
 * L'estat obert/plegat de la lateral el desa el component Sidebar de shadcn
 * a la cookie `sidebar_state`; el llegim al servidor perquè la pàgina es
 * renderitzi ja amb l'estat que l'usuari havia triat (sense salt visual).
 */
export default async function PrivateLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const isAdmin = session.user.role === "ADMIN";

  const sidebarCookie = (await cookies()).get("sidebar_state")?.value;
  const hasSidebarPreference = sidebarCookie !== undefined;
  const sidebarDefaultOpen = hasSidebarPreference
    ? sidebarCookie === "true"
    : true;

  return (
    <TooltipProvider delayDuration={0}>
      <SidebarProvider defaultOpen={sidebarDefaultOpen}>
        <SidebarAutoCollapse hasPreference={hasSidebarPreference} />
        <AppSidebar isAdmin={isAdmin} />
        {/* min-w-0: sense això, l'amplada intrínseca de les taules (que fan
            scroll horitzontal per IA-22) empeny tot el layout i el cos de la
            pàgina desborda a tauleta amb la lateral oberta. */}
        <SidebarInset className="min-h-svh min-w-0">
          <Header user={session.user} />
          <div className="mx-auto w-full min-w-0 max-w-7xl flex-1 px-6 py-10 lg:px-10">
            {children}
          </div>
          <Footer
            version={packageJson.version}
            year={new Date().getFullYear()}
          />
          <Toaster position="top-right" closeButton richColors />
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}
