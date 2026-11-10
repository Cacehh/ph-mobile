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

export type Status =
  | 'empty'          // nothing typed yet
  | 'incomplete'     // looks like a mobile number so far, fewer than 11 digits
  | 'valid'          // 11 digits on a known prefix
  | 'unknown_prefix' // 11 digits, prefix not in the list
  | 'not_mobile'     // doesn't start like a PH mobile number
  | 'too_long'       // more than 11 digits
  | 'invalid_chars'; // something other than digits, spaces, + ( ) . -

export interface Parsed {
  status: Status;
  valid: boolean;
  /** Digits so far in local form, e.g. "0917123". */
  digits: string;
  /** "0917" once there are 4 digits. */
  prefix: string | null;
  network: Network | null;
  /** "0917 123 4567" when valid or unknown_prefix. */
  local: string | null;
  /** "+639171234567" when valid or unknown_prefix. */
  international: string | null;
}

/**
 * Everything about an input in one call, including in-between states,
 * so a form can give feedback while someone is still typing.
 */
export function parse(input: string): Parsed {
  const base: Parsed = { status: 'empty', valid: false, digits: '', prefix: null, network: null, local: null, international: null };
  const s = input.trim();
  if (!s) return base;
  if (/[^\d\s+().-]/.test(s)) return { ...base, status: 'invalid_chars' };

  let d = s.replace(/\D/g, '');
  if (d.startsWith('63')) d = '0' + d.slice(2);
  else if (d.startsWith('9')) d = '0' + d;

  const prefix = d.length >= 4 ? d.slice(0, 4) : null;
  const out = { ...base, digits: d, prefix };
  if (d.length > 1 && !d.startsWith('09') && !d.startsWith('08')) return { ...out, status: 'not_mobile' };
  if (d.length < 11) return { ...out, status: 'incomplete' };
  if (d.length > 11) return { ...out, status: 'too_long' };

  const n = d.slice(1);
  const formatted = { local: `${d.slice(0, 4)} ${d.slice(4, 7)} ${d.slice(7)}`, international: '+63' + n };
  const net = PREFIXES[d.slice(0, 4)] ?? null;
  return net
    ? { ...out, ...formatted, status: 'valid', valid: true, network: net }
    : { ...out, ...formatted, status: 'unknown_prefix' };
}
