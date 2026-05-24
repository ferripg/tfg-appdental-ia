/**
 * Spanish tax ID validator (NIF / NIE / CIF).
 *
 * - DNI (8 digits + 1 letter) and NIE (X/Y/Z + 7 digits + 1 letter): full
 *   checksum check via the canonical mod-23 letter table.
 * - CIF (1 letter + 7 digits + 1 control character): full checksum check
 *   using the alternating-digit algorithm.
 *
 * Input is normalised (uppercase + trim) before validation.
 */

const DNI_LETTERS = "TRWAGMYFPDXBNJZSQVHLCKE";
const NIE_PREFIX_TO_DIGIT: Record<string, string> = { X: "0", Y: "1", Z: "2" };
const CIF_CONTROL_LETTERS = "JABCDEFGHI";
const CIF_LETTER_ONLY_TYPES = new Set(["P", "Q", "R", "S", "N", "W"]);
const CIF_DIGIT_ONLY_TYPES = new Set(["A", "B", "E", "H"]);

function checksumDniNie(value: string): boolean {
  let digits = value.slice(0, -1);
  const letter = value.slice(-1);
  const prefix = digits[0];
  if (prefix && prefix in NIE_PREFIX_TO_DIGIT) {
    digits = NIE_PREFIX_TO_DIGIT[prefix] + digits.slice(1);
  }
  if (!/^\d{8}$/.test(digits)) return false;
  const expected = DNI_LETTERS[parseInt(digits, 10) % 23];
  return letter === expected;
}

function checksumCif(value: string): boolean {
  const type = value[0];
  const middle = value.slice(1, 8);
  const control = value.slice(8);
  if (!type || !/^\d{7}$/.test(middle)) return false;

  let oddSum = 0;
  let evenSum = 0;
  for (let i = 0; i < middle.length; i++) {
    const n = parseInt(middle[i]!, 10);
    if (i % 2 === 0) {
      const doubled = n * 2;
      oddSum += Math.floor(doubled / 10) + (doubled % 10);
    } else {
      evenSum += n;
    }
  }
  const total = oddSum + evenSum;
  const controlDigit = (10 - (total % 10)) % 10;
  const controlLetter = CIF_CONTROL_LETTERS[controlDigit];

  if (CIF_LETTER_ONLY_TYPES.has(type)) return control === controlLetter;
  if (CIF_DIGIT_ONLY_TYPES.has(type)) return control === String(controlDigit);
  return control === String(controlDigit) || control === controlLetter;
}

export function isValidNIF(input: string): boolean {
  if (!input) return false;
  const value = input.trim().toUpperCase().replace(/[\s-]/g, "");

  // DNI: 8 digits + 1 letter.
  if (/^\d{8}[A-Z]$/.test(value)) return checksumDniNie(value);

  // NIE: X/Y/Z + 7 digits + 1 letter.
  if (/^[XYZ]\d{7}[A-Z]$/.test(value)) return checksumDniNie(value);

  // CIF: letter (legal-entity type) + 7 digits + 1 control char (digit or letter).
  if (/^[ABCDEFGHJNPQRSUVW]\d{7}[A-J0-9]$/.test(value)) {
    return checksumCif(value);
  }

  return false;
}
