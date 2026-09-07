"use client";

// Runs in the browser (Web Crypto API), not on the server — this is just
// a helpful suggestion tool for the user, not a security-critical
// operation, so client-side generation is fine here.
const CHARSETS = {
  lower: "abcdefghijklmnopqrstuvwxyz",
  upper: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  digits: "0123456789",
  symbols: "!@#$%^&*()-_=+[]{}"
};

export function generatePassword(length = 20): string {
  const pool = CHARSETS.lower + CHARSETS.upper + CHARSETS.digits + CHARSETS.symbols;
  const bytes = new Uint32Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => pool[b % pool.length]).join("");
}
