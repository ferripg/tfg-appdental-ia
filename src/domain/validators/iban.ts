/**
 * IBAN validator with full mod-97 checksum.
 *
 * Supports any IBAN format (length per country); we are loose by design to
 * not block legitimate international suppliers, but always enforce mod-97.
 */
export function isValidIBAN(input: string): boolean {
  if (!input) return false;
  const value = input.replace(/\s/g, "").toUpperCase();
  if (!/^[A-Z]{2}\d{2}[A-Z0-9]{1,30}$/.test(value)) return false;
  if (value.length < 15 || value.length > 34) return false;

  // Move first 4 chars to the end and replace each letter with its
  // 2-digit numeric value (A=10 … Z=35), then check mod 97 === 1.
  const rearranged = value.slice(4) + value.slice(0, 4);
  let numeric = "";
  for (const ch of rearranged) {
    if (ch >= "0" && ch <= "9") numeric += ch;
    else numeric += String(ch.charCodeAt(0) - 55);
  }

  // mod 97 in chunks because the full number exceeds Number.MAX_SAFE_INTEGER.
  let remainder = 0;
  for (let i = 0; i < numeric.length; i += 7) {
    const chunk = String(remainder) + numeric.slice(i, i + 7);
    remainder = parseInt(chunk, 10) % 97;
  }
  return remainder === 1;
}
