/**
 * Grups del Pla General Comptable (PGC) — font única compartida pel
 * desplegable del formulari de tipus de despesa i per la visualització
 * llegible (llistat i fitxa). Mòdul pur i sense dependències perquè el pugui
 * importar tant el client (formulari) com el servidor sense arrossegar Zod.
 *
 * El valor que es DESA segueix sent el número (camp `grup`, 1–9, opcional);
 * `nom` només és l'etiqueta que es mostra.
 */

export const GRUPS_PGC = [
  { valor: 1, nom: "Finançament bàsic" },
  { valor: 2, nom: "Actiu no corrent (immobilitzat)" },
  { valor: 3, nom: "Existències" },
  { valor: 4, nom: "Creditors i deutors per operacions comercials" },
  { valor: 5, nom: "Comptes financers" },
  { valor: 6, nom: "Compres i despeses" },
  { valor: 7, nom: "Vendes i ingressos" },
  { valor: 8, nom: "Despeses imputades al patrimoni net" },
  { valor: 9, nom: "Ingressos imputats al patrimoni net" },
] as const;

/** Nom del grup PGC a partir del número (null si no n'hi ha o no és vàlid). */
export function nomGrupPGC(grup: number | null | undefined): string | null {
  return GRUPS_PGC.find((g) => g.valor === grup)?.nom ?? null;
}
