import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { logoutAction } from "./actions";

export default async function DashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");
  return (
    <main>
      <h1>Tauler</h1>
      <p>Sessió iniciada com a: {session.user.email}</p>
      <form action={logoutAction}>
        <button type="submit">Tanca sessió</button>
      </form>
    </main>
  );
}
