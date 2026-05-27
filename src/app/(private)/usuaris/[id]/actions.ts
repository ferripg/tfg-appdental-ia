"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { DomainError } from "@/domain/errors";
import type { UserRole } from "@/domain/user";
import { usersService } from "@/services/users-service";
import type { UsuariFormState } from "../_components/usuari-form";

/**
 * Bound at the page with `.bind(null, id)` so the form action signature
 * matches `useActionState`'s `(prev, formData) => Promise<state>` contract.
 */
export async function updateUsuariAction(
  id: string,
  _prev: UsuariFormState,
  formData: FormData,
): Promise<UsuariFormState> {
  try {
    await usersService.updateProfile(id, Object.fromEntries(formData));
  } catch (err) {
    if (err instanceof DomainError) {
      return { error: err.message, fieldErrors: err.fieldErrors };
    }
    console.error("[updateUsuariAction] error inesperat:", err);
    return { error: "Error inesperat. Torna-ho a provar més tard." };
  }

  revalidatePath("/usuaris");
  revalidatePath(`/usuaris/${id}`);
  redirect("/usuaris?msg=actualitzat");
}

export async function setRoleAction(
  id: string,
  role: UserRole,
): Promise<void> {
  try {
    await usersService.setRole(id, role);
  } catch (err) {
    if (err instanceof DomainError) {
      // Last-admin / self-edit refusal surfaces in the URL so the detail
      // page can show a toast. We keep the user on the detail to retry.
      redirect(`/usuaris/${id}?msg=error`);
    }
    console.error("[setRoleAction] error inesperat:", err);
    redirect(`/usuaris/${id}?msg=error`);
  }
  revalidatePath("/usuaris");
  revalidatePath(`/usuaris/${id}`);
  redirect(`/usuaris/${id}?msg=rol-canviat`);
}

export async function setActiuAction(
  id: string,
  actiu: boolean,
): Promise<void> {
  try {
    await usersService.setActiu(id, actiu);
  } catch (err) {
    if (err instanceof DomainError) {
      redirect(`/usuaris/${id}?msg=error`);
    }
    console.error("[setActiuAction] error inesperat:", err);
    redirect(`/usuaris/${id}?msg=error`);
  }
  revalidatePath("/usuaris");
  revalidatePath(`/usuaris/${id}`);
  redirect(`/usuaris?msg=${actiu ? "reactivat" : "desactivat"}`);
}
