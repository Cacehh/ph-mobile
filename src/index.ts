import { PREFIXES, type Network } from './prefixes.ts';

export type { Network };

/**
 * Reduce any common way of writing a PH mobile number to its 10 digits
 * after the leading 0, e.g. "9171234567". Returns null if it isn't one.
 *
 * Accepts 09171234567, 9171234567, 639171234567, +63 917 123 4567,
 * (0917) 123-4567 and similar.
 */
export function normalize(input: string): string | null {
  const digits = input.replace(/[\s().-]/g, '').replace(/^\+/, '');
  if (!/^\d+$/.test(digits)) return null;

  let local: string;
  if (digits.length === 12 && digits.startsWith('63')) local = digits.slice(2);
  else if (digits.length === 11 && digits.startsWith('0')) local = digits.slice(1);
  else if (digits.length === 10) local = digits;
  else return null;

  return local.startsWith('9') || local.startsWith('8') ? local : null;
}

/** True if the input is a PH mobile number on a known prefix. */
export function isValid(input: string): boolean {
  return network(input) !== null;
}

/** The network that issued the number, or null if unknown or invalid. */
export function network(input: string): Network | null {
  const n = normalize(input);
  return n ? (PREFIXES['0' + n.slice(0, 3)] ?? null) : null;
}

/** "+639171234567" */
export function toE164(input: string): string | null {
  const n = normalize(input);
  return n ? '+63' + n : null;
}

/** "0917 123 4567" */
export function format(input: string): string | null {
  const n = normalize(input);
  return n ? `0${n.slice(0, 3)} ${n.slice(3, 6)} ${n.slice(6)}` : null;
}
