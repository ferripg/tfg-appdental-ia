/**
 * Translate a Zod issue list into a `fieldErrors` map keyed by the first
 * path segment of each issue. Server Actions use this shape to surface
 * inline errors next to each form field.
 *
 * Extracted to a shared module after the 3rd CRUD generated the same
 * pattern (IA-6 + IA-7 had copies; IA-8 would have been the 3rd).
 */
export function flattenZodErrors(error: unknown): Record<string, string[]> {
  if (
    typeof error === "object" &&
    error !== null &&
    "issues" in error &&
    Array.isArray((error as { issues: unknown[] }).issues)
  ) {
    const out: Record<string, string[]> = {};
    for (const issue of (
      error as {
        issues: { path: PropertyKey[]; message: string }[];
      }
    ).issues) {
      const key = issue.path[0] != null ? String(issue.path[0]) : "_form";
      (out[key] ??= []).push(issue.message);
    }
    return out;
  }
  return {};
}
