"use client";

import { useActionState } from "react";
import { loginAction, type LoginState } from "./actions";

export default function LoginPage() {
  const [state, formAction, pending] = useActionState<LoginState, FormData>(
    loginAction,
    null,
  );
  return (
    <main>
      <h1>Inicia sessió</h1>
      <form action={formAction}>
        <p>
          <label htmlFor="email">Email</label>
          <input id="email" name="email" type="email" required />
        </p>
        <p>
          <label htmlFor="password">Contrasenya</label>
          <input id="password" name="password" type="password" required />
        </p>
        <button type="submit" disabled={pending}>
          {pending ? "Entrant…" : "Entrar"}
        </button>
      </form>
      {state?.error && <p>{state.error}</p>}
    </main>
  );
}
