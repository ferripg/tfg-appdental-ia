/**
 * Peu de pàgina del layout privat (IA-22). Discret, a tota l'amplada, sota el
 * contingut. Mostra el nom + descripció de l'app i la versió (del package.json)
 * amb el copyright de l'any en curs. Rep `version` i `year` del layout (servidor).
 */
export function Footer({ version, year }: { version: string; year: number }) {
  return (
    <footer className="border-t border-border bg-background/60">
      <div className="container mx-auto flex max-w-6xl flex-col items-center justify-between gap-1.5 px-6 py-5 text-xs text-muted-foreground sm:flex-row">
        <p>
          <span className="font-medium text-foreground">AppDental</span> ·
          Gestió de clínica dental
        </p>
        <p className="font-mono tabular-nums">
          v{version} · © {year}
        </p>
      </div>
    </footer>
  );
}
