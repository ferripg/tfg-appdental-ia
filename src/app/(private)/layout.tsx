import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Toaster } from "@/components/ui/sonner";
import { auth } from "@/lib/auth";
import packageJson from "../../../package.json";
import { Footer } from "./_components/footer";
import { Header } from "./_components/header";

export default async function PrivateLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  return (
    <div className="flex min-h-svh flex-col">
      <Header user={session.user} />
      <main className="container mx-auto w-full max-w-6xl flex-1 px-6 py-10">
        {children}
      </main>
      <Footer version={packageJson.version} year={new Date().getFullYear()} />
      <Toaster position="top-right" closeButton richColors />
    </div>
  );
}
